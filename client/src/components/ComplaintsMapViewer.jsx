import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Eye, Layers } from 'lucide-react'
import './ComplaintsMapViewer.css'

// Default center (Barangay Burgos, Basey, Samar, Philippines)
const DEFAULT_LAT = 11.312381
const DEFAULT_LNG = 125.151126

const createPinIcon = (status) => {
    let color = '#dc2626' // Red - Pending
    let label = 'P'
    if (status === 'IN_PROGRESS') {
        color = '#d97706' // Amber - In Progress
        label = 'IP'
    } else if (status === 'RESOLVED' || status === 'CLOSED') {
        color = '#16a34a' // Green - Resolved
        label = '✓'
    }

    return L.divIcon({
        className: 'incident-cluster-pin',
        html: `
            <div class="incident-pin-wrapper">
                <div class="incident-pin-halo" style="background: ${color}40"></div>
                <div class="incident-pin-body" style="background: ${color}">
                    <span>${label}</span>
                </div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18]
    })
}

export default function ComplaintsMapViewer({ complaints = [] }) {
    const mapContainerRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markersGroupRef = useRef(null)
    const tileLayerRef = useRef(null)

    const [mapType, setMapType] = useState('satellite') // 'satellite' | 'streets'
    const [selectedStatus, setSelectedStatus] = useState('ALL')

    // Filter complaints with valid coordinates
    const mappedComplaints = complaints.map(c => {
        if (!c.location) return null
        const match = c.location.match(/\[([0-9.-]+),\s*([0-9.-]+)\]/)
        if (match) {
            return {
                ...c,
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            }
        }
        return null
    }).filter(Boolean)

    const filteredComplaints = selectedStatus === 'ALL'
        ? mappedComplaints
        : mappedComplaints.filter(c => c.status === selectedStatus)

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return

        if (!mapInstanceRef.current) {
            const initialCenter = mappedComplaints.length > 0
                ? [mappedComplaints[0].lat, mappedComplaints[0].lng]
                : [DEFAULT_LAT, DEFAULT_LNG]

            const map = L.map(mapContainerRef.current, {
                center: initialCenter,
                zoom: 16,
                zoomControl: false,
                attributionControl: false
            })

            L.control.zoom({ position: 'bottomright' }).addTo(map)

            // Google Satellite Hybrid Tiles
            const satelliteTiles = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 21
            }).addTo(map)

            tileLayerRef.current = satelliteTiles
            markersGroupRef.current = L.featureGroup().addTo(map)
            mapInstanceRef.current = map
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Update markers when filtered complaints change
    useEffect(() => {
        if (!mapInstanceRef.current || !markersGroupRef.current) return

        markersGroupRef.current.clearLayers()

        if (filteredComplaints.length === 0) return

        filteredComplaints.forEach(complaint => {
            const marker = L.marker([complaint.lat, complaint.lng], {
                icon: createPinIcon(complaint.status)
            })

            const popupContent = `
                <div class="incident-popup-content">
                    <div class="popup-status-badge badge-${complaint.status?.toLowerCase().replace('_', '-')}">
                        ${complaint.status}
                    </div>
                    <h4 class="popup-title">${complaint.title || 'Complaint'}</h4>
                    <p class="popup-category">🏷️ ${complaint.category?.name || 'General'}</p>
                    <p class="popup-location">📍 ${complaint.location?.split('[')[0] || 'Pinned Location'}</p>
                    <div class="popup-meta">
                        <span>👤 ${complaint.isAnonymous ? 'Anonymous' : `${complaint.user?.firstName || ''} ${complaint.user?.lastName || ''}`}</span>
                    </div>
                    <a href="/complaints/${complaint.id}" class="popup-view-btn">
                        View Complaint & Open GPS &rarr;
                    </a>
                </div>
            `

            marker.bindPopup(popupContent)
            markersGroupRef.current.addLayer(marker)
        })

        // Fit map bounds to show all markers nicely
        if (filteredComplaints.length > 0) {
            mapInstanceRef.current.fitBounds(markersGroupRef.current.getBounds(), {
                padding: [40, 40],
                maxZoom: 18
            })
        }
    }, [filteredComplaints])

    // Toggle Satellite vs Streets
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

    return (
        <div className="complaints-map-card animate-fadeIn">
            <div className="complaints-map-header">
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="live-radar-dot"></span>
                        🛰️ Barangay Incident Live Satellite Map (Staff & Admin View)
                    </h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        All pinned community complaints are mapped here in real-time.
                    </p>
                </div>

                {/* Status Filter Chips */}
                <div className="map-filter-chips">
                    <button
                        type="button"
                        className={`map-chip ${selectedStatus === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('ALL')}
                    >
                        All ({mappedComplaints.length})
                    </button>
                    <button
                        type="button"
                        className={`map-chip chip-pending ${selectedStatus === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('PENDING')}
                    >
                        🔴 Pending ({mappedComplaints.filter(c => c.status === 'PENDING').length})
                    </button>
                    <button
                        type="button"
                        className={`map-chip chip-progress ${selectedStatus === 'IN_PROGRESS' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('IN_PROGRESS')}
                    >
                        🟡 In Progress ({mappedComplaints.filter(c => c.status === 'IN_PROGRESS').length})
                    </button>
                    <button
                        type="button"
                        className={`map-chip chip-resolved ${selectedStatus === 'RESOLVED' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('RESOLVED')}
                    >
                        🟢 Resolved ({mappedComplaints.filter(c => c.status === 'RESOLVED').length})
                    </button>
                </div>
            </div>

            <div className="complaints-map-view-wrapper">
                <div ref={mapContainerRef} className="leaflet-overview-map" />

                {/* Layer Control Switcher */}
                <div className="map-layer-controls">
                    <div className="map-layer-toggles">
                        <button
                            type="button"
                            className={`layer-toggle-btn ${mapType === 'satellite' ? 'active' : ''}`}
                            onClick={() => handleSwitchMapType('satellite')}
                        >
                            🛰️ Satellite
                        </button>
                        <button
                            type="button"
                            className={`layer-toggle-btn ${mapType === 'streets' ? 'active' : ''}`}
                            onClick={() => handleSwitchMapType('streets')}
                        >
                            🗺️ Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
