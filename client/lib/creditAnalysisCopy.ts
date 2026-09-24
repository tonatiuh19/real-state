/**
 * EN / ES copy for Free Analysis UI (Encore Mortgage).
 * Honesty UX for weak extraction; SmartCredit + compatible text PDFs only.
 */

export type FreeAnalysisLang = "en" | "es";

const copy = {
  en: {
    pageTitle: "Free Analysis",
    pageDescription:
      "Text-based tri-merge PDFs (SmartCredit and compatible). Not Credit Karma or scanned/OCR images.",
    clientRequired: "Client",
    clientPlaceholder: "Search or create a client…",
    createClient: "Create new client",
    uploadLabel: "Credit report PDF",
    uploadHint: "application/pdf only · max 4MB · SmartCredit preferred",
    goalLabel: "Goal",
    languageLabel: "Language",
    emailOptIn: "Email the analysis to the client",
    modeLabel: "Mode",
    modeClient: "Client",
    modeAgent: "Agent-assisted",
    run: "Run analysis",
    running: "Analyzing…",
    historyHeading: "History",
    softPullTitle: "Soft-pull score snapshot",
    softPullBody:
      "Optional MyFreeScoreNow-style affiliate link for a free score snapshot. This is not a bureau soft-pull API — Encore Mortgage branding only.",
    softPullCta: "Open free score link",
    resultBadge: "Analysis ready",
    resultHeading: "Credit analysis",
    resultSubheading: "Algorithm-based review of the uploaded report.",
    extractionWeakBadge: "Limited extraction",
    extractionWeakHeading: "We could not fully read this PDF",
    extractionWeakBody:
      "Scores or negatives may be incomplete. Re-upload a text-based SmartCredit (or compatible) PDF — not Credit Karma or a photo/scan.",
    extractionWeakTitle: "Weak PDF text",
    extractionWeakHint:
      "Accepts text-based tri-merge PDFs (SmartCredit primary; IdentityIQ / MyFreeScoreNow / myFICO / generic heuristics). OCR and Credit Karma are not supported.",
    extractionWeakNegatives:
      "Negatives could not be confirmed because report text was limited.",
    scoresHeading: "Bureau scores",
    transunion: "TransUnion",
    experian: "Experian",
    equifax: "Equifax",
    midScore: "Mid score",
    goalScore: "Goal",
    lendingStatus: "Lending status",
    timelineHeading: "Estimated timeline",
    timelineToday: "Today",
    timeline30: "30 days",
    timeline60: "60 days",
    timeline90: "90 days",
    timelineTarget: "Target",
    negativesHeading: "Negative items",
    noNegatives: "No obvious negatives detected in extractable text.",
    fileStrengthHeading: "File strength",
    actionPlanHeading: "Action plan",
    clientMessageHeading: "Client message",
    labelsHeading: "Suggested labels",
    emailSentNotice: "Analysis emailed to the client",
    errRequired: "Required",
    errFile: "Choose a PDF (max 4MB)",
    errClient: "Link an existing client (or create one)",
    emptyHistory: "No analyses yet for this client.",
    portalTitle: "My Free Analysis",
    portalDescription:
      "View your latest credit analysis or upload a text-based tri-merge PDF.",
    portalEmpty: "No analysis yet. Upload a SmartCredit-compatible PDF to get started.",
    portalUpload: "Upload report",
  },
  es: {
    pageTitle: "Análisis gratis",
    pageDescription:
      "PDFs de texto tri-merge (SmartCredit y compatibles). No Credit Karma ni imágenes/OCR.",
    clientRequired: "Cliente",
    clientPlaceholder: "Buscar o crear un cliente…",
    createClient: "Crear cliente nuevo",
    uploadLabel: "PDF del informe de crédito",
    uploadHint: "solo application/pdf · máx. 4MB · SmartCredit preferido",
    goalLabel: "Meta",
    languageLabel: "Idioma",
    emailOptIn: "Enviar el análisis por correo al cliente",
    modeLabel: "Modo",
    modeClient: "Cliente",
    modeAgent: "Con agente",
    run: "Ejecutar análisis",
    running: "Analizando…",
    historyHeading: "Historial",
    softPullTitle: "Instantánea de puntaje (soft-pull)",
    softPullBody:
      "Enlace de afiliado estilo MyFreeScoreNow para una instantánea gratuita. No es una API de buró — solo marca Encore Mortgage.",
    softPullCta: "Abrir enlace de puntaje gratis",
    resultBadge: "Análisis listo",
    resultHeading: "Análisis de crédito",
    resultSubheading: "Revisión algorítmica del informe subido.",
    extractionWeakBadge: "Extracción limitada",
    extractionWeakHeading: "No pudimos leer este PDF por completo",
    extractionWeakBody:
      "Los puntajes o negativos pueden estar incompletos. Vuelve a subir un PDF de texto SmartCredit (o compatible) — no Credit Karma ni foto/escaneo.",
    extractionWeakTitle: "Texto PDF débil",
    extractionWeakHint:
      "Acepta PDFs tri-merge basados en texto (SmartCredit principal; IdentityIQ / MyFreeScoreNow / myFICO / heurística genérica). OCR y Credit Karma no son compatibles.",
    extractionWeakNegatives:
      "No se pudieron confirmar negativos porque el texto del informe fue limitado.",
    scoresHeading: "Puntajes por agencia",
    transunion: "TransUnion",
    experian: "Experian",
    equifax: "Equifax",
    midScore: "Puntaje medio",
    goalScore: "Meta",
    lendingStatus: "Estado de crédito",
    timelineHeading: "Línea de tiempo estimada",
    timelineToday: "Hoy",
    timeline30: "30 días",
    timeline60: "60 días",
    timeline90: "90 días",
    timelineTarget: "Meta",
    negativesHeading: "Ítems negativos",
    noNegatives: "No se detectaron negativos obvios en el texto extraíble.",
    fileStrengthHeading: "Fortaleza del archivo",
    actionPlanHeading: "Plan de acción",
    clientMessageHeading: "Mensaje para el cliente",
    labelsHeading: "Etiquetas sugeridas",
    emailSentNotice: "Análisis enviado por correo al cliente",
    errRequired: "Obligatorio",
    errFile: "Elige un PDF (máx. 4MB)",
    errClient: "Vincula un cliente existente (o créalo)",
    emptyHistory: "Aún no hay análisis para este cliente.",
    portalTitle: "Mi análisis gratis",
    portalDescription:
      "Ve tu último análisis de crédito o sube un PDF tri-merge basado en texto.",
    portalEmpty:
      "Aún no hay análisis. Sube un PDF compatible con SmartCredit para comenzar.",
    portalUpload: "Subir informe",
  },
} as const;

export type FreeAnalysisCopy = (typeof copy)["en"];

export function freeAnalysisCopy(lang: FreeAnalysisLang): FreeAnalysisCopy {
  return copy[lang] || copy.en;
}
