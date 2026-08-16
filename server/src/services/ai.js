const CATEGORY_KEYWORDS = {
    Infrastructure: ['pothole', 'road', 'bridge', 'building', 'kalsada', 'butas', 'street', 'sidewalk', 'drainage', 'poste', 'crack', 'baha', 'flood', 'tulay', 'bubong', 'pader'],
    Sanitation: ['garbage', 'basura', 'trash', 'waste', 'dump', 'smell', 'mabaho', 'collection', 'kalat', 'dumi', 'langaw', 'amoy', 'madumi'],
    'Public Safety': ['crime', 'theft', 'security', 'lighting', 'lamp', 'danger', 'unsafe', 'krimen', 'nakawan', 'delikado', 'ilaw', 'holdap', 'magnanakaw', 'patayan', 'away', 'bugbugan'],
    'Noise & Disturbance': ['noise', 'loud', 'music', 'karaoke', 'ingay', 'iingay', 'maingay', 'maiingay', 'disturbance', 'party', 'videoke', 'tambay', 'gulo', 'sigawan', 'sound', 'bass', 'speaker'],
    Others: []
};

const PRIORITY_KEYWORDS = {
    URGENT: ['urgent', 'emergency', 'danger', 'delikado', 'agad', 'critical', 'injury', 'fire', 'flood', 'baha', 'sunog', 'aksidente'],
    HIGH: ['high', 'mataas', 'serious', 'immediate', 'matagal', 'linggo', 'week', 'araw', 'hindi', 'luma na'],
    LOW: ['minor', 'maliit', 'cosmetic', 'kaunti', 'mababa']
};

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
            temperature: 0.4,
            num_predict: jsonMode ? 200 : 220,
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

    if (await isOllamaAvailable()) {
        providers.push({ name: 'ollama', fn: callOllama });
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

function normalizeMatchText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function textMatchesKeyword(text, keyword) {
    const lower = normalizeMatchText(text);
    const compact = lower.replace(/\s+/g, '');
    const kw = keyword.toLowerCase();
    const kwCompact = kw.replace(/\s+/g, '');

    return lower.includes(kw) || compact.includes(kwCompact);
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
        const loc = location.trim();
        return loc.toLowerCase().startsWith('sa ') ? loc : `sa ${loc}`;
    }

    const patterns = [
        /\b(dun\s+sa\s+[\w\s]+)/i,
        /\b(sa\s+kabilang\s+kanto)\b/i,
        /\b(sa\s+[\w\s]*kanto)\b/i,
        /\b(sa\s+block\s*\d+)\b/i,
        /\b(sa\s+[\w\d\s-]{3,30})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let phrase = match[1].trim();
            if (phrase.toLowerCase().startsWith('dun sa ')) {
                phrase = phrase.replace(/^dun\s+sa\s+/i, 'sa ');
            }
            return phrase;
        }
    }

    return null;
}

function buildTitle(text, categoryName) {
    const cleaned = text.trim().replace(/\s+/g, ' ');
    if (!cleaned) {
        return 'Barangay Complaint';
    }

    const place = extractPlacePhrase(cleaned, null);

    if (categoryName === 'Noise & Disturbance'
        && (textMatchesKeyword(cleaned, 'ingay') || textMatchesKeyword(cleaned, 'iingay') || textMatchesKeyword(cleaned, 'maingay'))) {
        return place ? `Labis na Ingay ${place}` : 'Labis na Ingay sa Lugar';
    }

    if (categoryName === 'Sanitation'
        && (textMatchesKeyword(cleaned, 'basura') || textMatchesKeyword(cleaned, 'kalat'))) {
        return place ? `Problema sa Basura ${place}` : 'Problema sa Basura at Kalinisan';
    }

    if (categoryName === 'Infrastructure'
        && (textMatchesKeyword(cleaned, 'kalsada') || textMatchesKeyword(cleaned, 'poste') || textMatchesKeyword(cleaned, 'ilaw'))) {
        return place ? `Sira na Imprastraktura ${place}` : 'Problema sa Imprastraktura';
    }

    if (categoryName === 'Public Safety') {
        return place ? `Isyu sa Kaligtasan ${place}` : 'Isyu sa Kaligtasan Pampubliko';
    }

    const sentence = cleaned.split(/[.!?\n]/)[0].trim();
    const title = sentence.length > 80 ? `${sentence.slice(0, 77)}...` : sentence;
    return capitalizeFirst(title);
}

function polishDescription(description, location, categoryName) {
    const cleaned = description.trim().replace(/\s+/g, ' ');
    if (!cleaned) {
        return cleaned;
    }

    const place = extractPlacePhrase(cleaned, location);
    const placeIn = place ? ` ${place}` : '';
    const locSuffix = location?.trim() && !place
        ? ` Lokasyon: ${location.trim()}.`
        : '';

    if (categoryName === 'Noise & Disturbance') {
        return `Nais kong i-report ang labis na ingay${placeIn || ' sa aming lugar'}. Nakakaabala ito sa kapayapaan ng aming komunidad at humihiling ako ng tulong mula sa barangay.${locSuffix}`;
    }

    if (categoryName === 'Sanitation') {
        return `Nais kong i-report ang problema sa basura at kalinisan${placeIn || ''}. ${capitalizeFirst(cleaned.endsWith('.') ? cleaned : `${cleaned}.`)} Humihiling ako ng agarang aksyon mula sa barangay.${locSuffix}`;
    }

    if (categoryName === 'Infrastructure') {
        return `Nais kong i-report ang sira o problema sa imprastraktura${placeIn || ''}. ${capitalizeFirst(cleaned.endsWith('.') ? cleaned : `${cleaned}.`)} Humihiling ako ng pag-aayos mula sa barangay.${locSuffix}`;
    }

    if (categoryName === 'Public Safety') {
        return `Nais kong i-report ang isyu na may kinalaman sa kaligtasan${placeIn || ''}. ${capitalizeFirst(cleaned.endsWith('.') ? cleaned : `${cleaned}.`)} Humihiling ako ng tulong mula sa barangay officials.${locSuffix}`;
    }

    return `Nais kong i-report ang sumusunod na isyu${placeIn || ''}: ${capitalizeFirst(cleaned.endsWith('.') ? cleaned : `${cleaned}.`)} Humihiling ako ng tulong mula sa barangay.${locSuffix}`;
}

function improveDescriptionFallback(description, location, categoryName) {
    return polishDescription(description, location, categoryName);
}

function fallbackComplaintAssist({ description, location, categories }) {
    const combined = `${description} ${location || ''}`;
    const category = matchCategory(combined, categories);
    const priority = matchPriority(combined);
    const categoryTl = CATEGORY_LABELS_TL[category.name] || category.name;

    const priorityTl = {
        URGENT: 'Apurahan (Urgent)',
        HIGH: 'Mataas (High)',
        MEDIUM: 'Katamtaman (Medium)',
        LOW: 'Mababa (Low)',
    }[priority];

    return {
        title: buildTitle(description, category.name),
        description: polishDescription(description, location, category.name),
        categoryId: category.id,
        categoryName: category.name,
        priority,
        explanation: `Nakita kong tungkol ito sa **${categoryTl}** at inirerekomenda ang priority na **${priorityTl}**. Suriin ang mga detalye bago i-submit.`,
        source: 'smart-assist',
    };
}

function isPlausibleAiRewrite(original, aiText, categoryName) {
    if (!aiText?.trim()) {
        return false;
    }

    const categoryKeywords = CATEGORY_KEYWORDS[categoryName] || [];
    const topicInOriginal = categoryKeywords.some((word) => textMatchesKeyword(original, word));

    if (topicInOriginal) {
        const topicInAi = categoryKeywords.some((word) => textMatchesKeyword(aiText, word));
        if (!topicInAi) {
            return false;
        }
    }

    const origWords = normalizeMatchText(original)
        .split(/\s+/)
        .filter((word) => word.length >= 4);

    if (origWords.length === 0) {
        return true;
    }

    const aiLower = normalizeMatchText(aiText);
    const overlap = origWords.filter((word) => aiLower.includes(word) || textMatchesKeyword(aiLower, word)).length;

    return overlap >= Math.min(2, origWords.length);
}

function isPlausibleAiDescription(original, aiText, categoryName) {
    if (!aiText?.trim() || aiText.length < 40) {
        return false;
    }

    const formalMarkers = ['nais', 'reklamo', 'report', 'humihiling', 'problema', 'isyu', 'nakakaabala', 'barangay'];
    const aiLower = normalizeMatchText(aiText);
    if (!formalMarkers.some((word) => aiLower.includes(word))) {
        return false;
    }

    const categoryKeywords = CATEGORY_KEYWORDS[categoryName] || [];
    const topicInOriginal = categoryKeywords.some((word) => textMatchesKeyword(original, word));

    if (topicInOriginal) {
        return categoryKeywords.some((word) => textMatchesKeyword(aiText, word));
    }

    const origWords = normalizeMatchText(original)
        .split(/\s+/)
        .filter((word) => word.length >= 4);

    if (origWords.length === 0) {
        return true;
    }

    return origWords.some((word) => aiLower.includes(word) || textMatchesKeyword(aiLower, word));
}

function pickAiField(original, aiValue, fallbackValue, categoryName, { isDescription = false } = {}) {
    const trimmed = aiValue?.trim();
    if (!trimmed) {
        return fallbackValue;
    }

    const isValid = isDescription
        ? isPlausibleAiDescription(original, trimmed, categoryName)
        : isPlausibleAiRewrite(original, trimmed, categoryName);

    return isValid ? trimmed : fallbackValue;
}

async function assistComplaint({ description, location, title, categories }) {
    if (!description?.trim()) {
        throw new Error('Description is required for AI assistance.');
    }

    const combined = `${description} ${location || ''}`.trim();
    const ruleCategory = matchCategory(combined, categories);
    const rulePriority = matchPriority(combined);
    const ruleScore = getCategoryMatchScore(combined, ruleCategory.name);
    const categoryTl = CATEGORY_LABELS_TL[ruleCategory.name] || ruleCategory.name;

    const priorityTl = {
        URGENT: 'Apurahan (Urgent)',
        HIGH: 'Mataas (High)',
        MEDIUM: 'Katamtaman (Medium)',
        LOW: 'Mababa (Low)',
    }[rulePriority];

    const ruleBaseline = {
        title: buildTitle(description, ruleCategory.name),
        description: polishDescription(description, location, ruleCategory.name),
        categoryId: ruleCategory.id,
        categoryName: ruleCategory.name,
        priority: rulePriority,
        explanation: `Nakita kong tungkol ito sa **${categoryTl}** at inirerekomenda ang priority na **${priorityTl}**. Suriin ang mga detalye bago i-submit.`,
    };

    const systemPrompt = `You are a Barangay Portal assistant in the Philippines.
Rewrite the resident's complaint into a clear, professional barangay report in Tagalog.
Category and priority are FIXED — do not change the issue type.
Respond ONLY with valid JSON:
{
  "title": "string, max 70 chars, concise and professional",
  "description": "string, 2 formal Tagalog sentences for barangay officials",
  "explanation": "string, 1 short Tagalog sentence about what you improved"
}
Example input: "may maingay dun sa kabilang kanto"
Example output description: "Nais kong i-report ang labis na ingay na nanggagaling sa kabilang kanto. Nakakaabala ito sa kapayapaan ng aming lugar at humihiling ako ng tulong mula sa barangay."
Rules:
- Write formal, respectful Tagalog suitable for officials.
- Preserve ALL facts (location, issue type). Do not invent details.
- Never change the issue (e.g. do not turn noise into road problems).`;

    const userPrompt = `Category (fixed): ${ruleCategory.name}
Priority (fixed): ${rulePriority}
Location: ${location || '(not provided)'}
Current title: ${title || '(empty)'}
Resident description:
${description}

Rewrite into a professional barangay complaint.`;

    try {
        const { content, source } = await callAI(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { jsonMode: true }
        );

        if (!content) {
            return { ...ruleBaseline, source: 'smart-assist' };
        }

        const parsed = JSON.parse(content);

        return {
            title: ruleScore > 0
                ? ruleBaseline.title
                : pickAiField(description, parsed.title, ruleBaseline.title, ruleCategory.name),
            description: ruleScore > 0
                ? ruleBaseline.description
                : pickAiField(description, parsed.description, ruleBaseline.description, ruleCategory.name, { isDescription: true }),
            categoryId: ruleBaseline.categoryId,
            categoryName: ruleBaseline.categoryName,
            priority: ruleBaseline.priority,
            explanation: parsed.explanation?.trim() && isPlausibleAiDescription(description, parsed.explanation, ruleCategory.name)
                ? parsed.explanation.trim()
                : ruleBaseline.explanation,
            source,
        };
    } catch (error) {
        console.error('AI complaint assist error:', error.message);
        return { ...ruleBaseline, source: 'smart-assist' };
    }
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

function tryFaqReply(message, user, contextData = {}) {
    const lower = message.toLowerCase();
    const { services = [], complaintStats = null } = contextData;

    if (/file|mag-file|mag file|i-file|report|magreport|complain|paano.*(reklamo|complaint)/.test(lower)) {
        if (user.role !== 'RESIDENT') {
            return 'Ang pag-file ng reklamo ay para lamang sa **Residents**. Bilang official, maaari mong pamahalaan ang mga reklamo sa **Complaints** page.';
        }
        return 'Para mag-file ng reklamo:\n1. Pumunta sa **Complaints** sa sidebar\n2. I-click ang **File Complaint**\n3. I-describe ang issue at gamitin ang **AI Assist** kung kailangan\n4. I-submit ang form';
    }

    if (/status|track|saan na|progress/.test(lower) && /reklamo|complaint/.test(lower)) {
        if (user.role === 'RESIDENT') {
            const stats = complaintStats
                ? `\n\nMga reklamo mo ngayon: **${complaintStats.pending || 0} Pending**, **${complaintStats.in_progress || 0} In Progress**, **${complaintStats.resolved || 0} Resolved**.`
                : '';
            return `Para makita ang status ng reklamo mo, pumunta sa **Complaints**, i-click ang reklamo mo, at tingnan ang **Status ng Reklamo** tracker sa taas.${stats}`;
        }
        return 'Bilang official, maaari mong i-update ang status ng reklamo sa **Complaints** → piliin ang reklamo → **Update Status**.';
    }

    if (/clearance/.test(lower) && !/business|permit/.test(lower)) {
        const svc = services.find((s) => /barangay clearance/i.test(s.name));
        if (svc) {
            return `Ang **Barangay Clearance** ay may bayad na **₱${svc.fee}**, ${svc.processingDays} araw ang processing. Requirements: ${svc.requirements}. Pumunta sa **Services** para mag-request.`;
        }
    }

    if (/barangay id|brgy id/.test(lower)) {
        const svc = services.find((s) => /barangay id/i.test(s.name));
        if (svc) {
            return `Ang **Barangay ID** ay may bayad na **₱${svc.fee}**, ${svc.processingDays} araw ang processing. Requirements: ${svc.requirements}. Pumunta sa **Services** para mag-request.`;
        }
    }

    if (/indigency|indigent/.test(lower)) {
        const svc = services.find((s) => /indigency/i.test(s.name));
        if (svc) {
            return `Ang **Certificate of Indigency** ay **libre (₱0)** at ${svc.processingDays} araw ang processing. Requirements: ${svc.requirements}. Pumunta sa **Services** para mag-request.`;
        }
    }

    if (/business|permit/.test(lower)) {
        const svc = services.find((s) => /business|permit/i.test(s.name));
        if (svc) {
            return `Ang **${svc.name}** ay may bayad na **₱${svc.fee}**, ${svc.processingDays} araw ang processing. Requirements: ${svc.requirements}. Pumunta sa **Services**.`;
        }
    }

    if (/requirements/.test(lower) && /clearance|document|serbisyo|service|certificate/.test(lower)) {
        const list = services.map((s) => `• **${s.name}** — ₱${s.fee}, ${s.processingDays} araw, Requirements: ${s.requirements}`).join('\n');
        return `Mga serbisyo sa **Services** page:\n${list}`;
    }

    if (/serbisyo|service|certificate|available|ano ang mga|anong mga/.test(lower)) {
        const list = services.map((s) => `• **${s.name}** — ₱${s.fee}, ${s.processingDays} araw`).join('\n');
        return `Mga available na serbisyo sa **Services** page:\n${list || '• Barangay Clearance\n• Barangay ID\n• Certificate of Indigency\n• Business Clearance'}\n\nI-click ang serbisyo para makita ang buong requirements.`;
    }

    if (/suggestion|idea|mungkahi/.test(lower)) {
        if (user.role !== 'RESIDENT') {
            return 'Ang pag-submit ng suggestions ay para sa residents. Bilang official, tingnan ang **Suggestions** page para mag-review.';
        }
        return 'Para mag-submit ng idea: **Suggestions** → **Submit Idea**. Ang community ay puwedeng bumoto sa mga suggestions.';
    }

    if (/announcement|balita|update/.test(lower)) {
        return 'Tingnan ang **Announcements** sa sidebar para sa pinakabagong balita at abiso mula sa barangay.';
    }

    if (/^(hello|hi|kumusta|magandang|help|tulong)\b|ano ang barangay portal/.test(lower)) {
        return `Kumusta, ${user.firstName}! Ako ang **Barangay AI Assistant**. Matutulungan kita sa:\n• Pag-file at pag-track ng reklamo\n• Mga dokumento at serbisyo ng barangay\n• Suggestions at announcements\n\nAno ang maitutulong ko sa iyo?`;
    }

    return null;
}

function fallbackChatReply(message, user, contextData = {}) {
    const faq = tryFaqReply(message, user, contextData);
    if (faq) {
        return faq;
    }
    return 'Salamat sa mensahe! Para sa reklamo, pumunta sa **Complaints**. Para sa dokumento, tingnan ang **Services**. Para sa balita, buksan ang **Announcements**. May specific na tanong ka ba?';
}

function buildChatMessages({ message, history, context }) {
    const systemPrompt = `You are the Barangay Portal AI Assistant for a Philippine barangay website.
STRICT RULES:
- Answer ONLY using the knowledge base below. NEVER invent fees, steps, or features.
- Maximum 3 short sentences. Use **bold** for menu names like **Complaints**, **Services**.
- Respond in Tagalog if user writes Tagalog, English if English.
- Navigation is via sidebar: Dashboard, Complaints, Suggestions, Announcements, Services.
- To file complaint: **Complaints** → **File Complaint** → fill form → Submit.
- To track status: **Complaints** → open complaint → **Status ng Reklamo**.
- Do NOT mention photos, videos, evidence, or steps not in the knowledge base.

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

async function* streamChatWithAssistant({ message, history, context, user, contextData }) {
    if (!message?.trim()) {
        throw new Error('Message is required.');
    }

    const faqReply = tryFaqReply(message, user, contextData);
    if (faqReply) {
        yield { type: 'meta', source: 'portal-guide' };
        for await (const chunk of streamTextByWords(faqReply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: 'portal-guide' };
        return;
    }

    const messages = buildChatMessages({ message, history, context });

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
        const reply = content || fallbackChatReply(message, user, contextData);
        const finalSource = content ? source : 'smart-assist';

        yield { type: 'meta', source: finalSource };
        for await (const chunk of streamTextByWords(reply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: finalSource };
    } catch (error) {
        console.error('AI chat stream error:', error.message);
        const reply = fallbackChatReply(message, user, contextData);
        yield { type: 'meta', source: 'smart-assist' };
        for await (const chunk of streamTextByWords(reply)) {
            yield { type: 'token', text: chunk };
        }
        yield { type: 'done', source: 'smart-assist' };
    }
}

async function chatWithAssistant({ message, history, context, user, contextData }) {
    if (!message?.trim()) {
        throw new Error('Message is required.');
    }

    const faqReply = tryFaqReply(message, user, contextData);
    if (faqReply) {
        return { reply: faqReply, source: 'portal-guide' };
    }

    const messages = buildChatMessages({ message, history, context });

    try {
        const { content, source } = await callAI(messages);

        if (!content) {
            return {
                reply: fallbackChatReply(message, user, contextData),
                source: 'smart-assist',
            };
        }

        return { reply: content, source };
    } catch (error) {
        console.error('AI chat error:', error.message);
        return {
            reply: fallbackChatReply(message, user, contextData),
            source: 'smart-assist',
        };
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

