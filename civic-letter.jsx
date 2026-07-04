import React, { useEffect, useState } from "react";
import { MapPin, Loader2, Mail, Copy, Check, PenLine, Sparkles, FileText, ExternalLink, ChevronLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Civic Letter — find your Canadian representatives at every level    */
/* and send them a well-written letter in minutes. Bilingual EN/FR.    */
/*                                                                     */
/* Representative lookup uses two paths:                               */
/*   1. Direct call to the Represent API (represent.opennorth.ca).    */
/*      Works when the app is deployed on a normal website.            */
/*   2. Fallback: Anthropic API + web search, which retrieves the      */
/*      same directory data. This path works inside Claude's sandboxed */
/*      artifact preview, where outside network calls are blocked.     */
/* ------------------------------------------------------------------ */

const ISSUES = [
    { id: "roads", en: "Roads & infrastructure", fr: "Routes et infrastructures" },
    { id: "transit", en: "Public transit", fr: "Transport en commun" },
    { id: "taxes", en: "Taxes & government spending", fr: "Impôts et dépenses publiques" },
    { id: "housing", en: "Housing & affordability", fr: "Logement et abordabilité" },
    { id: "health", en: "Healthcare & services", fr: "Soins de santé et services" },
    { id: "safety", en: "Public safety", fr: "Sécurité publique" },
    { id: "environment", en: "Environment & parks", fr: "Environnement et parcs" },
    { id: "other", en: "Other concern", fr: "Autre préoccupation" },
];

const LEVEL_ORDER = ["Municipal", "Regional", "Provincial", "Federal"];
const LEVEL_LABELS = {
    Municipal: { en: "Municipal", fr: "Municipal" },
    Regional: { en: "Regional", fr: "Régional" },
    Provincial: { en: "Provincial", fr: "Provincial" },
    Federal: { en: "Federal", fr: "Fédéral" },
};

const STR = {
    en: {
        tagline:
            "Find your elected representatives at every level of government in Canada and send them a clear, professional letter about the issues that matter to you — in minutes.",
        step1: "Find your representatives",
        postalPlaceholder: "Postal code (K1A 0A9)",
        lookup: "Look up",
        looking: "Looking up…",
        searchingDirectories: "Searching official directories… this can take up to a minute.",
        invalidPostal: "Enter a valid Canadian postal code, like K1A 0A9.",
        notFound: "That postal code wasn't found. Double-check it and try again.",
        lookupFailed: "The representative lookup didn't succeed. Double-check the postal code and try again in a moment.",
        noneFound: "No representatives were found for that postal code.",
        step2: "Choose who to write to",
        noEmail: "No public email — letter can be copied instead",
        step3: "Describe your concern",
        aiMode: "AI-drafted letter",
        aiUnavailable:
            "AI drafting runs privately on your own device via Ollama (ollama.com) — no model was detected, so the fill-in template is selected. The template works great on its own.",
        templateMode: "Fill-in template",
        yourName: "Your name (used to sign the letter)",
        namePlaceholder: "Jane Doe",
        issueCategory: "Issue category",
        describeLabel: "What's going on, in your own words",
        describePlaceholder:
            "Example: The potholes on Elm Street have gone unrepaired for two years despite multiple 311 reports…",
        tooShort: "Describe your concern in a sentence or two (at least 20 characters) so the letter has substance.",
        draft: "Draft my letter",
        redraft: "Redraft letter",
        drafting: "Drafting…",
        localDraftHint: "Drafting on your device with {model} — the first letter can take a few minutes while the model loads.",
        draftedLocally: "Drafted privately on your device by {model}. Double-check names and details before sending.",
        draftFailed: "The drafting service is unavailable right now. You can switch to the template option instead.",
        step4: "Review & send",
        subject: "Subject",
        letter: "Letter",
        doneEditing: "Done editing",
        openEmail: "Open in your email app",
        copyLetter: "Copy letter",
        copied: "Copied",
        copyFailed: "Copy failed — select the text and copy it manually.",
        edit: "Edit before sending",
        officialPage: "Official's page",
        noEmailNote:
            "This official doesn't publish an email address in the directory. Copy the letter and submit it through their contact page instead.",
        longNote:
            "This letter is long, and some email apps truncate pre-filled messages. If it opens incomplete, use \"Copy letter\" and paste it in instead.",
        multiLevelTip:
            "Tip: the same concern often touches more than one level of government. Scroll up to pick another representative and redraft — your description carries over.",
        newSearch: "Search a different postal code",
        government: "government",
        concernedConstituent: "A concerned constituent",
        subjectPrefix: "Constituent concern",
    },
    fr: {
        tagline:
            "Trouvez vos représentants élus à tous les paliers de gouvernement au Canada et envoyez-leur une lettre claire et professionnelle sur les enjeux qui vous tiennent à cœur — en quelques minutes.",
        step1: "Trouvez vos représentants",
        postalPlaceholder: "Code postal (K1A 0A9)",
        lookup: "Rechercher",
        looking: "Recherche…",
        searchingDirectories: "Consultation des répertoires officiels… cela peut prendre jusqu'à une minute.",
        invalidPostal: "Entrez un code postal canadien valide, par exemple K1A 0A9.",
        notFound: "Ce code postal est introuvable. Vérifiez-le et réessayez.",
        lookupFailed: "La recherche de représentants a échoué. Vérifiez le code postal et réessayez dans un instant.",
        noneFound: "Aucun représentant n'a été trouvé pour ce code postal.",
        step2: "Choisissez votre destinataire",
        noEmail: "Aucun courriel public — la lettre peut être copiée",
        step3: "Décrivez votre préoccupation",
        aiMode: "Lettre rédigée par IA",
        aiUnavailable:
            "La rédaction par IA s'exécute en toute confidentialité sur votre appareil via Ollama (ollama.com) — aucun modèle détecté, le modèle à remplir est donc sélectionné. Il fonctionne très bien à lui seul.",
        templateMode: "Modèle à remplir",
        yourName: "Votre nom (pour signer la lettre)",
        namePlaceholder: "Jeanne Tremblay",
        issueCategory: "Catégorie d'enjeu",
        describeLabel: "Ce qui se passe, dans vos propres mots",
        describePlaceholder:
            "Exemple : Les nids-de-poule de la rue Elm ne sont pas réparés depuis deux ans malgré plusieurs signalements au 311…",
        tooShort: "Décrivez votre préoccupation en une ou deux phrases (au moins 20 caractères) pour donner de la substance à la lettre.",
        draft: "Rédiger ma lettre",
        redraft: "Rédiger de nouveau",
        drafting: "Rédaction…",
        localDraftHint: "Rédaction sur votre appareil avec {model} — la première lettre peut prendre quelques minutes pendant le chargement du modèle.",
        draftedLocally: "Rédigée en toute confidentialité sur votre appareil par {model}. Vérifiez les noms et les détails avant l'envoi.",
        draftFailed: "Le service de rédaction est indisponible pour le moment. Vous pouvez utiliser le modèle à remplir.",
        step4: "Réviser et envoyer",
        subject: "Objet",
        letter: "Lettre",
        doneEditing: "Terminer la modification",
        openEmail: "Ouvrir dans votre courriel",
        copyLetter: "Copier la lettre",
        copied: "Copiée",
        copyFailed: "La copie a échoué — sélectionnez le texte et copiez-le manuellement.",
        edit: "Modifier avant d'envoyer",
        officialPage: "Page de l'élu(e)",
        noEmailNote:
            "Cet(te) élu(e) ne publie pas d'adresse courriel dans le répertoire. Copiez la lettre et soumettez-la via sa page de contact.",
        longNote:
            "Cette lettre est longue et certaines applications de courriel tronquent les messages préremplis. Si elle s'ouvre incomplète, utilisez « Copier la lettre » et collez-la.",
        multiLevelTip:
            "Astuce : une même préoccupation touche souvent plus d'un palier de gouvernement. Remontez pour choisir un autre représentant et rédigez de nouveau — votre description est conservée.",
        newSearch: "Chercher un autre code postal",
        government: "gouvernement",
        concernedConstituent: "Un(e) citoyen(ne) préoccupé(e)",
        subjectPrefix: "Préoccupation d'un citoyen",
    },
};

/* ----------------------------- helpers ----------------------------- */

function classifyLevel(rep) {
    const set = (rep.representative_set_name || "").toLowerCase();
    const office = (rep.elected_office || "").toLowerCase();
    if (set.includes("house of commons") || office === "mp" || office.includes("député fédéral")) return "Federal";
    if (
        set.includes("legislative assembly") ||
        set.includes("assemblée nationale") ||
        set.includes("national assembly") ||
        set.includes("house of assembly") ||
        ["mpp", "mla", "mna", "mha"].includes(office)
    )
        return "Provincial";
    if (set.includes("regional") || office.includes("regional")) return "Regional";
    return "Municipal";
}

function normalizeLevel(raw) {
    const v = (raw || "").toLowerCase();
    if (v.startsWith("fed") || v.startsWith("féd")) return "Federal";
    if (v.startsWith("prov")) return "Provincial";
    if (v.startsWith("reg") || v.startsWith("rég")) return "Regional";
    if (v.startsWith("mun")) return "Municipal";
    return null;
}

function groupReps(list) {
    const seen = new Set();
    const byLevel = {};
    list.forEach((r) => {
        if (!r || !r.name) return;
        const key = `${r.name}|${r.elected_office || ""}|${r.district_name || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        const lvl = normalizeLevel(r.level) || classifyLevel(r);
        (byLevel[lvl] = byLevel[lvl] || []).push(r);
    });
    return byLevel;
}

/* The Represent directory has no municipal council data for many smaller
   cities, towns, and villages. So every postal code can still write to all
   political levels, synthesize a "Mayor & Council" entry for the municipality
   — the letter can be copied and submitted via the town office, and the
   linked search finds the exact contact page. */
/* Represent returns city names in ALL CAPS ("NEWBROOK") — normalize for
   display and letters, preserving word starts after spaces/hyphens/apostrophes. */
function titleCaseCity(raw) {
    return (raw || "").toLowerCase().replace(/(^|[\s\-'’.])([a-zà-ÿ])/g, (m, sep, ch) => sep + ch.toUpperCase());
}

function municipalFallbackRep(city, lang) {
    const fr = lang === "fr";
    const query = encodeURIComponent(
        city ? `${city} ${fr ? "maire conseil municipal coordonnées" : "mayor council office contact"}` : fr ? "mon bureau municipal" : "my municipal office contact",
    );
    return {
        name: city ? (fr ? `Maire et conseil de ${city}` : `Mayor & Council of ${city}`) : fr ? "Votre bureau municipal" : "Your municipal office",
        elected_office: fr ? "Administration municipale" : "Municipal office",
        district_name: city || null,
        party_name: null,
        email: null,
        url: `https://www.google.com/search?q=${query}`,
        synthetic: true,
    };
}

function extractJson(text) {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no-json");
    return JSON.parse(clean.slice(start, end + 1));
}

/* ------------------------- local AI (Ollama) ------------------------ */
/* Letter drafting prefers a small local model served by Ollama (e.g.
   Google's Gemma) so drafts never leave the device and need no API key.
   The Anthropic API remains the fallback when no local model is running. */

const OLLAMA_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OLLAMA_URL) || "http://localhost:11434";
const OLLAMA_MODEL_OVERRIDE = typeof import.meta !== "undefined" && import.meta.env?.VITE_OLLAMA_MODEL;
const ANTHROPIC_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ANTHROPIC_API_KEY) || "";

let cachedLocalModel; // undefined = not checked yet, null = unavailable
async function detectLocalModel() {
    if (cachedLocalModel !== undefined) return cachedLocalModel;
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error("no-ollama");
        const data = await res.json();
        const names = (data.models || []).map((m) => m.name).filter((n) => !n.includes("embed"));
        cachedLocalModel =
            (OLLAMA_MODEL_OVERRIDE && names.find((n) => n.startsWith(OLLAMA_MODEL_OVERRIDE))) ||
            OLLAMA_MODEL_OVERRIDE ||
            names.find((n) => n.startsWith("gemma")) ||
            names[0] ||
            null;
    } catch (e) {
        cachedLocalModel = null;
    }
    return cachedLocalModel;
}

async function callLocalAI(prompt, model) {
    const ctrl = new AbortController();
    // generous timeout: the first request loads the model into memory
    const timer = setTimeout(() => ctrl.abort(), 300000);
    try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                stream: false,
                format: "json",
                messages: [{ role: "user", content: prompt }],
            }),
            signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("ollama-error");
        const data = await res.json();
        return data.message?.content || "";
    } finally {
        clearTimeout(timer);
    }
}

async function callClaude(payload) {
    /* Inside Claude's artifact preview the request is proxied and needs no key.
       On a real website, supply VITE_ANTHROPIC_API_KEY (see .env.example) so the
       request authenticates directly with the Anthropic API from the browser. */
    const headers = { "Content-Type": "application/json" };
    if (ANTHROPIC_KEY) {
        headers["x-api-key"] = ANTHROPIC_KEY;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, ...payload }),
    });
    if (!response.ok) throw new Error("api-error");
    const data = await response.json();
    return (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
}

/* Path 1: direct call to the Represent API (works on a normal website). */
async function lookupDirect(code) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
        const res = await fetch(`https://represent.opennorth.ca/postcodes/${code}/`, { signal: ctrl.signal });
        if (res.status === 404) return { status: "not-found" };
        if (!res.ok) return { status: "error" };
        const data = await res.json();
        const all = [...(data.representatives_centroid || []), ...(data.representatives_concordance || [])];
        return { status: "ok", city: data.city || "", reps: all };
    } catch (e) {
        return { status: "blocked" }; // network blocked (sandbox) or timed out
    } finally {
        clearTimeout(timer);
    }
}

/* Path 2: fallback via the Anthropic API with web search (works in the
   sandboxed preview, where direct outside requests are blocked).       */
async function lookupViaAI(code) {
    const prompt = `Find the current elected representatives for the Canadian postal code ${code} at every level of government: the federal Member of Parliament, the provincial member (MPP/MLA/MNA/MHA), the mayor, and the city/ward councillor(s), plus regional-level representatives if applicable.

A reliable source is the Open North Represent API: https://represent.opennorth.ca/postcodes/${code}/ — fetch or search for its data. Cross-check with official government directories if needed.

Respond ONLY with a valid JSON object, no markdown fences and no commentary, in exactly this shape:
{"city": "city name or null", "representatives": [{"name": "...", "elected_office": "...", "district_name": "... or null", "party_name": "... or null", "email": "... or null", "url": "... or null", "level": "Federal|Provincial|Regional|Municipal"}]}

Include only real, current officials you can verify. If the postal code is invalid or nothing can be found, respond with {"city": null, "representatives": []}.`;

    const text = await callClaude({
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20260209", name: "web_search" }],
    });
    const parsed = extractJson(text);
    return { status: "ok", city: parsed.city || "", reps: parsed.representatives || [] };
}

/* ----------------------------- letters ----------------------------- */

function salutationEn(rep) {
    const last = (rep.name || "").trim().split(" ").slice(-1)[0];
    const office = (rep.elected_office || "").toLowerCase();
    if (office.includes("mayor")) return `Dear Mayor ${last}`;
    if (office.includes("councillor") || office.includes("councilor")) return `Dear Councillor ${last}`;
    return `Dear ${rep.name}`;
}

function buildTemplateLetter({ rep, level, issueLabel, description, userName, city, lang }) {
    const locale = lang === "fr" ? "fr-CA" : "en-CA";
    const today = new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
    const s = STR[lang];

    let lines;
    if (lang === "fr") {
        lines = [
            today,
            "",
            `À l'attention de ${rep.name}`,
            `${rep.elected_office || ""}${rep.district_name ? ", " + rep.district_name : ""}`,
            "",
            "Madame, Monsieur,",
            "",
            `Je vous écris en tant que citoyen(ne)${rep.district_name ? ` de ${rep.district_name}` : ""} au sujet de l'enjeu suivant : ${issueLabel.toLowerCase()}.`,
            "",
            description.trim(),
            "",
            `En tant que contribuable, je souhaite que nos fonds publics soient utilisés efficacement, et je crois que cette question mérite votre attention au palier ${LEVEL_LABELS[level].fr.toLowerCase()}. Je vous serais reconnaissant(e) de m'indiquer les mesures que vous ou votre bureau comptez prendre à ce sujet.`,
            "",
            "Je vous remercie de votre temps et de votre engagement envers notre communauté.",
            "",
            "Veuillez agréer, Madame, Monsieur, mes salutations distinguées.",
            "",
            userName || s.concernedConstituent,
            city || "",
        ];
    } else {
        lines = [
            today,
            "",
            `${rep.name}`,
            `${rep.elected_office || ""}${rep.district_name ? ", " + rep.district_name : ""}`,
            "",
            `${salutationEn(rep)},`,
            "",
            `I am writing to you as a constituent${rep.district_name ? ` of ${rep.district_name}` : ""} regarding ${issueLabel.toLowerCase()}.`,
            "",
            description.trim(),
            "",
            `As a taxpayer, I want to see our public dollars used effectively, and I believe this issue deserves your attention at the ${level.toLowerCase()} level. I would appreciate a response outlining what action you or your office intend to take on this matter.`,
            "",
            "Thank you for your time and your service to our community.",
            "",
            "Sincerely,",
            userName || s.concernedConstituent,
            city || "",
        ];
    }
    return {
        subject: `${s.subjectPrefix} : ${issueLabel}`.replace(" :", lang === "fr" ? " :" : ":"),
        body: lines.join("\n").replace(/\n{3,}/g, "\n\n"),
    };
}

async function draftWithAI({ rep, level, issueLabel, description, userName, lang, localModel }) {
    const langLine =
        lang === "fr"
            ? "Write the letter entirely in formal Canadian French, using the appropriate register and salutation conventions for correspondence with elected officials in Canada."
            : "Write the letter in English.";
    const prompt = `You are drafting a formal letter from a constituent to a Canadian elected official.

Official: ${rep.name}, ${rep.elected_office || "elected official"}${rep.district_name ? `, ${rep.district_name}` : ""}
Government level: ${level}
${rep.party_name ? `Party: ${rep.party_name}` : ""}
Constituent name: ${userName || (lang === "fr" ? "Un(e) citoyen(ne) préoccupé(e)" : "A concerned constituent")}
Issue category: ${issueLabel}
The constituent's concern, in their own words:
"""
${description}
"""

${langLine}

Write a respectful, persuasive letter of roughly 200–280 words that:
- Uses the correct salutation for this official
- Frames the concern around effective use of tax dollars where appropriate
- Focuses on matters within this level of government's jurisdiction
- Asks for a specific response or action
- Closes formally with the constituent's name
- Uses only the information provided above — never invents facts and never inserts bracketed placeholders like [Your Address]

Respond ONLY with a valid JSON object, no markdown fences, in this exact shape:
{"subject": "short email subject line", "body": "the full letter with \\n line breaks"}`;

    /* Preferred path: the local model (private, free, offline). */
    if (localModel) {
        try {
            const localText = await callLocalAI(prompt, localModel);
            const parsed = extractJson(localText);
            if (parsed.subject && parsed.body) return { ...parsed, engine: localModel };
        } catch (e) {
            /* local model failed or timed out — fall back to the cloud API */
        }
    }

    const text = await callClaude({ messages: [{ role: "user", content: prompt }] });
    try {
        const parsed = extractJson(text);
        if (parsed.subject && parsed.body) return parsed;
    } catch (e) {
        /* fall through — use raw text as the body */
    }
    const fallbackSubject = lang === "fr" ? "Préoccupation d'un citoyen" : "A concern from your constituent";
    return { subject: fallbackSubject, body: text.replace(/```json|```/g, "").trim() };
}

/* ------------------------------- app ------------------------------- */

export default function CivicLetter() {
    const [lang, setLang] = useState("en");
    const t = STR[lang];

    const [postal, setPostal] = useState("");
    const [loading, setLoading] = useState(false);
    const [slowLookup, setSlowLookup] = useState(false); // true while AI fallback runs
    const [error, setError] = useState("");
    const [grouped, setGrouped] = useState(null);
    const [cityHint, setCityHint] = useState("");
    const [selected, setSelected] = useState(null);

    const [userName, setUserName] = useState("");
    const [issue, setIssue] = useState(ISSUES[0].id);
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState("ai");
    const [aiAvailable, setAiAvailable] = useState(true); // optimistic until checked
    const [drafting, setDrafting] = useState(false);
    const [draftEngine, setDraftEngine] = useState(null); // local model name while drafting locally
    const [draftError, setDraftError] = useState("");

    /* Public visitors have no local Ollama model and this site ships no API
       key — detect that once and default them to the fill-in template. */
    useEffect(() => {
        let alive = true;
        detectLocalModel().then((model) => {
            if (!alive) return;
            const available = !!model || !!ANTHROPIC_KEY;
            setAiAvailable(available);
            if (!available) setMode("template");
        });
        return () => {
            alive = false;
        };
    }, []);

    const [letter, setLetter] = useState(null);
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);

    const postalValid = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim());

    async function lookup() {
        setError("");
        setGrouped(null);
        setSelected(null);
        setLetter(null);
        setSlowLookup(false);
        if (!postalValid) {
            setError(t.invalidPostal);
            return;
        }
        setLoading(true);
        const code = postal.trim().toUpperCase().replace(/\s/g, "");
        try {
            let result = await lookupDirect(code);
            if (result.status === "not-found") {
                setError(t.notFound);
                return;
            }
            if (result.status !== "ok") {
                // Direct path blocked (sandboxed preview) or down — use the AI fallback.
                setSlowLookup(true);
                result = await lookupViaAI(code);
            }
            const byLevel = groupReps(result.reps || []);
            if (Object.keys(byLevel).length === 0) {
                setError(t.noneFound);
                return;
            }
            const city = titleCaseCity(result.city);
            if (!byLevel.Municipal?.length) {
                byLevel.Municipal = [municipalFallbackRep(city, lang)];
            }
            setCityHint(city);
            setGrouped(byLevel);
        } catch (e) {
            setError(t.lookupFailed);
        } finally {
            setLoading(false);
            setSlowLookup(false);
        }
    }

    async function generate() {
        setDraftError("");
        if (!selected) return;
        if (description.trim().length < 20) {
            setDraftError(t.tooShort);
            return;
        }
        const issueObj = ISSUES.find((i) => i.id === issue) || ISSUES[0];
        const issueLabel = issueObj[lang];
        const args = { rep: selected.rep, level: selected.level, issueLabel, description, userName, city: cityHint, lang };
        if (mode === "template") {
            setLetter(buildTemplateLetter(args));
            setEditing(false);
            return;
        }
        setDrafting(true);
        try {
            const localModel = await detectLocalModel();
            setDraftEngine(localModel);
            const result = await draftWithAI({ ...args, localModel });
            setLetter(result);
            setEditing(false);
        } catch (e) {
            setDraftError(t.draftFailed);
        } finally {
            setDrafting(false);
            setDraftEngine(null);
        }
    }

    function mailtoHref() {
        if (!letter || !selected?.rep?.email) return null;
        return `mailto:${selected.rep.email}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`;
    }

    async function copyLetter() {
        if (!letter) return;
        try {
            await navigator.clipboard.writeText(`${t.subject}: ${letter.subject}\n\n${letter.body}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            setDraftError(t.copyFailed);
        }
    }

    const longBody = letter && letter.body.length > 1800;

    return (
        <div className="cl-root">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;700&family=Public+Sans:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
                rel="stylesheet"
            />
            <style>{`
        .cl-root { min-height: 100vh; background: #EFEFEA; color: #14213D; font-family: 'Public Sans', system-ui, sans-serif; }
        .cl-wrap { max-width: 720px; margin: 0 auto; padding: 40px 20px 96px; }
        .cl-mast { display: flex; align-items: baseline; gap: 12px; border-bottom: 3px solid #14213D; padding-bottom: 14px; margin-bottom: 8px; }
        .cl-mast h1 { font-family: 'Zilla Slab', serif; font-weight: 700; font-size: 34px; letter-spacing: 0.5px; margin: 0; flex: 1; }
        .cl-mast .flag { width: 14px; height: 14px; background: #C8102E; display: inline-block; transform: rotate(45deg); margin-right: 2px; flex: none; align-self: center; }
        .cl-langs { display: flex; gap: 2px; align-self: center; }
        .cl-lang { font-family: 'Public Sans', sans-serif; font-size: 13px; font-weight: 600; background: none; border: 1.5px solid transparent; border-radius: 5px; padding: 5px 9px; cursor: pointer; color: #5B6272; }
        .cl-lang.on { color: #14213D; border-color: #14213D; }
        .cl-lang:focus-visible { outline: 3px solid rgba(20,33,61,0.4); outline-offset: 1px; }
        .cl-tag { color: #5B6272; font-size: 14px; margin: 10px 0 36px; max-width: 56ch; line-height: 1.5; }
        .cl-step { margin-bottom: 36px; }
        .cl-step-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .cl-step-num { font-family: 'Zilla Slab', serif; font-weight: 700; font-size: 13px; color: #EFEFEA; background: #14213D; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; }
        .cl-step-head h2 { font-family: 'Zilla Slab', serif; font-weight: 700; font-size: 20px; margin: 0; }
        .cl-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .cl-input, .cl-select, .cl-textarea { box-sizing: border-box; font-family: 'Public Sans', sans-serif; font-size: 15px; color: #14213D; background: #FFFFFF; border: 1.5px solid #B9BDC4; border-radius: 6px; padding: 11px 13px; outline: none; }
        .cl-input:focus, .cl-select:focus, .cl-textarea:focus { border-color: #14213D; box-shadow: 0 0 0 3px rgba(20,33,61,0.15); }
        .cl-textarea { width: 100%; min-height: 110px; resize: vertical; line-height: 1.5; }
        .cl-btn { font-family: 'Public Sans', sans-serif; font-weight: 600; font-size: 15px; border: none; border-radius: 6px; padding: 11px 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: transform .06s ease; }
        .cl-btn:active { transform: translateY(1px); }
        .cl-btn:focus-visible { outline: 3px solid rgba(200,16,46,0.5); outline-offset: 2px; }
        .cl-btn-primary { background: #14213D; color: #fff; }
        .cl-btn-primary:hover { background: #1D2E54; }
        .cl-btn-primary:disabled { background: #9AA0AC; cursor: not-allowed; }
        .cl-btn-red { background: #C8102E; color: #fff; }
        .cl-btn-red:hover { background: #A90D27; }
        .cl-btn-red:disabled { background: #9AA0AC; cursor: not-allowed; }
        .cl-btn-ghost { background: transparent; color: #14213D; border: 1.5px solid #B9BDC4; }
        .cl-btn-ghost:hover { border-color: #14213D; }
        .cl-error { color: #C8102E; font-size: 14px; margin-top: 10px; }
        .cl-wait { color: #5B6272; font-size: 13px; margin-top: 10px; display: flex; align-items: center; gap: 8px; }
        .cl-level { margin-bottom: 20px; }
        .cl-level-label { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #5B6272; margin-bottom: 8px; }
        .cl-card { width: 100%; text-align: left; background: #FFFFFF; border: 1.5px solid #D8DAD2; border-radius: 8px; padding: 13px 15px; margin-bottom: 8px; cursor: pointer; font-family: 'Public Sans', sans-serif; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .cl-card:hover { border-color: #14213D; }
        .cl-card:focus-visible { outline: 3px solid rgba(20,33,61,0.4); outline-offset: 2px; }
        .cl-card.sel { border-color: #C8102E; box-shadow: 0 0 0 2px rgba(200,16,46,0.25); }
        .cl-card .nm { font-weight: 600; font-size: 15px; color: #14213D; }
        .cl-card .of { font-size: 13px; color: #5B6272; margin-top: 2px; }
        .cl-card .noemail { font-size: 12px; color: #C8102E; margin-top: 2px; }
        .cl-modes { display: flex; gap: 8px; margin-bottom: 14px; }
        .cl-mode { flex: 1; border: 1.5px solid #B9BDC4; background: #fff; border-radius: 8px; padding: 12px; cursor: pointer; font-family: 'Public Sans', sans-serif; font-size: 14px; font-weight: 600; color: #14213D; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .cl-mode.on { border-color: #14213D; background: #14213D; color: #fff; }
        .cl-mode:disabled { opacity: .45; cursor: not-allowed; }
        .cl-mode:focus-visible { outline: 3px solid rgba(20,33,61,0.4); outline-offset: 2px; }
        .cl-field { margin-bottom: 14px; }
        .cl-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .cl-paper { position: relative; background: #FFFFFF; border: 1px solid #D8DAD2; box-shadow: 0 12px 28px rgba(20,33,61,0.12); padding: 44px 40px 40px; margin-top: 18px; }
        .cl-paper::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: repeating-linear-gradient(90deg, #C8102E 0 24px, #FFFFFF 24px 48px, #14213D 48px 72px, #FFFFFF 72px 96px); }
        .cl-stamp { position: absolute; top: 20px; right: 22px; width: 84px; height: 84px; border: 2px solid rgba(200,16,46,0.55); border-radius: 50%; transform: rotate(-12deg); display: flex; align-items: center; justify-content: center; text-align: center; font-family: 'Zilla Slab', serif; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: rgba(200,16,46,0.75); padding: 8px; pointer-events: none; }
        .cl-subject { font-family: 'Zilla Slab', serif; font-weight: 700; font-size: 19px; margin: 0 90px 18px 0; }
        .cl-body { font-family: 'Lora', serif; font-size: 15.5px; line-height: 1.7; white-space: pre-wrap; color: #23262D; }
        .cl-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
        .cl-note { font-size: 13px; color: #5B6272; margin-top: 12px; line-height: 1.5; }
        .cl-back { background: none; border: none; color: #5B6272; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 0; margin-bottom: 12px; font-family: 'Public Sans', sans-serif; }
        .cl-back:hover { color: #14213D; }
        .cl-spin { animation: clspin 1s linear infinite; }
        @keyframes clspin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .cl-btn { transition: none; } .cl-spin { animation: none; } }
        @media (max-width: 560px) { .cl-paper { padding: 40px 20px 28px; } .cl-stamp { width: 68px; height: 68px; font-size: 9px; } .cl-subject { margin-right: 70px; } }
      `}</style>

            <div className="cl-wrap">
                <header className="cl-mast">
                    <span className="flag" aria-hidden="true"></span>
                    <h1>Civic Letter</h1>
                    <div className="cl-langs" role="group" aria-label="Language / Langue">
                        <button className={"cl-lang" + (lang === "en" ? " on" : "")} onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
                        <button className={"cl-lang" + (lang === "fr" ? " on" : "")} onClick={() => setLang("fr")} aria-pressed={lang === "fr"}>FR</button>
                    </div>
                </header>
                <p className="cl-tag">{t.tagline}</p>

                {/* STEP 1 — postal code */}
                <section className="cl-step">
                    <div className="cl-step-head">
                        <span className="cl-step-num">1</span>
                        <h2>{t.step1}</h2>
                    </div>
                    <div className="cl-row">
                        <input
                            className="cl-input"
                            style={{ width: 190, textTransform: "uppercase" }}
                            placeholder={t.postalPlaceholder}
                            value={postal}
                            maxLength={7}
                            onChange={(e) => setPostal(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !loading && lookup()}
                            aria-label={t.postalPlaceholder}
                        />
                        <button className="cl-btn cl-btn-primary" onClick={lookup} disabled={loading}>
                            {loading ? <Loader2 size={16} className="cl-spin" /> : <MapPin size={16} />}
                            {loading ? t.looking : t.lookup}
                        </button>
                    </div>
                    {loading && slowLookup && (
                        <p className="cl-wait"><Loader2 size={14} className="cl-spin" /> {t.searchingDirectories}</p>
                    )}
                    {error && <p className="cl-error">{error}</p>}
                </section>

                {/* STEP 2 — choose an official */}
                {grouped && (
                    <section className="cl-step">
                        <div className="cl-step-head">
                            <span className="cl-step-num">2</span>
                            <h2>{t.step2}</h2>
                        </div>
                        {LEVEL_ORDER.filter((lvl) => grouped[lvl]?.length).map((lvl) => (
                            <div className="cl-level" key={lvl}>
                                <div className="cl-level-label">{LEVEL_LABELS[lvl][lang]}</div>
                                {grouped[lvl].map((rep, i) => {
                                    const isSel = selected?.rep === rep;
                                    return (
                                        <button
                                            key={lvl + i}
                                            className={"cl-card" + (isSel ? " sel" : "")}
                                            onClick={() => { setSelected({ rep, level: lvl }); setLetter(null); }}
                                        >
                                            <span>
                                                <span className="nm">{rep.name}</span>
                                                <div className="of">
                                                    {rep.elected_office}
                                                    {rep.district_name ? ` · ${rep.district_name}` : ""}
                                                    {rep.party_name ? ` · ${rep.party_name}` : ""}
                                                </div>
                                                {!rep.email && <div className="noemail">{t.noEmail}</div>}
                                            </span>
                                            {isSel && <Check size={18} color="#C8102E" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </section>
                )}

                {/* STEP 3 — describe the concern */}
                {selected && (
                    <section className="cl-step">
                        <div className="cl-step-head">
                            <span className="cl-step-num">3</span>
                            <h2>{t.step3}</h2>
                        </div>
                        <div className="cl-modes" role="tablist" aria-label={t.step3}>
                            <button
                                className={"cl-mode" + (mode === "ai" ? " on" : "")}
                                onClick={() => setMode("ai")}
                                role="tab"
                                aria-selected={mode === "ai"}
                                disabled={!aiAvailable}
                                title={!aiAvailable ? t.aiUnavailable : undefined}
                            >
                                <Sparkles size={15} /> {t.aiMode}
                            </button>
                            <button className={"cl-mode" + (mode === "template" ? " on" : "")} onClick={() => setMode("template")} role="tab" aria-selected={mode === "template"}>
                                <FileText size={15} /> {t.templateMode}
                            </button>
                        </div>
                        {!aiAvailable && <p className="cl-note" style={{ marginTop: -6, marginBottom: 14 }}>{t.aiUnavailable}</p>}
                        <div className="cl-field">
                            <label className="cl-label" htmlFor="cl-name">{t.yourName}</label>
                            <input id="cl-name" className="cl-input" style={{ width: "100%" }} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t.namePlaceholder} />
                        </div>
                        <div className="cl-field">
                            <label className="cl-label" htmlFor="cl-issue">{t.issueCategory}</label>
                            <select id="cl-issue" className="cl-select" style={{ width: "100%" }} value={issue} onChange={(e) => setIssue(e.target.value)}>
                                {ISSUES.map((i) => (
                                    <option key={i.id} value={i.id}>{i[lang]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="cl-field">
                            <label className="cl-label" htmlFor="cl-desc">{t.describeLabel}</label>
                            <textarea
                                id="cl-desc"
                                className="cl-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t.describePlaceholder}
                            />
                        </div>
                        <button className="cl-btn cl-btn-red" onClick={generate} disabled={drafting}>
                            {drafting ? <Loader2 size={16} className="cl-spin" /> : <PenLine size={16} />}
                            {drafting ? t.drafting : letter ? t.redraft : t.draft}
                        </button>
                        {drafting && draftEngine && (
                            <p className="cl-wait"><Loader2 size={14} className="cl-spin" /> {t.localDraftHint.replace("{model}", draftEngine)}</p>
                        )}
                        {draftError && <p className="cl-error">{draftError}</p>}
                    </section>
                )}

                {/* STEP 4 — the letter */}
                {letter && selected && (
                    <section className="cl-step">
                        <div className="cl-step-head">
                            <span className="cl-step-num">4</span>
                            <h2>{t.step4}</h2>
                        </div>

                        {editing ? (
                            <div>
                                <div className="cl-field">
                                    <label className="cl-label" htmlFor="cl-subj">{t.subject}</label>
                                    <input id="cl-subj" className="cl-input" style={{ width: "100%" }} value={letter.subject} onChange={(e) => setLetter({ ...letter, subject: e.target.value })} />
                                </div>
                                <div className="cl-field">
                                    <label className="cl-label" htmlFor="cl-body">{t.letter}</label>
                                    <textarea id="cl-body" className="cl-textarea" style={{ minHeight: 320, fontFamily: "'Lora', serif" }} value={letter.body} onChange={(e) => setLetter({ ...letter, body: e.target.value })} />
                                </div>
                                <button className="cl-btn cl-btn-ghost" onClick={() => setEditing(false)}>
                                    <Check size={15} /> {t.doneEditing}
                                </button>
                            </div>
                        ) : (
                            <div className="cl-paper">
                                <div className="cl-stamp">{LEVEL_LABELS[selected.level][lang]}<br />{t.government}</div>
                                <h3 className="cl-subject">{letter.subject}</h3>
                                <div className="cl-body">{letter.body}</div>
                            </div>
                        )}

                        <div className="cl-actions">
                            {selected.rep.email && (
                                <a className="cl-btn cl-btn-primary" href={mailtoHref()} style={{ textDecoration: "none" }}>
                                    <Mail size={16} /> {t.openEmail}
                                </a>
                            )}
                            <button className="cl-btn cl-btn-ghost" onClick={copyLetter}>
                                {copied ? <Check size={16} color="#2E7D32" /> : <Copy size={16} />}
                                {copied ? t.copied : t.copyLetter}
                            </button>
                            {!editing && (
                                <button className="cl-btn cl-btn-ghost" onClick={() => setEditing(true)}>
                                    <PenLine size={16} /> {t.edit}
                                </button>
                            )}
                            {selected.rep.url && (
                                <a className="cl-btn cl-btn-ghost" href={selected.rep.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <ExternalLink size={16} /> {t.officialPage}
                                </a>
                            )}
                        </div>

                        {letter.engine && <p className="cl-note">{t.draftedLocally.replace("{model}", letter.engine)}</p>}
                        {!selected.rep.email && <p className="cl-note">{t.noEmailNote}</p>}
                        {longBody && selected.rep.email && <p className="cl-note">{t.longNote}</p>}
                        <p className="cl-note">{t.multiLevelTip}</p>
                    </section>
                )}

                {grouped && !selected && (
                    <button className="cl-back" onClick={() => { setGrouped(null); setPostal(""); }}>
                        <ChevronLeft size={14} /> {t.newSearch}
                    </button>
                )}
            </div>
        </div>
    );
}
