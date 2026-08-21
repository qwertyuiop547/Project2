const CATEGORY_KEYWORDS = {
    Infrastructure: ['pothole', 'road', 'bridge', 'building', 'kalsada', 'butas', 'lubak', 'street', 'sidewalk', 'drainage', 'poste', 'crack', 'baha', 'flood', 'tulay', 'bubong', 'pader', 'ilaw', 'lamp', 'madilim', 'pundido', 'tubo', 'pipe'],
    Sanitation: ['garbage', 'basura', 'trash', 'waste', 'dump', 'smell', 'mabaho', 'collection', 'kalat', 'dumi', 'langaw', 'amoy', 'madumi', 'estero', 'kanal', 'barado', 'daga', 'peste'],
    'Public Safety': ['crime', 'theft', 'security', 'danger', 'unsafe', 'krimen', 'nakawan', 'delikado', 'holdap', 'magnanakaw', 'patayan', 'away', 'bugbugan', 'droga', 'shabu', 'adik', 'nakaw', 'snatcher', 'gulo', 'sunog', 'fire', 'apoy', 'aksidente', 'accident', 'kuryente', 'live wire', 'saksakan', 'barilan'],
    'Noise & Disturbance': ['noise', 'loud', 'music', 'karaoke', 'ingay', 'iingay', 'maingay', 'maiingay', 'disturbance', 'party', 'videoke', 'tambay', 'sigawan', 'sound', 'bass', 'speaker', 'patugtog', 'kantahan', 'tugtugan', 'nagiingay', 'kapitbahay'],
    Others: []
};

const PRIORITY_KEYWORDS = {
    URGENT: [
        'urgent', 'emergency', 'danger', 'delikado', 'agad', 'critical', 'injury', 'fire', 'sunog',
        'aksidente', 'accident', 'patayan', 'saksakan', 'kamatayan', 'baril', 'barilan', 'holdap',
        'magnanakaw', 'robbery', 'theft', 'kuryente', 'live wire', 'putol na kable', 'nagwawala',
        'sinasaktan', 'duguan', 'blood', 'life-threatening', 'flash flood', 'lumulubog'
    ],
    HIGH: [
        'high', 'mataas', 'serious', 'immediate', 'matagal', 'linggo', 'week', 'araw-araw',
        'gabi-gabi', 'madaling araw', 'hating gabi', 'midnight', 'sobrang', 'napakalakas',
        'mabaho', 'foul odor', 'amoy', 'barado ang kanal', 'tambak', 'peste', 'daga',
        'inuman sa kalsada', 'loitering', 'nanggugulo', 'droga', 'shabu', 'madilim',
        'dark road', 'pothole', 'deep hole', 'lubak', 'overflowing', 'apaw'
    ],
    LOW: [
        'minor', 'maliit', 'cosmetic', 'kaunti', 'mababa', 'simpleng', 'pintura',
        'lumang sign', 'not urgent', 'non-urgent', 'aesthetic'
    ]
};

const COMMUNITY_ISSUE_KEYWORDS = [
    'maingay', 'ingay', 'videoke', 'karaoke', 'tugtog', 'tambay', 'inuman', 'kapitbahay', 'patugtog',
    'basura', 'kalat', 'dumi', 'mabaho', 'amoy', 'estero', 'kanal', 'bara', 'barado', 'baha',
    'kalsada', 'butas', 'lubak', 'pothole', 'poste', 'ilaw', 'lamp', 'dilim', 'madilim', 'tubo', 'pipe', 'leak',
    'away', 'gulo', 'nakaw', 'holdap', 'magnanakaw', 'droga', 'shabu', 'krimen', 'aksidente',
    'saksakan', 'sunog', 'threat', 'banta', 'peste', 'daga', 'aso', 'tahol', 'pusa'
];

const CATEGORY_LABELS_TL = {
    Infrastructure: 'Imprastraktura',
    Sanitation: 'Sanitasyon / Basura',
    'Public Safety': 'Kaligtasan Pampubliko',
    'Noise & Disturbance': 'Ingay at Disturbansya',
    Others: 'Iba pa'
};

async function* streamOllamaChat(messages) {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

    const ollamaMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content,
    }));

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: ollamaMessages,
            stream: true,
            keep_alive: '30m',
            options: {
                temperature: 0.4,
                num_predict: 260,
                num_ctx: 2048,
            },
        }),
        signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }

            try {
                const data = JSON.parse(line);
                const token = data.message?.content;
                if (token) {
                    yield token;
                }
            } catch {
                // Skip malformed stream chunks.
            }
        }
    }
}

async function* streamOpenRouterChat(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    const primaryModel = process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2:free';
    const modelsToTry = [
        primaryModel,
        'liquid/lfm-2.5-2.6b:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'openai/gpt-oss-20b:free',
    ];
    const uniqueModels = [...new Set(modelsToTry)];

    for (const model of uniqueModels) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'Barangay Burgos Portal',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true,
                    temperature: 0.4,
                }),
                signal: AbortSignal.timeout(60000),
            });

            if (!response.ok) {
                const err = await response.text().catch(() => '');
                console.warn(`OpenRouter stream model ${model} error (${response.status}): ${err.slice(0, 100)}`);
                continue;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let yieldedAny = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmed.slice(6));
                            const token = data.choices?.[0]?.delta?.content;
                            if (token) {
                                yieldedAny = true;
                                yield token;
                            }
                        } catch {
                            // ignore malformed SSE line
                        }
                    }
                }
            }

            if (yieldedAny) {
                return;
            }
        } catch (err) {
            console.warn(`OpenRouter stream error on model ${model}:`, err.message);
        }
    }
}

async function* streamTextByWords(text) {
    const parts = text.split(/(\s+)/);
    for (const part of parts) {
        if (part) {
            yield part;
        }
    }
}

async function callOllama(messages, { jsonMode = false } = {}) {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

    const ollamaMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content,
    }));

    const body = {
        model,
        messages: ollamaMessages,
        stream: false,
        keep_alive: '30m',
        options: {
            temperature: 0.3,
            num_predict: jsonMode ? 600 : 350,
            num_ctx: 2048,
        },
    };

    if (jsonMode) {
        body.format = 'json';
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content?.trim() ?? null;
}

async function callGemini(messages, { jsonMode = false } = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const body = {
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
        contents,
        generationConfig: {
            temperature: 0.4,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
    };

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function callGroq(messages, { jsonMode = false } = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return null;
    }

    const body = {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.4,
    };

    if (jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callOpenAI(messages, { jsonMode = false } = {}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }

    const body = {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.4,
    };

    if (jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callOpenRouter(messages, { jsonMode = false } = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return null;
    }

    const primaryModel = process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2:free';
    const modelsToTry = [
        primaryModel,
        'liquid/lfm-2.5-2.6b:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'openai/gpt-oss-20b:free',
    ];
    const uniqueModels = [...new Set(modelsToTry)];

    for (const model of uniqueModels) {
        try {
            const body = {
                model,
                messages,
                temperature: 0.4,
            };

            if (jsonMode) {
                body.response_format = { type: 'json_object' };
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'Barangay Burgos Portal',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(45000),
            });

            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                console.warn(`OpenRouter model ${model} error (${response.status}): ${errBody.slice(0, 100)}`);
                continue;
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
                return text;
            }
        } catch (err) {
            console.warn(`OpenRouter model ${model} attempt error:`, err.message);
        }
    }

    return null;
}

async function isOllamaAvailable() {
    try {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const response = await fetch(`${baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(2000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function warmUpOllama() {
    try {
        if (!(await isOllamaAvailable())) {
            return;
        }

        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

        await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'hi' }],
                stream: false,
                keep_alive: '30m',
                options: { num_predict: 1 },
            }),
            signal: AbortSignal.timeout(60000),
        });

        console.log(`AI: Ollama model "${model}" na-warm up at handa na.`);
    } catch {
        // Warmup is best-effort; ignore failures.
    }
}

async function callAI(messages, { jsonMode = false } = {}) {
    const providers = [];

    if (process.env.OPENROUTER_API_KEY) {
        providers.push({ name: 'openrouter', fn: callOpenRouter });
    }
    if (process.env.GEMINI_API_KEY) {
        providers.push({ name: 'gemini', fn: callGemini });
    }
    if (process.env.GROQ_API_KEY) {
        providers.push({ name: 'groq', fn: callGroq });
    }
    if (process.env.OPENAI_API_KEY) {
        providers.push({ name: 'openai', fn: callOpenAI });
    }
    if (await isOllamaAvailable()) {
        providers.push({ name: 'ollama', fn: callOllama });
    }

    for (const provider of providers) {
        try {
            const content = await provider.fn(messages, { jsonMode });
            if (content) {
                return { content, source: provider.name };
            }
        } catch (error) {
            console.warn(`AI provider ${provider.name} failed:`, error.message);
        }
    }

    return { content: null, source: 'smart-assist' };
}

function extractJsonFromText(text) {
    if (!text) return null;
    let cleaned = text.trim().replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (cleaned.includes('```json')) {
        const match = cleaned.match(/```json\s*([\s\S]*?)\s*```/i);
        if (match) cleaned = match[1];
    } else if (cleaned.includes('```')) {
        const match = cleaned.match(/```\s*([\s\S]*?)\s*```/i);
        if (match) cleaned = match[1];
    }
    if (!cleaned.startsWith('{') && cleaned.includes('{') && cleaned.includes('}')) {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last > first) {
            cleaned = cleaned.substring(first, last + 1);
        }
    }
    return cleaned.trim();
}

function normalizeMatchText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function textMatchesKeyword(text, keyword) {
    if (!text || !keyword) return false;
    const lower = normalizeMatchText(text);
    const kw = keyword.toLowerCase().trim();

    if (kw === 'baha') {
        return /\b(baha|binabaha|nagbabaha|pagbaha|bumabaha|bahang)\b/i.test(lower);
    }

    // Direct whole word check
    const words = lower.split(/[^a-zA-Z0-9ñÑ-]+/).filter(Boolean);
    if (words.includes(kw)) {
        return true;
    }

    // Prefix / Suffix match for Tagalog affixes (e.g. nag-videoke, maingay, nagiingay)
    if (kw.length >= 4) {
        return words.some(w => w.startsWith(kw) || w.endsWith(kw) || w.includes(kw));
    }

    return false;
}

function getCategoryMatchScore(text, categoryName) {
    const keywords = CATEGORY_KEYWORDS[categoryName] || [];
    return keywords.filter((word) => textMatchesKeyword(text, word)).length;
}

function matchCategory(text, categories) {
    let bestCategory = null;
    let bestScore = 0;

    for (const category of categories) {
        const score = getCategoryMatchScore(text, category.name);
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory || categories.find((c) => c.name === 'Others') || categories[categories.length - 1];
}

function matchPriority(text) {
    const lower = normalizeMatchText(text);

    for (const level of ['URGENT', 'HIGH', 'LOW']) {
        const keywords = PRIORITY_KEYWORDS[level];
        if (keywords.some((word) => textMatchesKeyword(lower, word))) {
            return level;
        }
    }

    return 'MEDIUM';
}

function capitalizeFirst(text) {
    const cleaned = text.trim();
    if (!cleaned) {
        return cleaned;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractPlacePhrase(text, location) {
    if (location?.trim()) {
        const loc = location.trim().replace(/\[[0-9.-]+,\s*[0-9.-]+\]/g, '').trim();
        if (loc) {
            return `in the vicinity of ${loc}`;
        }
    }

    const patterns = [
        /\b(?:sa|dun sa|tapat ng|near|along|corner|kanto ng|block\s*\d+)\s+([a-zA-Z0-9\s.,#-]{3,40})/i,
        /\b(block\s*\d+\s*(?:lot\s*\d+)?)/i,
        /\b([a-zA-Z0-9\s]+(?:street|st\.|avenue|ave\.|road|rd\.))/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[0]) {
            return `near ${match[0].trim()}`;
        }
    }

    return null;
}

function buildDynamicTitle(description, categoryName, location) {
    const cleaned = (description || '').trim();
    if (!cleaned) return 'Community Incident Report';

    const place = extractPlacePhrase(cleaned, location);
    const placeText = place ? ` (${place})` : '';

    if (categoryName === 'Noise & Disturbance') {
        if (/karaoke|videoke|patugtog|sound|speaker/i.test(cleaned)) {
            return `Loud Videoke & Sound Disturbance${placeText}`;
        }
        if (/tambay|loitering|inuman|inom/i.test(cleaned)) {
            return `Public Loitering & Disturbance Concern${placeText}`;
        }
        if (/kapitbahay|neighbor|sigawan|away/i.test(cleaned)) {
            return `Neighborhood Noise & Commotion Disturbance${placeText}`;
        }
        return `Excessive Public Noise Disturbance${placeText}`;
    }

    if (categoryName === 'Sanitation') {
        if (/baha|drainage|kanal|clog|bara/i.test(cleaned)) {
            return `Clogged Drainage and Flooding Hazard${placeText}`;
        }
        if (/mabaho|amoy|smell|odor/i.test(cleaned)) {
            return `Foul Odor and Waste Accumulation Report${placeText}`;
        }
        if (/basura|garbage|trash|waste|dumi/i.test(cleaned)) {
            return `Uncollected Garbage & Sanitation Concern${placeText}`;
        }
        return `Sanitation and Environmental Cleanliness Concern${placeText}`;
    }

    if (categoryName === 'Infrastructure') {
        if (/ilaw|poste|light|lamp|madilim|dark/i.test(cleaned)) {
            return `Non-Functional Streetlight & Dark Road Hazard${placeText}`;
        }
        if (/butas|kalsada|pothole|road|crack|lubak/i.test(cleaned)) {
            return `Damaged Road & Dangerous Pothole Hazard${placeText}`;
        }
        if (/tubig|leak|pipe|water/i.test(cleaned)) {
            return `Water Pipeline Leak & Infrastructure Issue${placeText}`;
        }
        return `Damaged Public Infrastructure & Facility Hazard${placeText}`;
    }

    if (categoryName === 'Public Safety') {
        if (/nakawan|holdap|theft|robbery|magnanakaw/i.test(cleaned)) {
            return `Security Report: Theft / Robbery Incident${placeText}`;
        }
        if (/away|gulo|fight|threat|banta|saksakan/i.test(cleaned)) {
            return `Urgent Public Safety: Disturbance & Physical Altercation${placeText}`;
        }
        if (/droga|shabu|illegal/i.test(cleaned)) {
            return `Public Safety & Illegal Substance Activity Report${placeText}`;
        }
        return `Public Safety & Community Security Concern${placeText}`;
    }

    return `Official Community Incident Report${placeText}`;
}

function polishDynamicDescription(description, location, categoryName) {
    const raw = (description || '').trim();
    if (!raw) return '';

    const placePhrase = extractPlacePhrase(raw, location);
    const locSentence = placePhrase
        ? ` The incident is situated specifically ${placePhrase}.`
        : (location?.trim() ? ` The location identified for this report is at ${location.trim().replace(/\[[0-9.-]+,\s*[0-9.-]+\]/g, '').trim()}.` : '');

    // Semantic Translation & Intelligent Report Construction
    let incidentDetails = '';
    let impactDetails = '';
    let actionRequest = '';

    if (categoryName === 'Noise & Disturbance') {
        if (/karaoke|videoke/i.test(raw)) {
            incidentDetails = 'This is a formal report regarding persistent and high-volume videoke/karaoke sound disturbance occurring within the residential area.';
            impactDetails = 'The excessive noise levels cause significant distress and interrupt the necessary rest and quiet hours of neighboring residents and families.';
            actionRequest = 'We respectfully request the Barangay Peace and Order Committee and Barangay Tanods to conduct an inspection, remind the responsible parties of local noise ordinances, and ensure compliance with quiet hour regulations.';
        } else if (/tambay|inuman|loitering/i.test(raw)) {
            incidentDetails = 'This is an official report concerning unauthorized public gatherings, late-night loitering, and rowdy behavior in the neighborhood.';
            impactDetails = 'Such unmonitored street activities cause unease among local residents, compromise neighborhood tranquility, and present potential safety hazards.';
            actionRequest = 'We urge the Barangay Public Safety officers to conduct regular evening patrols in the area and disperse any unlawful or disruptive street gatherings.';
        } else if (/kapitbahay|neighbor/i.test(raw)) {
            incidentDetails = 'This is a formal complaint regarding recurring and unreasonable noise disturbances generated by adjacent neighbors.';
            impactDetails = 'The continuous disruption substantially impairs the peaceful enjoyment and sleep of nearby households during residential resting hours.';
            actionRequest = 'We kindly request barangay officials to dispatch a peacekeeping officer to facilitate appropriate mediation and remind the concerned household to maintain acceptable noise levels.';
        } else {
            incidentDetails = 'This is an official complaint regarding unreasonable and disruptive noise levels generated within the community.';
            impactDetails = 'The disturbance creates severe inconvenience and disrupts the peace and tranquility expected in a residential neighborhood.';
            actionRequest = 'We respectfully request prompt assistance from the barangay peacekeeping team to inspect the area and restore order.';
        }
    } else if (categoryName === 'Sanitation') {
        if (/baha|drainage|kanal|clog|bara/i.test(raw)) {
            incidentDetails = 'This is an official report regarding severely obstructed drainage systems and clogged public canals.';
            impactDetails = 'The blocked water passage results in dirty water overflow, localized street flooding, foul odors, and the breeding of disease-carrying mosquitoes.';
            actionRequest = 'We earnestly request the Barangay Public Works and Sanitation team to dispatch a declogging crew to clear the drainage and restore proper water flow.';
        } else if (/mabaho|amoy|smell/i.test(raw)) {
            incidentDetails = 'This report highlights a severe environmental health issue involving noxious odors and improperly managed waste materials.';
            impactDetails = 'The intense foul smell poses acute respiratory discomfort and sanitary hazards for residents and commuters traversing the area.';
            actionRequest = 'We request immediate barangay inspection and the enforcement of sanitary regulations on the responsible site or establishment.';
        } else {
            incidentDetails = 'This is a formal report regarding uncollected garbage and improper waste accumulation in the community.';
            impactDetails = 'The accumulated refuse creates an unsightly environment, generates foul odors, and attracts rodents, stray animals, and pests.';
            actionRequest = 'We respectfully request the Barangay Sanitation Department to coordinate immediate garbage collection and place proper waste disposal signages in the vicinity.';
        }
    } else if (categoryName === 'Infrastructure') {
        if (/ilaw|poste|light|lamp|madilim/i.test(raw)) {
            incidentDetails = 'This is an official report regarding damaged, flickering, or non-functional public streetlights along the roadway.';
            impactDetails = 'The lack of proper illumination creates dangerous dark spots that heighten the risk of vehicular accidents and compromise pedestrian security at night.';
            actionRequest = 'We respectfully request the Barangay Engineering and Maintenance unit to inspect the electrical post and promptly replace the damaged lighting fixtures.';
        } else if (/butas|kalsada|pothole|road|lubak/i.test(raw)) {
            incidentDetails = 'This is a formal complaint regarding degraded pavement, dangerous road cracks, and deep potholes along the thoroughfare.';
            impactDetails = 'These road defects present a critical safety hazard to motorists, cyclists, and pedestrians, and may cause severe vehicular damage or accidents.';
            actionRequest = 'We urge the Barangay Infrastructure Committee to conduct a site assessment and execute necessary asphalt or cement patching repairs.';
        } else {
            incidentDetails = 'This is an official report regarding damaged or defective public infrastructure and communal facilities.';
            impactDetails = 'The compromised structure poses potential safety hazards to residents and diminishes community accessibility.';
            actionRequest = 'We respectfully request barangay authorities to conduct an immediate inspection and initiate the required rehabilitation works.';
        }
    } else if (categoryName === 'Public Safety') {
        if (/nakawan|holdap|theft|robbery/i.test(raw)) {
            incidentDetails = 'This is an urgent security report concerning an alleged theft or robbery incident that transpired in the community.';
            impactDetails = 'This criminal incident poses a severe threat to community security, resident property, and personal safety.';
            actionRequest = 'We urgently request the Barangay Peacekeeping Action Team (BPAT) and Tanods to review local CCTV footage, increase security presence, and coordinate with the local police precinct.';
        } else if (/away|gulo|fight/i.test(raw)) {
            incidentDetails = 'This is an urgent report concerning an escalating public disturbance, physical brawl, or verbal altercation in the area.';
            impactDetails = 'The volatile situation endangers bystanders, creates panic among neighbors, and disrupts public peace and order.';
            actionRequest = 'We urgently request immediate Tanod deployment to pacify the parties involved and maintain community order.';
        } else {
            incidentDetails = 'This is an official report concerning a potential public safety hazard and threat to peace and order.';
            impactDetails = 'The reported situation compromises the general welfare and physical security of residents in the immediate vicinity.';
            actionRequest = 'We respectfully request the barangay safety personnel to inspect the situation and implement preventive security measures.';
        }
    } else {
        incidentDetails = `This is an official report regarding a ${categoryName} concern in the barangay community.`;
        impactDetails = 'The reported issue causes ongoing inconvenience and necessitates timely intervention by local authorities.';
        actionRequest = 'We respectfully request barangay officials to assess the situation and provide appropriate assistance.';
    }

    return `${incidentDetails}${locSentence} ${impactDetails} ${actionRequest}`;
}

function buildPriorityExplanation(priority, categoryName, rawText) {
    if (priority === 'URGENT') {
        return `AI classified this complaint as **URGENT** because the reported incident indicates an active safety hazard, threat to life or property, or critical emergency requiring rapid responder deployment.`;
    }
    if (priority === 'HIGH') {
        return `AI classified this complaint as **HIGH Priority** due to persistent recurring disturbance, severe health/sanitation risk, or significant public inconvenience requiring prioritized barangay intervention within 24 hours.`;
    }
    if (priority === 'LOW') {
        return `AI classified this complaint as **LOW Priority** as a minor or aesthetic request that does not pose an immediate disruption to community welfare.`;
    }
    return `AI classified this complaint as **MEDIUM Priority** as a standard community issue suitable for routine barangay peacekeeping or scheduled maintenance.`;
}

async function assistComplaint({ description, location, title, categories }) {
    if (!description?.trim()) {
        throw new Error('Description is required for AI assistance.');
    }

    const trimmedDesc = description.trim();
    const meaningfulWords = trimmedDesc
        .split(/\s+/)
        .filter((w) => w.length > 1 && !/^[.,!?;:]+$/.test(w));

    // Only block if extremely short (1 or 2 words, or fewer than 7 characters like "hi", "sir", "gulo", "help")
    const isVeryShort = meaningfulWords.length < 2 || trimmedDesc.length < 7;

    // ── Nonsense / Gibberish / Non-Complaint Detection ──────────────────
    const nonsenseResult = detectNonsenseInput(trimmedDesc);
    if (nonsenseResult.isNonsense) {
        return {
            isSufficient: false,
            clarificationMessage: nonsenseResult.message,
            source: 'validation',
        };
    }

    const availableCategories = categories.map((c) => c.name).join(', ');

    const systemPrompt = `You are the Senior AI Specialist for a Philippine Barangay Community Portal.
Your mission is to accurately classify citizen complaints and transform everyday descriptions into high-quality, professional official incident reports in English for barangay officials.

AVAILABLE BARANGAY CATEGORIES: [${availableCategories}]

TAGALOG & TAGLISH VOCABULARY GUIDE FOR ACCURATE TRANSLATION:
- "maingay" / "ingay" / "patugtog" / "videoke" / "karaoke" = loud noise / sound disturbance (Category: "Noise & Disturbance")
- "kapitbahay" = neighbor / neighboring household
- "magawan ng paraan" / "aksyunan" = take action / resolve / intervene
- "tambay" / "inuman" = street loitering / late-night drinking (Category: "Noise & Disturbance" or "Public Safety")
- "basura" / "kalat" / "tambak" / "mabaho" / "amoy" = uncollected garbage / foul odor / waste accumulation (Category: "Sanitation")
- "kanal" / "estero" / "barado" / "bara" / "baha" = clogged drainage canal / flood water (Category: "Sanitation" or "Infrastructure")
- "butas" / "lubak" / "kalsada" / "daan" = road pothole / damaged pavement (Category: "Infrastructure")
- "poste" / "ilaw" / "madilim" = broken streetlight / unlit road / dark street (Category: "Infrastructure")
- "tubo" / "pipe" / "tagas" / "tulo" = leaking water pipe / pipeline damage (Category: "Infrastructure")
- "nakaw" / "holdap" / "magnanakaw" / "away" / "gulo" / "suntukan" / "droga" / "shabu" = theft / physical fight / crime (Category: "Public Safety")
- "tapat" / "kanto" / "purok" = in front of / street corner / district zone

PRECISION INSTRUCTIONS:
1. 📝 COMPLAINT TITLE (Max 70 characters):
   - Generate a concise, highly specific, and professional English title summarizing the exact incident.
   - Example: "Neighbor Noise Disturbance and Loud Music Complaint", "Dangerous Road Pothole along Rizal Street", "Garbage Accumulation and Foul Odor at Corner of Purok 2".

2. 🏷️ CATEGORY SELECTION:
   - Pick the single most accurate category strictly from: [${availableCategories}].
   - If the complaint is about noise, loud neighbor, videoke -> Choose "Noise & Disturbance".
   - If about trash, smell, dirty canal -> Choose "Sanitation".
   - If about road holes, streetlights, broken facilities -> Choose "Infrastructure".
   - If about theft, brawls, threats, crime -> Choose "Public Safety".

3. ⚡ PRIORITY LEVEL:
   - URGENT: Imminent danger, physical violence, active theft/crime, live wires, flash floods.
   - HIGH: Major health hazards, recurring midnight noise, deep road hazards causing accidents, severe garbage pileup.
   - MEDIUM: General community maintenance, neighbor noise complaints, standard repair requests.
   - LOW: Minor cosmetic suggestions or non-disruptive feedback.

4. 📄 FORMAL REPORT DESCRIPTION:
   - Rewrite the complaint into a comprehensive, polite, and formal 2-4 sentence English official report.
   - Accurately translate and convey all details provided by the citizen.
   - Include a formal request for barangay intervention (e.g., dispatching Barangay Tanods, sending a repair crew, or conducting mediation).

5. 💡 EXPLANATION:
   - Provide a 1-2 sentence English explanation justifying the chosen category and priority level.

6. 🚫 SUFFICIENCY CHECK (isSufficient):
   - Always set "isSufficient": true if any real community concern is mentioned.
   - ONLY set "isSufficient": false for obvious gibberish ("asdfgh"), single greetings ("hi"), or empty 1-3 word phrases without a problem ("may reklamo po").

Respond ONLY in valid JSON format:
{
  "isSufficient": true,
  "clarificationMessage": null,
  "title": "Concise and descriptive English title",
  "categoryName": "Exact category from the available list",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "description": "Formal, detailed 2-4 sentence English official report",
  "explanation": "Clear explanation of category and priority choice"
}`;

    const detectedIssueCategory = matchCategory(`${trimmedDesc} ${location || ''}`, categories);
    const userPrompt = `Resident Description:
"${trimmedDesc}"

Provided Location: ${location || '(none provided)'}
Contextual Domain Hint: ${detectedIssueCategory.name}

Accurately analyze this citizen complaint, translate it faithfully, and produce the JSON report in English with the most appropriate Title, Category, Priority, and formal Description.`;

    try {
        const { content, source } = await callAI(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { jsonMode: true }
        );

        if (content) {
            const cleanedJson = extractJsonFromText(content);
            const parsed = JSON.parse(cleanedJson);

            const hasRecognizedIssue = COMMUNITY_ISSUE_KEYWORDS.some((kw) => textMatchesKeyword(trimmedDesc, kw));

            if (parsed.isSufficient === false && !hasRecognizedIssue) {
                return {
                    isSufficient: false,
                    clarificationMessage: parsed.clarificationMessage
                        || 'Masyadong maikli o hindi malinaw ang iyong inilagay. Pakilarawan kung anong problema (hal. "Maingay ang kapitbahay sa gabi" o "May butas ang kalsada") upang makabuo ng opisyal na report.',
                    source,
                };
            }

            const targetCatName = (parsed.categoryName || '').trim().toLowerCase();
            const matchedCat = categories.find((c) => c.name.toLowerCase() === targetCatName)
                || matchCategory(`${trimmedDesc} ${location || ''}`, categories);

            const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
            const priority = validPriorities.includes(parsed.priority?.toUpperCase())
                ? parsed.priority.toUpperCase()
                : matchPriority(trimmedDesc);

            const finalTitle = parsed.title && parsed.title.trim().length > 5
                ? parsed.title.trim()
                : buildDynamicTitle(trimmedDesc, matchedCat.name, location);

            const finalDescription = parsed.description && parsed.description.trim().length > 30
                ? parsed.description.trim()
                : polishDynamicDescription(trimmedDesc, location, matchedCat.name);

            const finalExplanation = parsed.explanation && parsed.explanation.trim().length > 10
                ? parsed.explanation.trim()
                : buildPriorityExplanation(priority, matchedCat.name, trimmedDesc);

            return {
                isSufficient: true,
                title: finalTitle,
                description: finalDescription,
                categoryId: matchedCat.id,
                categoryName: matchedCat.name,
                priority,
                explanation: finalExplanation,
                source,
            };
        }
    } catch (error) {
        console.error('AI complaint assist error:', error.message);
    }

    // Smart Assist Fallback (Local Rule & Heuristic Engine)
    if (isVeryShort) {
        return {
            isSufficient: false,
            clarificationMessage: 'Masyadong maikli ang iyong inilagay. Pakilarawan kung anong problema (hal. "Maingay ang kapitbahay sa gabi" o "May butas ang kalsada") upang makabuo ng opisyal na report.',
            source: 'smart-assist',
        };
    }

    const matchedCat = matchCategory(`${trimmedDesc} ${location || ''}`, categories);
    const priority = matchPriority(trimmedDesc);

    return {
        isSufficient: true,
        title: buildDynamicTitle(trimmedDesc, matchedCat.name, location),
        description: polishDynamicDescription(trimmedDesc, location, matchedCat.name),
        categoryId: matchedCat.id,
        categoryName: matchedCat.name,
        priority,
        explanation: buildPriorityExplanation(priority, matchedCat.name, trimmedDesc),
        source: 'smart-assist',
    };
}

/**
 * Pre-AI heuristic: detect gibberish, keyboard mashing, repeated characters,
 * profanity-only, test inputs, and irrelevant nonsense BEFORE wasting an AI call.
 */
function detectNonsenseInput(text) {
    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(Boolean);

    // 1. Repeated single character or pattern (e.g. "aaaa", "hhhhhh", "abababab")
    if (/^(.)\1{3,}$/i.test(lower.replace(/\s/g, ''))) {
        return {
            isNonsense: true,
            message: 'Mukhang paulit-ulit lang ang mga character na inilagay mo. Mangyaring ilarawan ang iyong reklamo nang maayos (hal. "Malakas ang tugtog ng kapitbahay tuwing gabi").',
        };
    }

    // 2. Keyboard mash patterns
    const keyboardPatterns = [
        /^[asdfghjkl;']+$/i,
        /^[qwertyuiop]+$/i,
        /^[zxcvbnm,./]+$/i,
        /^[1234567890]+$/,
        /^(.{1,3})\1{2,}$/i,
    ];
    const stripped = lower.replace(/\s+/g, '');
    if (stripped.length >= 3 && keyboardPatterns.some((p) => p.test(stripped))) {
        return {
            isNonsense: true,
            message: 'Hindi maintindihan ang iyong input. Mangyaring magsulat ng malinaw na reklamo tungkol sa isang problema sa komunidad (hal. "May butas ang kalsada sa Block 3").',
        };
    }

    // 3. Too many unique consonants in a row without vowels (gibberish like "bdfksjhskj")
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(stripped)) {
        return {
            isNonsense: true,
            message: 'Mukhang hindi maayos ang iyong input. Mangyaring ilarawan kung ano ang problema o isyu sa inyong lugar (hal. "Hindi gumagana ang ilaw sa kalsada").',
        };
    }

    // 4. Common test/troll inputs & Profanity / Inappropriate Language
    const trollPatterns = [
        /^test+$/i,
        /^(ha){2,}$/i,          // hahaha
        /^(he){2,}$/i,          // hehehe
        /^(lo){2,}l?$/i,        // lolol
        /^(lol|lmao|rofl|xd|bruh|yolo|swag|uwu|owo)\s*$/i,
        /^(hello|hi|hey|yo|sup|oi|hoy|uy|greetings)\s*[!.?]*$/i,
        /^(ok|okay|oo|opo|sige|yes|no|ewan|wala|idk|idc)\s*[!.?]*$/i,
        /^[!@#$%^&*()_+=[\]{}|\\;:'",.<>?/`~\-\s]+$/,
        /^[\d\s]+$/,
    ];
    if (trollPatterns.some((p) => p.test(lower))) {
        return {
            isNonsense: true,
            message: 'Hindi ito isang valid na reklamo. Mangyaring ilarawan ang isang tunay na isyu o problema sa inyong komunidad (hal. "May mga tambay na nag-iingay sa gabi" o "Hindi nangongolekta ng basura").',
        };
    }

    // 4b. Strict Profanity and Vulgar/Offensive words filter anywhere in the complaint
    const profanityPatterns = [
        /\b(gago|gaga|ogag|gag0|g4go)\b/i,
        /\b(tang\s?ina|taena|tena|tangina|ina\s?mo|ina\s?ka)\b/i,
        /\b(putang\s?ina|pota|puta|potang\s?ina|pucha)\b/i,
        /\b(tarantado|tarandato|tarantad0)\b/i,
        /\b(ulol|ul0l|inutil|buwisit|bwisit)\b/i,
        /\b(kupal|kopal|hudas)\b/i,
        /\b(bobo|b0b0|tanga|engot|unggoy|t@nga)\b/i,
        /\b(kantot|kantutan|puki|pekpek|kiki|puke|titi|oten|burat|tamod|bayag)\b/i,
        /\b(fuck|fucking|fucker|shit|bitch|asshole|bastard|cunt|dick|pussy)\b/i,
        /\b(yawa|piste|pisting|bilat|pisting\s?yawa)\b/i,
    ];
    if (profanityPatterns.some((p) => p.test(lower))) {
        return {
            isNonsense: true,
            message: 'Naglalaman ng hindi angkop o bastos na salita ang iyong reklamo. Mangyaring gumamit ng magalang at maayos na pananalita (hal. "May alitan kami ng kapitbahay dahil sa ingay") upang maiproseso ang iyong report sa barangay.',
        };
    }

    // 5. Same word repeated excessively (e.g. "basura basura basura basura")
    if (words.length >= 3) {
        const uniqueWords = new Set(words);
        if (uniqueWords.size === 1) {
            return {
                isNonsense: true,
                message: `Paulit-ulit lang ang salitang "${words[0]}". Mangyaring magdagdag ng konteksto — saan ito nangyayari at ano ang epekto nito sa inyo?`,
            };
        }
    }

    // 6. Generic 1-3 uninformative words that contain NO issue keywords (e.g. "may reklamo po", "tulong naman sir", "problema dito")
    const issueKeywords = [
        'maingay', 'ingay', 'videoke', 'karaoke', 'tugtog', 'tambay', 'inuman',
        'basura', 'kalat', 'dumi', 'mabaho', 'amoy', 'estero', 'kanal', 'bara', 'baha',
        'kalsada', 'butas', 'lubak', 'pothole', 'poste', 'ilaw', 'lamp', 'dilim', 'tubo', 'pipe',
        'away', 'gulo', 'nakaw', 'holdap', 'magnanakaw', 'droga', 'shabu', 'krimen', 'aksidente',
        'saksakan', 'sunog', 'threat', 'banta', 'peste', 'daga', 'aso', 'tahol', 'pusa'
    ];
    const hasIssueKeyword = issueKeywords.some((kw) => textMatchesKeyword(lower, kw));
    if (words.length <= 3 && !hasIssueKeyword && stripped.length < 20) {
        return {
            isNonsense: true,
            message: 'Masyadong maikli ang iyong inilagay. Pakisabi kung anong problema (hal. "Maingay ang kapitbahay sa gabi" o "May butas ang kalsada") upang makabuo ng opisyal na report.',
        };
    }

    return { isNonsense: false };
}

function buildPortalContext({ services, categories, user, complaintStats }) {
    const serviceLines = services.map((s) =>
        `- ${s.name}: Fee ₱${s.fee}, ${s.processingDays} day(s), Requirements: ${s.requirements}`
    ).join('\n');

    const categoryLines = categories.map((c) => `- ${c.name}`).join('\n');

    let userContext = `User: ${user.firstName} ${user.lastName}, Role: ${user.role}`;
    if (user.role === 'RESIDENT' && complaintStats) {
        userContext += `\nComplaint stats: Pending ${complaintStats.pending || 0}, In Progress ${complaintStats.in_progress || 0}, Resolved ${complaintStats.resolved || 0}`;
    }

    return `BARANGAY PORTAL KNOWLEDGE BASE

Services available:
${serviceLines || 'No services loaded'}

Complaint categories:
${categoryLines || 'Infrastructure, Sanitation, Public Safety, Noise & Disturbance, Others'}

How to file a complaint: Dashboard → Complaints → File Complaint (residents only)
How to track complaint status: Complaints → open your complaint → "Status ng Reklamo"
Officials (Chairman/Secretary) can update complaint status.

${userContext}`;
}

function tryFaqReply(message, user, contextData = {}, dialect = 'tagalog') {
    const lower = message.toLowerCase();
    const { services = [], complaintStats = null } = contextData;
    const d = (dialect || 'tagalog').toLowerCase();

    // 1. Complaint Filing
    if (/file|mag-file|mag file|i-file|report|magreport|complain|paano.*(reklamo|complaint)|unsaon.*reklamo|pat-od.*reklamo/.test(lower)) {
        if (user.role !== 'RESIDENT') {
            if (d === 'bisaya') return 'Ang pag-file ug reklamo kay para ra sa **Residents**. Isip opisyal, mahimo nimong madumala ang mga reklamo sa **Complaints** page.';
            if (d === 'waray') return 'An pag-file hin reklamo in para la ha **Residents**. Komo opisyal, pwede nimo madumala an mga reklamo ha **Complaints** page.';
            if (d === 'english') return 'Filing complaints is reserved for **Residents**. As an official, you can manage complaints in the **Complaints** page.';
            return 'Ang pag-file ng reklamo ay para lamang sa **Residents**. Bilang official, maaari mong pamahalaan ang mga reklamo sa **Complaints** page.';
        }

        if (d === 'bisaya') {
            return 'Aron mag-file ug reklamo:\n1. Adto sa **Complaints** sa sidebar\n2. I-click ang **File Complaint**\n3. I-describe ang issue ug gamita ang **AI Assist** kung gikinahanglan\n4. I-submit ang form';
        }
        if (d === 'waray') {
            return 'Para mag-file hin reklamo:\n1. Kadto ha **Complaints** ha sidebar\n2. I-click an **File Complaint**\n3. Isaysay an problema ngan gamita an **AI Assist** kun kinahanglan\n4. I-submit an form';
        }
        if (d === 'english') {
            return 'To file a complaint:\n1. Go to **Complaints** in the sidebar\n2. Click **File Complaint**\n3. Describe the issue and use **AI Assist** if needed\n4. Submit the form';
        }
        return 'Para mag-file ng reklamo:\n1. Pumunta sa **Complaints** sa sidebar\n2. I-click ang **File Complaint**\n3. I-describe ang issue at gamitin ang **AI Assist** kung kailangan\n4. I-submit ang form';
    }

    // 2. Complaint Status / Tracking
    if (/status|track|saan na|progress|subaybay|kumusta|hain na/.test(lower) && /reklamo|complaint/.test(lower)) {
        if (user.role === 'RESIDENT') {
            const stats = complaintStats
                ? ` (${complaintStats.pending || 0} Pending, ${complaintStats.in_progress || 0} In Progress, ${complaintStats.resolved || 0} Resolved)`
                : '';
            if (d === 'bisaya') {
                return `Aron makita ang status sa imong reklamo, adto sa **Complaints**, i-click ang imong reklamo, ug tan-awa ang **Status ng Reklamo** tracker sa taas.${stats ? ` Imong mga reklamo:${stats}.` : ''}`;
            }
            if (d === 'waray') {
                return `Para makit-an an status han imo reklamo, kadto ha **Complaints**, i-click an imo reklamo, ngan kitaa an **Status ng Reklamo** tracker ha igbaw.${stats ? ` Imo mga reklamo:${stats}.` : ''}`;
            }
            if (d === 'english') {
                return `To track your complaint status, navigate to **Complaints**, open your complaint, and view the **Status ng Reklamo** live timeline at the top.${stats ? ` Your active records:${stats}.` : ''}`;
            }
            return `Para makita ang status ng reklamo mo, pumunta sa **Complaints**, i-click ang reklamo mo, at tingnan ang **Status ng Reklamo** tracker sa taas.${stats ? ` Mga reklamo mo ngayon:${stats}.` : ''}`;
        }
        return 'Bilang official, maaari mong i-update ang status ng reklamo sa **Complaints** → piliin ang reklamo → **Update Status**.';
    }

    // 3. Barangay Clearance
    if (/clearance/.test(lower) && !/business|permit/.test(lower)) {
        const svc = services.find((s) => /barangay clearance/i.test(s.name));
        const fee = svc ? svc.fee : '50';
        const days = svc ? svc.processingDays : '1';
        const reqs = svc ? svc.requirements : '1 Valid ID, Cedula, Proof of Residency';
        if (d === 'bisaya') {
            return `Ang **Barangay Clearance** kay may bayad nga **₱${fee}**, ${days} ka adlaw ang pag-process. Requirements: ${reqs}. Adto sa **Services** aron mag-request.`;
        }
        if (d === 'waray') {
            return `An **Barangay Clearance** in may bayad nga **₱${fee}**, ${days} ka adlaw an pag-proseso. Requirements: ${reqs}. Kadto ha **Services** para mag-request.`;
        }
        if (d === 'english') {
            return `The **Barangay Clearance** fee is **₱${fee}**, with a processing time of ${days} day(s). Requirements: ${reqs}. Go to **Services** to apply.`;
        }
        return `Ang **Barangay Clearance** ay may bayad na **₱${fee}**, ${days} araw ang processing. Requirements: ${reqs}. Pumunta sa **Services** para mag-request.`;
    }

    // 4. Barangay ID
    if (/barangay id|brgy id/.test(lower)) {
        const svc = services.find((s) => /barangay id/i.test(s.name));
        const fee = svc ? svc.fee : '100';
        const days = svc ? svc.processingDays : '3';
        const reqs = svc ? svc.requirements : '1 Valid ID, 2pcs 1x1 Photo, Proof of Residency';
        if (d === 'bisaya') {
            return `Ang **Barangay ID** kay may bayad nga **₱${fee}**, ${days} ka adlaw ang pag-process. Requirements: ${reqs}. Adto sa **Services** aron mag-request.`;
        }
        if (d === 'waray') {
            return `An **Barangay ID** in may bayad nga **₱${fee}**, ${days} ka adlaw an pag-proseso. Requirements: ${reqs}. Kadto ha **Services** para mag-request.`;
        }
        if (d === 'english') {
            return `The **Barangay ID** fee is **₱${fee}**, taking ${days} working days. Requirements: ${reqs}. Go to **Services** to request.`;
        }
        return `Ang **Barangay ID** ay may bayad na **₱${fee}**, ${days} araw ang processing. Requirements: ${reqs}. Pumunta sa **Services** para mag-request.`;
    }

    // 5. Indigency
    if (/indigency|indigent|kalisod|kapobre/.test(lower)) {
        const svc = services.find((s) => /indigency/i.test(s.name));
        const days = svc ? svc.processingDays : '1';
        const reqs = svc ? svc.requirements : '1 Valid ID, Proof of Low Income';
        if (d === 'bisaya') {
            return `Ang **Certificate of Indigency** kay **Libre (₱0)** ug ${days} ka adlaw ang pag-process. Requirements: ${reqs}. Adto sa **Services** aron mag-request.`;
        }
        if (d === 'waray') {
            return `An **Certificate of Indigency** in **Libre (₱0)** ngan ${days} ka adlaw an pag-proseso. Requirements: ${reqs}. Kadto ha **Services** para mag-request.`;
        }
        if (d === 'english') {
            return `The **Certificate of Indigency** is **FREE (₱0)** and processed in ${days} day(s). Requirements: ${reqs}. Visit **Services** to submit a request.`;
        }
        return `Ang **Certificate of Indigency** ay **libre (₱0)** at ${days} araw ang processing. Requirements: ${reqs}. Pumunta sa **Services** para mag-request.`;
    }

    // 6. Greetings & Introduction
    if (/^(hello|hi|kumusta|magandang|maayong|maupay|help|tulong|tabang)\b|ano ang barangay portal|unsa ang barangay portal/.test(lower)) {
        if (d === 'bisaya') {
            return `Maayong adlaw, ${user.firstName || 'residente'}! Ako ang imong **Barangay AI Assistant**. Andam ko motabang nimo sa:\n• Pag-file ug pag-track sa reklamo\n• Pagkuha ug dokumento ug serbisyo\n• Suggestions ug announcements\n\nUnsa may akong ika-alagad nimo?`;
        }
        if (d === 'waray') {
            return `Maupay nga adlaw, ${user.firstName || 'residente'}! Ako an imo **Barangay AI Assistant**. Andam ako bumulig ha:\n• Pag-file ngan pag-track hin reklamo\n• Pagkuha hin mga dokumento ngan serbisyo\n• Suggestions ngan announcements\n\nAno an akon maibubulig ha imo yana?`;
        }
        if (d === 'english') {
            return `Hello, ${user.firstName || 'Resident'}! I am your **Barangay AI Assistant**. I can assist you with:\n• Filing and tracking complaints\n• Requesting certificates and services\n• Community suggestions and bulletins\n\nHow can I help you today?`;
        }
        return `Kumusta, ${user.firstName || 'Resident'}! Ako ang **Barangay AI Assistant**. Matutulungan kita sa:\n• Pag-file at pag-track ng reklamo\n• Mga dokumento at serbisyo ng barangay\n• Suggestions at announcements\n\nAno ang maitutulong ko sa iyo?`;
    }

    return null;
}

function fallbackChatReply(message, user, contextData = {}, dialect = 'tagalog') {
    const faq = tryFaqReply(message, user, contextData, dialect);
    if (faq) {
        return faq;
    }
    const d = (dialect || 'tagalog').toLowerCase();
    if (d === 'bisaya') {
        return 'Salamat sa mensahe! Para sa reklamo, adto sa **Complaints**. Para sa mga dokumento, tan-awa ang **Services**. Para sa balita, ablihi ang **Announcements**. Naa ka bay specific nga pangutana?';
    }
    if (d === 'waray') {
        return 'Salamat han mensahe! Para ha reklamo, kadto ha **Complaints**. Para ha mga dokumento, kitaa an **Services**. Para ha sumat, abrihi an **Announcements**. May-ada ka ba karuyag igpakiana?';
    }
    if (d === 'english') {
        return 'Thank you for reaching out! For incident reports, go to **Complaints**. For certificates, check **Services**. For bulletins, open **Announcements**. Do you have a specific inquiry?';
    }
    return 'Salamat sa mensahe! Para sa reklamo, pumunta sa **Complaints**. Para sa dokumento, tingnan ang **Services**. Para sa balita, buksan ang **Announcements**. May specific na tanong ka ba?';
}

function buildChatMessages({ message, history, context, dialect = 'tagalog' }) {
    const d = (dialect || 'tagalog').toLowerCase();
    let dialectInstruction = 'Respond in Tagalog if user writes Tagalog, English if English.';
    if (d === 'bisaya') {
        dialectInstruction = 'Respond warmly in conversational Cebuano / Bisaya (e.g. "Maayong adlaw", "palihog", "adto sa...").';
    } else if (d === 'waray') {
        dialectInstruction = 'Respond warmly in Waray-Waray, the local language of Basey, Samar (e.g. "Maupay nga adlaw", "kadto ha...", "bulig").';
    } else if (d === 'english') {
        dialectInstruction = 'Respond clearly and politely in Philippine English.';
    } else {
        dialectInstruction = 'Respond in friendly and natural Tagalog / Filipino.';
    }

    const systemPrompt = `You are the friendly, helpful, and intelligent Barangay AI Assistant for Barangay Burgos (Basey, Samar).
GUIDELINES:
- Be warm, courteous, and helpful.
- ${dialectInstruction}
- For barangay inquiries (complaints, certificates, clearances, announcements), guide the user using the portal knowledge below.
- For general questions (math like 1+1=2, greetings, brief conversational queries), answer them politely and concisely in 1-2 sentences.
- When referring to portal features, use **bold** for navigation names like **Complaints**, **Services**, **Announcements**, **Suggestions**, **Dashboard**.
- Navigation guide:
  • To file complaint: Go to **Complaints** → click **File Complaint** → fill form and Submit.
  • To check status: Go to **Complaints** → click on the complaint to view **Status ng Reklamo**.
  • To get certificates: Go to **Services** page.

BARANGAY PORTAL CONTEXT:
${context}`;

    const recentHistory = history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
    }));

    return [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message.trim() },
    ];
}

async function* streamChatWithAssistant({ message, history, dialect = 'tagalog', context, user, contextData }) {
    if (!message?.trim()) {
        throw new Error('Message is required.');
    }

    const faqReply = tryFaqReply(message, user, contextData, dialect);
    if (faqReply) {
        yield { type: 'meta', source: 'portal-guide' };
        for await (const chunk of streamTextByWords(faqReply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: 'portal-guide' };
        return;
    }

    const messages = buildChatMessages({ message, history, context, dialect });

    if (process.env.OPENROUTER_API_KEY) {
        try {
            yield { type: 'meta', source: 'openrouter' };
            let hasContent = false;

            for await (const token of streamOpenRouterChat(messages)) {
                hasContent = true;
                yield { type: 'token', text: token };
            }

            if (hasContent) {
                yield { type: 'done', source: 'openrouter' };
                return;
            }
        } catch (error) {
            console.warn('OpenRouter stream failed:', error.message);
        }
    }

    if (await isOllamaAvailable()) {
        try {
            yield { type: 'meta', source: 'ollama' };
            let hasContent = false;

            for await (const token of streamOllamaChat(messages)) {
                hasContent = true;
                yield { type: 'token', text: token };
            }

            if (hasContent) {
                yield { type: 'done', source: 'ollama' };
                return;
            }
        } catch (error) {
            console.warn('Ollama stream failed:', error.message);
        }
    }

    try {
        const { content, source } = await callAI(messages);
        const reply = content || fallbackChatReply(message, user, contextData, dialect);
        const finalSource = content ? source : 'smart-assist';

        yield { type: 'meta', source: finalSource };
        for await (const chunk of streamTextByWords(reply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: finalSource };
    } catch (error) {
        console.error('AI chat stream error:', error.message);
        const reply = fallbackChatReply(message, user, contextData, dialect);
        yield { type: 'meta', source: 'smart-assist' };
        for await (const chunk of streamTextByWords(reply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: 'smart-assist' };
    }
}

async function chatWithAssistant({ message, history, dialect = 'tagalog', context, user, contextData }) {
    if (!message?.trim()) {
        throw new Error('Message is required.');
    }

    const faqReply = tryFaqReply(message, user, contextData, dialect);
    if (faqReply) {
        return { reply: faqReply, source: 'portal-guide' };
    }

    const messages = buildChatMessages({ message, history, context, dialect });

    try {
        const { content, source } = await callAI(messages);

        if (!content) {
            return {
                reply: fallbackChatReply(message, user, contextData, dialect),
                source: 'smart-assist',
            };
        }

        return { reply: content, source };
    } catch (error) {
        console.error('AI chat error:', error.message);
        return {
            reply: fallbackChatReply(message, user, contextData, dialect),
            source: 'smart-assist',
        };
    }
}

async function warmUpOllama() {
    try {
        const available = await isOllamaAvailable();
        if (available) {
            console.log('🤖 Ollama AI service connected.');
        } else {
            console.log('ℹ️ Ollama AI offline. Using rule-based civic assistant.');
        }
    } catch (e) {
        // Safe ignore
    }
}

module.exports = {
    assistComplaint,
    chatWithAssistant,
    streamChatWithAssistant,
    buildPortalContext,
    fallbackChatReply,
    isOllamaAvailable,
    warmUpOllama,
};

