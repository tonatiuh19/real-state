/**
 * EN / ES copy for Free Analysis UI (Encore Mortgage).
 * Honesty UX for weak extraction; SmartCredit / Xactus + compatible text PDFs.
 */

export type FreeAnalysisLang = "en" | "es";

const copy = {
  en: {
    pageTitle: "Free Analysis",
    pageDescription:
      "Text-based tri-merge PDFs (SmartCredit, Xactus, and compatible). Not Credit Karma or scanned/OCR images.",
    clientRequired: "Client",
    clientPlaceholder: "Search or create a client…",
    createClient: "Create new client",
    uploadLabel: "Credit report PDF",
    uploadHint: "application/pdf only · max 4MB · SmartCredit / Xactus preferred",
    goalLabel: "Goal",
    languageLabel: "Language",
    emailOptIn: "Email the analysis to the client",
    emailOptInSelf: "Email me the report",
    modeLabel: "Mode",
    modeClient: "Client",
    modeAgent: "Agent-assisted",
    run: "Run analysis",
    running: "Analyzing…",
    historyHeading: "History",
    resultBadge: "Analysis ready",
    resultHeading: "Credit analysis",
    resultSubheading: "Algorithm-based review of the uploaded report.",
    extractionWeakBadge: "Limited extraction",
    extractionWeakHeading: "We could not fully read this PDF",
    extractionWeakBody:
      "Scores or negatives may be incomplete. Re-upload a text-based SmartCredit, Xactus, or compatible PDF — not Credit Karma or a photo/scan.",
    extractionWeakTitle: "Weak PDF text",
    extractionWeakHint:
      "Accepts text-based tri-merge PDFs (SmartCredit / Xactus primary; IdentityIQ / MyFreeScoreNow / myFICO / generic heuristics). OCR and Credit Karma are not supported.",
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
    choosePdf: "Choose PDF",
    loading: "Loading…",
    view: "View",
    download: "Download",
    emailSkippedNoAddress:
      "Email was requested but this client has no email on file.",
    emailFailed: "Analysis saved, but the email could not be sent.",
    analysisReadyToast: "Analysis ready",
    analysisFailedToast: "Analysis failed",
    tryAgain: "Try again",
    helpTitle: "How Free Analysis works",
    helpDismiss: "Got it",
    helpStep1:
      "1. Link a CRM client (required). Create one if they are new.",
    helpStep2:
      "2. Upload a text-based tri-merge PDF — SmartCredit or Xactus (Statewide) work best. IdentityIQ, MyFreeScoreNow, and myFICO layouts are also supported. Photos, scans, Credit Karma, and OCR are not.",
    helpStep3:
      "3. Pick goal + language (EN/ES). Optional: email the finished analysis to the client.",
    helpStep4:
      "4. Run analysis — Encore’s algorithm scores bureaus, flags negatives into dispute Rounds 1–4, and builds an action plan. No AI rewrite in v1.",
    helpStep5:
      "5. Share your Free Analysis link below (same pattern as your apply share link). New people become a draft pipeline lead automatically.",
    helpShowAgain: "Show tips again",
    clientViewTitle: "What the client sees",
    clientViewBody:
      "They open your personal Free Analysis link (no CRM login required). They enter name + email, upload a SmartCredit/Xactus-compatible PDF, and see their analysis on the spot. If they are new to Encore, they are saved as a draft lead on your pipeline. Existing clients can later log into the portal to revisit Free Analysis anytime.",
    shareLinkTitle: "Shareable Free Analysis link",
    shareLinkBody:
      "Same pattern as your portal wizard share link (/apply/your-slug/free-analysis). Send it to prospects or clients — attributed to you.",
    shareLinkCopy: "Copy link",
    shareLinkCopied: "Link copied",
    shareLinkOpen: "Open",
    shareLinkLoading: "Loading your share link…",
    shareLinkError: "Could not load share link. Refresh and try again.",
    publicPageTitle: "Free Credit Analysis",
    publicPageDescription:
      "Upload a text-based tri-merge credit report PDF for a free Encore analysis.",
    publicWithBroker: "Shared by {name} · Encore Mortgage",
    publicClientHelper:
      "You’ll enter your contact info, upload a SmartCredit, Xactus, or compatible PDF, and see your analysis here. No Credit Karma or photo scans.",
    publicFirstName: "First name",
    publicLastName: "Last name",
    publicEmail: "Email",
    publicPhone: "Phone (optional)",
    publicNewLeadNotice:
      "You’re all set — we saved you as a new lead so your loan officer can follow up.",
    publicContinuePortal: "Open client portal",
    publicStartApplication: "Start full application",
    publicLinkInvalidTitle: "Link not found",
    publicLinkInvalidBody:
      "This Free Analysis link is no longer valid or has been deactivated.",
    publicGoHome: "Go to homepage",
    portalTitle: "My Free Analysis",
    portalDescription:
      "View your latest credit analysis or upload a text-based tri-merge PDF.",
    portalEmpty: "No analysis yet. Upload a SmartCredit or Xactus PDF to get started.",
    portalUpload: "Upload report",
    historyCount: "{n} analyses on file · showing latest",
  },
  es: {
    pageTitle: "Análisis gratis",
    pageDescription:
      "PDFs de texto tri-merge (SmartCredit, Xactus y compatibles). No Credit Karma ni imágenes/OCR.",
    clientRequired: "Cliente",
    clientPlaceholder: "Buscar o crear un cliente…",
    createClient: "Crear cliente nuevo",
    uploadLabel: "PDF del informe de crédito",
    uploadHint: "solo application/pdf · máx. 4MB · SmartCredit / Xactus preferido",
    goalLabel: "Meta",
    languageLabel: "Idioma",
    emailOptIn: "Enviar el análisis por correo al cliente",
    emailOptInSelf: "Enviarme el informe por correo",
    modeLabel: "Modo",
    modeClient: "Cliente",
    modeAgent: "Con agente",
    run: "Ejecutar análisis",
    running: "Analizando…",
    historyHeading: "Historial",
    resultBadge: "Análisis listo",
    resultHeading: "Análisis de crédito",
    resultSubheading: "Revisión algorítmica del informe subido.",
    extractionWeakBadge: "Extracción limitada",
    extractionWeakHeading: "No pudimos leer este PDF por completo",
    extractionWeakBody:
      "Los puntajes o negativos pueden estar incompletos. Vuelve a subir un PDF de texto SmartCredit, Xactus o compatible — no Credit Karma ni foto/escaneo.",
    extractionWeakTitle: "Texto PDF débil",
    extractionWeakHint:
      "Acepta PDFs tri-merge basados en texto (SmartCredit / Xactus principal; IdentityIQ / MyFreeScoreNow / myFICO / heurística genérica). OCR y Credit Karma no son compatibles.",
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
    choosePdf: "Elegir PDF",
    loading: "Cargando…",
    view: "Ver",
    download: "Descargar",
    emailSkippedNoAddress:
      "Se solicitó correo, pero este cliente no tiene email registrado.",
    emailFailed: "Análisis guardado, pero no se pudo enviar el correo.",
    analysisReadyToast: "Análisis listo",
    analysisFailedToast: "Falló el análisis",
    tryAgain: "Inténtalo de nuevo",
    helpTitle: "Cómo funciona el Análisis gratis",
    helpDismiss: "Entendido",
    helpStep1:
      "1. Vincula un cliente del CRM (obligatorio). Créalo si es nuevo.",
    helpStep2:
      "2. Sube un PDF tri-merge de texto — SmartCredit o Xactus (Statewide) funcionan mejor. También IdentityIQ, MyFreeScoreNow y myFICO. No fotos, escaneos, Credit Karma ni OCR.",
    helpStep3:
      "3. Elige meta + idioma (EN/ES). Opcional: enviar el análisis por correo al cliente.",
    helpStep4:
      "4. Ejecuta el análisis — el algoritmo de Encore lee burós, clasifica negativos en Rondas 1–4 y arma un plan. Sin reescritura con IA en v1.",
    helpStep5:
      "5. Comparte tu enlace de Análisis gratis abajo (mismo patrón que tu enlace de solicitud). Las personas nuevas se guardan como lead en borrador automáticamente.",
    helpShowAgain: "Mostrar tips otra vez",
    clientViewTitle: "Lo que ve el cliente",
    clientViewBody:
      "Abre tu enlace personal de Análisis gratis (sin login del CRM). Ingresa nombre + email, sube un PDF SmartCredit/Xactus (o compatible) y ve el análisis al momento. Si es nuevo en Encore, se guarda como lead en borrador en tu pipeline. Los clientes existentes pueden entrar al portal después para revisarlo.",
    shareLinkTitle: "Enlace compartible de Análisis gratis",
    shareLinkBody:
      "Mismo patrón que tu enlace del wizard (/apply/tu-slug/free-analysis). Envíalo a prospectos o clientes — queda atribuido a ti.",
    shareLinkCopy: "Copiar enlace",
    shareLinkCopied: "Enlace copiado",
    shareLinkOpen: "Abrir",
    shareLinkLoading: "Cargando tu enlace…",
    shareLinkError: "No se pudo cargar el enlace. Actualiza e inténtalo de nuevo.",
    publicPageTitle: "Análisis de crédito gratis",
    publicPageDescription:
      "Sube un PDF tri-merge de texto para un análisis gratis de Encore.",
    publicWithBroker: "Compartido por {name} · Encore Mortgage",
    publicClientHelper:
      "Ingresas tus datos, subes un PDF SmartCredit, Xactus o compatible y ves el análisis aquí. No Credit Karma ni fotos/escaneos.",
    publicFirstName: "Nombre",
    publicLastName: "Apellido",
    publicEmail: "Correo",
    publicPhone: "Teléfono (opcional)",
    publicNewLeadNotice:
      "Listo — te guardamos como lead nuevo para que tu oficial de préstamo te contacte.",
    publicContinuePortal: "Abrir portal del cliente",
    publicStartApplication: "Iniciar solicitud completa",
    publicLinkInvalidTitle: "Enlace no encontrado",
    publicLinkInvalidBody:
      "Este enlace de Análisis gratis ya no es válido o fue desactivado.",
    publicGoHome: "Ir al inicio",
    portalTitle: "Mi análisis gratis",
    portalDescription:
      "Ve tu último análisis de crédito o sube un PDF tri-merge basado en texto.",
    portalEmpty:
      "Aún no hay análisis. Sube un PDF SmartCredit o Xactus para comenzar.",
    portalUpload: "Subir informe",
    historyCount: "{n} análisis guardados · mostrando el más reciente",
  },
} as const;

export type FreeAnalysisCopy = (typeof copy)["en"];

export function freeAnalysisCopy(lang: FreeAnalysisLang): FreeAnalysisCopy {
  return (copy[lang] || copy.en) as FreeAnalysisCopy;
}
