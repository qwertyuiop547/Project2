import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Crosshair, ExternalLink, Loader2, Check, AlertCircle, Search, Layers, Move } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationPickerMap.css'

// Fix Leaflet default marker icons in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom High-Visibility Animated Pin Icon
const pinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
        <div class="pin-wrapper">
            <div class="pin-pulse"></div>
            <div class="pin-marker">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
                </svg>
            </div>
        </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
})

// Default coordinates (Barangay Burgos, Basey, Samar, Philippines)
const DEFAULT_LAT = 11.312381
const DEFAULT_LNG = 125.151126

export default function LocationPickerMap({ value, onChange, readOnly = false, initialCoords = null }) {
    const mapContainerRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markerRef = useRef(null)
    const tileLayerRef = useRef(null)

    const [coords, setCoords] = useState(() => {
        if (initialCoords?.lat && initialCoords?.lng) {
            return { lat: parseFloat(initialCoords.lat), lng: parseFloat(initialCoords.lng) }
        }
        if (value && typeof value === 'string') {
            const match = value.match(/\[([0-9.-]+),\s*([0-9.-]+)\]/)
            if (match) {
                return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
            }
        }
        return { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
    })

    const [isLocating, setIsLocating] = useState(false)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [gpsAccuracy, setGpsAccuracy] = useState(null)
    const [addressText, setAddressText] = useState(value || '')
    // Default to Satellite View
    const [mapType, setMapType] = useState('satellite') // 'satellite' | 'streets'
    const [statusMessage, setStatusMessage] = useState(null)

    // Synchronize text changes
    useEffect(() => {
        if (value && value !== addressText) {
            setAddressText(value)
            const match = value.match(/\[([0-9.-]+),\s*([0-9.-]+)\]/)
            if (match) {
                const newLat = parseFloat(match[1])
                const newLng = parseFloat(match[2])
                setCoords({ lat: newLat, lng: newLng })
                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([newLat, newLng])
                    mapInstanceRef.current.setView([newLat, newLng], mapInstanceRef.current.getZoom())
                }
            }
        }
    }, [value])

    // Initialize Leaflet Interactive Map
    useEffect(() => {
        if (!mapContainerRef.current) return

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [coords.lat, coords.lng],
                zoom: 17,
                zoomControl: false,
                scrollWheelZoom: !readOnly,
                dragging: true,
                attributionControl: false
            })

            L.control.zoom({ position: 'bottomright' }).addTo(map)

            // High-Resolution Satellite Tile Layer
            const satelliteTiles = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 21,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            })

            satelliteTiles.addTo(map)
            tileLayerRef.current = satelliteTiles

            // Add Draggable Pin Marker
            const marker = L.marker([coords.lat, coords.lng], {
                icon: pinIcon,
                draggable: !readOnly,
                autoPan: true
            }).addTo(map)

            if (!readOnly) {
                marker.bindPopup('<b>🎯 Exact Location</b><br/>Drag the pin or click the map to pinpoint.').openPopup()

                // On Marker Drag End
                marker.on('dragend', async (e) => {
                    const pos = e.target.getLatLng()
                    const newCoords = { lat: pos.lat, lng: pos.lng }
                    setCoords(newCoords)
                    await reverseGeocode(pos.lat, pos.lng)
                })

                // On Map Click -> Move Pin
                map.on('click', async (e) => {
                    const { lat, lng } = e.latlng
                    marker.setLatLng([lat, lng])
                    map.panTo([lat, lng])
                    setCoords({ lat, lng })
                    await reverseGeocode(lat, lng)
                })
            }

            markerRef.current = marker
            mapInstanceRef.current = map
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Switch Tile Layer (Satellite vs Street Map)
    const handleSwitchMapType = (type) => {
        setMapType(type)
        if (!mapInstanceRef.current) return

        if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current)
        }

        let newTileLayer
        if (type === 'satellite') {
            newTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 21
            })
        } else {
            newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            })
        }

        newTileLayer.addTo(mapInstanceRef.current)
        tileLayerRef.current = newTileLayer
    }

    // High-Accuracy Multi-Source Reverse Geocoding
    const reverseGeocode = async (lat, lng, accuracyVal = null) => {
        setIsGeocoding(true)
        try {
            // Check Photon first for specific landmarks / schools / roads
            let resolvedPlace = null

            try {
                const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
                if (photonRes.ok) {
                    const photonData = await photonRes.json()
                    const feat = photonData.features?.[0]?.properties
                    if (feat) {
                        const name = feat.name || ''
                        const street = feat.street || ''
                        const city = feat.city || feat.district || feat.locality || ''

                        if (name && !name.toLowerCase().includes('philippines')) {
                            resolvedPlace = [name, street, city].filter(Boolean).join(', ')
                        } else if (street) {
                            resolvedPlace = [street, city].filter(Boolean).join(', ')
                        }
                    }
                }
            } catch (err) {
                // Photon fallback
            }

            // If not resolved from Photon, fetch Nominatim
            if (!resolvedPlace) {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                    {
                        headers: {
                            'Accept-Language': 'en',
                            'User-Agent': 'BarangayPortal/1.0'
                        }
                    }
                )
                if (response.ok) {
                    const data = await response.json()
                    if (data?.display_name) {
                        const addr = data.address || {}
                        const road = addr.road || addr.street || addr.pedestrian || ''
                        let suburb = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || ''
                        const city = addr.city || addr.town || addr.municipality || ''

                        // Fix generic Panugmonon OSM tag when in Basey / Burgos area
                        if (suburb.toLowerCase() === 'panugmonon' || (city.toLowerCase() === 'basey' && (!suburb || suburb.toLowerCase() === 'panugmonon'))) {
                            suburb = 'Barangay Burgos'
                        }

                        resolvedPlace = [road, suburb, city].filter(Boolean).join(', ')
                        if (!resolvedPlace) {
                            resolvedPlace = data.display_name.split(',').slice(0, 3).join(',').trim()
                        }
                    }
                }
            }

            // If it resolved to Panugmonon in Basey, clean it to Barangay Burgos
            if (resolvedPlace && resolvedPlace.toLowerCase().includes('panugmonon')) {
                resolvedPlace = resolvedPlace.replace(/panugmonon/gi, 'Barangay Burgos')
            }

            if (resolvedPlace) {
                const fullFormatted = `${resolvedPlace} [${lat.toFixed(6)}, ${lng.toFixed(6)}]`
                setAddressText(fullFormatted)
                if (onChange) {
                    onChange(fullFormatted, { lat, lng, accuracy: accuracyVal })
                }
                const accText = accuracyVal ? ` (Accuracy: ±${accuracyVal}m)` : ''
                setStatusMessage({
                    type: 'success',
                    text: `🎯 Pin location updated: ${resolvedPlace}${accText}`
                })
                return
            }
        } catch (e) {
            console.warn('Reverse geocode error:', e)
        } finally {
            setIsGeocoding(false)
        }

        const coordString = `Location [${lat.toFixed(6)}, ${lng.toFixed(6)}]`
        setAddressText(coordString)
        if (onChange) {
            onChange(coordString, { lat, lng, accuracy: accuracyVal })
        }
    }

    // Forward Search by landmark/street name
    const handleSearchLocation = async (e) => {
        e?.preventDefault?.()
        const query = addressText.replace(/\[[0-9.-]+,\s*[0-9.-]+\]/g, '').trim()
        if (!query) return

        setIsSearching(true)
        setStatusMessage({ type: 'info', text: `Searching for "${query}" on satellite map...` })

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Philippines')}&format=json&limit=1`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'BarangayPortal/1.0'
                    }
                }
            )
            if (response.ok) {
                const results = await response.json()
                if (results && results.length > 0) {
                    const newLat = parseFloat(results[0].lat)
                    const newLng = parseFloat(results[0].lon)
                    setCoords({ lat: newLat, lng: newLng })

                    if (mapInstanceRef.current && markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng])
                        mapInstanceRef.current.flyTo([newLat, newLng], 18, { duration: 1.2 })
                    }

                    const fullFormatted = `${query} [${newLat.toFixed(6)}, ${newLng.toFixed(6)}]`
                    setAddressText(fullFormatted)
                    if (onChange) {
                        onChange(fullFormatted, { lat: newLat, lng: newLng })
                    }
                    setStatusMessage({
                        type: 'success',
                        text: `🎯 Pinned to "${results[0].display_name.split(',')[0]}"`
                    })
                    setIsSearching(false)
                    return
                }
            }
            setStatusMessage({
                type: 'error',
                text: `Location "${query}" not found. Please try dragging the pin directly on the map.`
            })
        } catch (err) {
            console.warn('Search error:', err)
            setStatusMessage({ type: 'error', text: 'Error searching for location.' })
        } finally {
            setIsSearching(false)
        }
    }

    // High Precision Live GPS
    const handleGetLiveLocation = () => {
        if (!navigator.geolocation) {
            setStatusMessage({ type: 'error', text: 'GPS Geolocation is not supported on this browser.' })
            return
        }

        setIsLocating(true)
        setStatusMessage({ type: 'info', text: '🛰️ Acquiring high-precision GPS satellite fix...' })

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : null

                setCoords({ lat, lng })
                setGpsAccuracy(accuracy)
                setIsLocating(false)

                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([lat, lng])
                    mapInstanceRef.current.flyTo([lat, lng], 19, { duration: 1.5 })
                }

                await reverseGeocode(lat, lng, accuracy)
            },
            (error) => {
                setIsLocating(false)
                let msg = 'Unable to get GPS location. Please click or drag the pin on the map.'
                if (error.code === error.PERMISSION_DENIED) {
                    msg = 'Location permission denied. Please allow location access in browser settings for GPS fix.'
                }
                setStatusMessage({ type: 'error', text: msg })
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        )
    }

    const handleManualAddressChange = (e) => {
        const text = e.target.value
        setAddressText(text)
        if (onChange) {
            onChange(text, coords)
        }
    }

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`

    return (
        <div className="location-picker-container">
            {/* Control Bar */}
            {!readOnly && (
                <div className="location-controls-bar">
                    <button
                        type="button"
                        className={`live-gps-btn ${isLocating ? 'locating' : ''}`}
                        onClick={handleGetLiveLocation}
                        disabled={isLocating || isGeocoding || isSearching}
                    >
                        {isLocating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Acquiring GPS Satellite Fix...</span>
                            </>
                        ) : (
                            <>
                                <span className="gps-live-dot"></span>
                                <Navigation size={16} />
                                <span>Detect My Exact Location (Live GPS)</span>
                            </>
                        )}
                    </button>

                    {coords.lat && coords.lng && (
                        <div className="coordinates-chip" title="Exact GPS Coordinates (WGS84)">
                            <Crosshair size={13} className="text-blue-600" />
                            <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
                            {gpsAccuracy && (
                                <span className={`accuracy-tag ${gpsAccuracy <= 15 ? 'accuracy-good' : 'accuracy-med'}`}>
                                    ±{gpsAccuracy}m {gpsAccuracy <= 15 ? '🎯 High Precision' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Status Alert Banner */}
            {statusMessage && (
                <div className={`location-status-banner banner-${statusMessage.type} animate-fadeIn`}>
                    {statusMessage.type === 'success' && <Check size={16} />}
                    {statusMessage.type === 'error' && <AlertCircle size={16} />}
                    {statusMessage.type === 'info' && <Loader2 size={16} className="animate-spin" />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Interactive Leaflet Satellite Map View */}
            <div className="map-view-wrapper">
                <div ref={mapContainerRef} className="leaflet-map-element" />

                {/* Map Floating Top Toolbar */}
                <div className="map-top-bar">
                    <div className="map-overlay-badge" title="Live Interactive Pinpoint Map">
                        <span className="satellite-pulse-dot"></span>
                        <MapPin size={13} className="map-pin-icon" />
                        <span className="badge-text">
                            {mapType === 'satellite' ? 'Satellite' : 'Map'} View
                        </span>
                    </div>

                    {/* Satellite / Street Layer Switcher */}
                    <div className="map-layer-toggles">
                        <button
                            type="button"
                            className={`layer-toggle-btn ${mapType === 'satellite' ? 'active' : ''}`}
                            onClick={() => handleSwitchMapType('satellite')}
                            title="Combined Satellite Imagery with Street Labels"
                        >
                            🛰️ <span className="toggle-label">Satellite</span>
                        </button>
                        <button
                            type="button"
                            className={`layer-toggle-btn ${mapType === 'streets' ? 'active' : ''}`}
                            onClick={() => handleSwitchMapType('streets')}
                            title="Standard Street Map View"
                        >
                            🗺️ <span className="toggle-label">Map</span>
                        </button>
                    </div>
                </div>

                {/* Map Floating Bottom Toolbar */}
                <div className="map-bottom-bar">
                    {!readOnly ? (
                        <div className="map-pin-tip">
                            <Move size={11} />
                            <span className="pin-tip-text">Drag pin to adjust</span>
                        </div>
                    ) : <div></div>}

                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-directions-btn"
                        title="Open driving / walking directions in Google Maps"
                    >
                        <ExternalLink size={11} />
                        <span>Directions</span>
                    </a>
                </div>
            </div>

            {/* Address search & input field */}
            <div className="address-input-wrapper">
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                        <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Exact Location Details / Landmark:
                    </span>
                    {!readOnly && (
                        <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                            📍 You can click or drag the pin on the map above
                        </span>
                    )}
                </label>

                <div className="search-input-group">
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. Block 5 Lot 10, Corner Rizal St. in front of basketball court"
                        value={addressText}
                        onChange={handleManualAddressChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(e)}
                        readOnly={readOnly}
                    />
                    {!readOnly && (
                        <button
                            type="button"
                            className="pinpoint-search-btn"
                            onClick={handleSearchLocation}
                            disabled={isSearching || !addressText.trim()}
                            title="Pin the location on the map"
                        >
                            {isSearching ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Search size={15} />
                                    <span>Pin on Map</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
