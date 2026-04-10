import {
  aboutPageContent,
  blogPageContent,
  careersPageContent,
  contactPageContent,
  helpPageContent,
  homePageContent,
  loginPageContent,
  marketingFooterGroups,
  marketingNavigationLinks,
  marketingShellContent,
  pressPageContent,
  privacyPageContent,
  signupPageContent,
  termsPageContent,
} from "@/features/marketing/constants/marketing-content";
import { packsPageLabels } from "@/features/packs/constants/packs-page-content";
import { pipelinePageLabels } from "@/features/pipeline/constants/pipeline-page-content";
import { settingsPageLabels } from "@/features/settings/constants/settings-page-content";
import {
  supportedUiLocales,
  resolveUiLocale,
  type SupportedUiLocale,
} from "@/features/i18n/lib/locale";

const defaultUiMessagesEnUs = {
  appShell: {
    localeLabel: "Locale",
    mobileNavigationAriaLabel: "Mobile navigation",
    navItems: {
      blog: {
        label: "Blog",
        mobileLabel: "Blog",
      },
      ask: {
        label: "Ask",
        mobileLabel: "Ask",
      },
      dashboard: {
        label: "Dashboard",
        mobileLabel: "Home",
      },
      explorer: {
        label: "Explorer",
        mobileLabel: "Explorer",
      },
      packs: {
        label: "Decision Packs",
        mobileLabel: "Packs",
      },
      pipeline: {
        label: "Pipeline",
        mobileLabel: "Pipeline",
      },
      settings: {
        label: "Settings",
        mobileLabel: "Settings",
      },
    },
    primaryNavigationAriaLabel: "Primary navigation",
    sidebarToggleLabel: "Toggle sidebar",
    topBarAriaLabel: "Workspace controls",
    userRole: "Operator",
    workspaceAlertsTitle: "2 alerts need attention",
    workspaceName: "Broward HVAC Co.",
    workspaceSwitcherLabel: "Workspace",
  },
  askPage: {
    actions: {
      ask: "Ask with evidence",
      history: "Saved thread history",
    },
    askSurfaceEyebrow: "Ask Surface",
    assistantLeadLabel: "Based on",
    breadcrumbs: ["Dashboard", "Ask"],
    clarifyNextLabel: "Clarify next",
    copyAction: "Copy",
    forkDialog: {
      cancel: "Cancel",
      confirm: "Fork thread",
      confirming: "Forking...",
      description:
        "The new thread will keep every prior message through the selected point, then continue from there with a new question.",
      forkPointLabel: "Fork point",
      helper:
        "The forked thread will preserve the prior conversation and save the new branch to history.",
      placeholder: "Ask the next question in the forked thread...",
      priorMessagesLabel: "Prior messages carried into the new thread:",
      title: "Fork thread",
    },
    forkThread: "Fork thread",
    deleteDialog: {
      cancel: "Cancel",
      delete: "Delete thread",
      deleting: "Deleting...",
      description:
        "This thread will be permanently removed from the workspace. This cannot be undone.",
      threadFallback: "This thread",
      title: "Delete thread?",
    },
    description:
      "Query the workspace in plain language. Each answer is grounded in saved facts and returned with citations.",
    emptyStateDescription:
      "The current query planner already recognizes those business objects. When local evidence is missing, the page returns a clear no-evidence response instead of a dead mock.",
    emptyStateTitle:
      "Start with a question that maps to invoices, jobs, cash, or margin.",
    errorFallback: "The ask request could not be completed.",
    historyActionDescription:
      "Desktop thread history is already visible in the left rail. A dedicated history drawer for smaller screens is not implemented yet.",
    newThread: "New thread",
    noAnswer:
      "No matching evidence is available in this workspace yet. Upload more data or narrow the question.",
    noThreadsDescription:
      "Ask a question to create a reusable thread in this workspace.",
    noThreadsTitle: "No saved threads yet",
    placeholder:
      "Ask about overdue invoices, underpriced jobs, cash pressure, or margin drift.",
    saveToPack: "Save to pack",
    saveToPackDescription:
      "Ask insights can be saved to packs once that workflow is implemented.",
    starterPrompts: [
      "Which invoices are overdue as of today?",
      "Which jobs are underpriced?",
      "What deserves attention first this week?",
    ],
    submitLabel: "Ask",
    submitting: "Running...",
    threadDeleteLabel: "Delete thread",
    threadStatuses: {
      clarify: "Clarify",
      facts: "Facts",
      hybrid: "Hybrid",
      vectors: "Vectors",
    },
    threadsHeading: "Threads",
    title: "Ask",
  },
  common: {
    close: "Close",
    closeDialog: "Close dialog",
    localeLabel: "Locale",
    resetDashboardFilters: "Reset dashboard filters",
    skipToMainContent: "Skip to main content",
  },
  contentPage: {
    actions: {
      delete: "Delete",
      edit: "Edit",
      newPost: "New post",
      viewPublicBlog: "View public blog",
    },
    breadcrumbs: ["Dashboard", "Content"],
    deleteDialog: {
      cancel: "Cancel",
      delete: "Delete post",
      deleting: "Deleting...",
      description:
        "This post will be permanently deleted and removed from the public blog.",
      postFallback: "This post",
      title: "Delete post?",
    },
    description:
      "Manage published and draft blog posts. Changes are reflected on the public blog immediately.",
    editor: {
      cancel: "Cancel",
      create: "Create post",
      editDescription: "Edit the post details below.",
      editTitle: "Edit post",
      newDescription: "Fill in the fields below to create a new post.",
      newTitle: "New post",
      saveChanges: "Save changes",
      saving: "Saving...",
    },
    emptyState: {
      description: "Create your first post to get started.",
      title: "No blog posts yet",
    },
    fields: {
      author: "Author",
      body: "Body (Markdown)",
      slug: "Slug",
      status: "Status",
      summary: "Summary",
      title: "Title",
    },
    loading: "Loading posts...",
    placeholders: {
      author: "PulseOps Team",
      body: "Write the full post body here. Markdown is supported.",
      slug: "cash-flow-mistakes",
      summary: "One-paragraph summary shown in listing views.",
      title: "e.g. 5 Cash Flow Mistakes",
    },
    publicBlogDescription:
      "Opens /blog, the public-facing blog page powered by this content workflow.",
    statusLabels: {
      draft: "Draft",
      published: "Published",
    },
    tableHeaders: {
      actions: "Actions",
      author: "Author",
      date: "Date",
      status: "Status",
      title: "Title",
    },
    title: "Blog posts",
    toggleStatusTitle: "Click to toggle status",
  },
  dataLabels: {
    documentFamilies: {
      all: {
        description: "All supported document families.",
        label: "All document types",
      },
      "accounts-receivable-aging-report": {
        description:
          "Aging snapshots used to prioritize collection actions and identify slow-paying customers.",
        label: "Accounts receivable aging report",
      },
      "bank-transaction-export": {
        description:
          "Transaction-level cash movement used to reconcile inflows, outflows, and anomalies.",
        label: "Bank transaction export",
      },
      "chart-of-accounts-export": {
        description:
          "Ledger account reference data used for financial normalization and rollups.",
        label: "Chart of accounts export",
      },
      "customer-invoice": {
        description:
          "Issued invoices used for receivables, payment timing, and collection recommendations.",
        label: "Customer invoice",
      },
      "estimate-or-quote": {
        description:
          "Quoted pricing used to compare promised job value against realized cost and margin.",
        label: "Estimate or quote",
      },
      "generic-business-document": {
        description:
          "A fallback family for parseable business files that do not cleanly map to a narrower supported document family.",
        label: "Generic business document",
      },
      "job-cost-report": {
        description:
          "Job-level revenue and cost breakdown used for underpricing and margin analysis.",
        label: "Job cost report",
      },
      "payroll-or-timecard-export": {
        description:
          "Labor hour and labor cost data used for crew-level cost and utilization analysis.",
        label: "Payroll or timecard export",
      },
      "profit-and-loss-statement": {
        description:
          "Period financial summary used to validate margin and operating trend calculations.",
        label: "Profit and loss statement",
      },
      "schedule-or-work-order-export": {
        description:
          "Operational schedule data used for workload timing and service-delivery context.",
        label: "Schedule or work order export",
      },
      "vendor-bill": {
        description:
          "Payables documents used for cash timing and margin leakage analysis.",
        label: "Vendor bill",
      },
    },
    generic: {
      document: "Document",
      noParserArtifact: "No parser artifact captured yet.",
      notUsed: "Not used",
      sizeUnavailable: "Size unavailable",
      unavailable: "Unavailable",
      used: "Used",
    },
    sources: {
      all: "All sources",
      api: "Connected API",
      email: "Gmail / AP inbox",
      upload: "Manual uploads",
    },
    statuses: {
      all: "All statuses",
      extracted: "Extracted",
      failed: "Failed",
      "needs-review": "Needs review",
      uploaded: "Uploaded",
    },
  },
  appError: {
    badge: "Application error",
    description:
      "The failure has been logged with request and trace metadata when available.",
    goToDashboard: "Go to dashboard",
    title: "Something broke in this view.",
    tryAgain: "Try again",
  },
  dashboardPage: {
    actionLabels: {
      approve: "Approve",
      dismiss: "Dismiss",
      discard: "Discard",
      fix: "Fix",
      inspect: "Inspect",
      inspectFiles: "Inspect files",
      invoiceDate: "Invoice date",
      keepSeparate: "Keep separate",
      merge: "Merge",
      openAsk: "Open Ask",
      openBrief: "Open brief",
      openExplorer: "Open explorer",
      review: "Review",
      serviceDate: "Service date",
      skip: "Skip",
    },
    activityLiveLabel: "Live - auto-refreshes",
    activityTitle: "Pipeline activity",
    emptyQueueDescription:
      "Broaden the filters or wait for new document activity.",
    emptyQueueTitle: "No operator actions in the current scope.",
    filters: {
      dateRanges: {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        all: "All time",
      },
    },
    labels: {
      actions: {
        primary: "Upload files",
        secondary: "Open weekly brief",
      },
      breadcrumbs: ["App", "Dashboard"],
      description:
        "Track document flow, operator review, and the business signals that should shape this week's decisions.",
      queueTitle: "Operator queue",
      signalsTitle: "Business signals",
      title: "Dashboard",
      views: {
        business: "Business view",
        operations: "Operations view",
      },
    },
    openExplorer: "Open explorer",
    queueItemsLabel: "{{count}} items",
    viewFullActivityLog: "View full activity log ->",
  },
  explorerPage: {
    actions: {
      export: "Export CSV",
      exporting: "Exporting...",
      upload: "Upload file",
    },
    allRecords: "All records",
    backToList: "Back to list",
    breadcrumbs: ["Dashboard", "Explorer"],
    close: "Close",
    description:
      "Browse parsed artifacts, extracted facts, and review-state records in one workspace table.",
    documentMetadataHeading: "Document metadata",
    factsPreview: "Facts preview",
    extractedFactsHeading: "Extracted facts",
    parserMetadataHeading: "Parser metadata",
    noCitations: "No citations attached yet.",
    emptyStateClearSearch: "Clear search",
    emptyStateDescription:
      "Clear the search or change the filter to bring records back into view.",
    emptyStateEyebrow: "Nothing in this view",
    emptyStateOpenPipeline: "Open Pipeline",
    emptyStateShowAll: "Show all records",
    emptyStateTitle: "No records match the current search",
    jumpToCitations: "Citations",
    jumpToFacts: "Extracted facts",
    jumpToFindings: "Key findings",
    jumpToHeading: "Jump to",
    noFacts: "No extracted facts attached yet.",
    noRecordSelectedDescription:
      "Adjust the current filters or search query to bring a record into view.",
    noRecordSelectedTitle: "No record selected",
    reviewChecklistHeading: "Recommended review order",
    reviewHealthConfidence: "Confidence",
    reviewHealthConfidenceEmpty:
      "Confidence will show up after facts are extracted.",
    reviewHealthConfidenceHigh: "The visible facts are all high confidence.",
    reviewHealthConfidenceLow:
      "Treat these facts as low confidence until more evidence arrives.",
    reviewHealthConfidenceMixed: "{{count}} visible facts are high confidence.",
    reviewHealthEvidence: "Evidence",
    reviewHealthEvidenceComplete:
      "Every visible fact includes source evidence.",
    reviewHealthEvidenceEmpty: "No fact evidence is attached yet.",
    reviewHealthEvidencePartial:
      "{{count}} visible facts still need citations.",
    reviewHealthFocusFailed:
      "Resolve the pipeline issue before trusting the review details here.",
    reviewHealthFocusFallback: "Review the fact cards and citations together.",
    reviewHealthFocusPrimary: "Start with {{label}}.",
    reviewHealthFocusWaiting:
      "Wait for review-ready facts before doing a full check.",
    reviewHealthHeading: "Review health",
    reviewHealthParser: "Parser",
    reviewHealthParserMissing:
      "Parser details are not available yet, so use the document metadata and workflow status first.",
    reviewHealthParserReady:
      "Parser details are available below if you need to confirm headings, rows, or sections.",
    reviewStatsCitations: "Citations",
    reviewStatsCitationsDetail: "Source references attached for verification",
    reviewStatsFacts: "Facts ready",
    reviewStatsFactsDetail: "Fact cards with evidence and source fields",
    reviewStatsFindings: "Key findings",
    reviewStatsFindingsDetail: "High-signal takeaways to scan first",
    reviewStatsState: "Review state",
    reviewStatsStateDetail: "Current review readiness",
    searchPlaceholder: "Search records...",
    summary: {
      averageConfidence: "Avg confidence",
      averageConfidenceDetail: "above 0.85 brief threshold",
      needsReview: "Needs review",
      needsReviewDetail: "held - not yet downstream",
      totalRecords: "Total records",
      totalRecordsDetail: "across all sources and types",
    },
    tableHeaders: {
      confidence: "Confidence",
      date: "Date",
      document: "Document",
      facts: "Facts extracted",
      source: "Source",
      status: "Status",
      type: "Doc class",
    },
    title: "Data explorer",
  },
  globalError: {
    badge: "Global error",
    description:
      "The failure was reported through the structured logging path.",
    reload: "Reload page",
    retry: "Retry",
    title: "The app hit a fatal error.",
  },
  marketing: {
    about: aboutPageContent,
    blog: blogPageContent,
    careers: careersPageContent,
    contact: contactPageContent,
    help: helpPageContent,
    home: {
      ...homePageContent,
      hero: {
        ...homePageContent.hero,
        eyebrow: "Inteligencia de efectivo y margen",
        title:
          "Tu negocio de servicios funciona por intuicion. Empieza a operarlo con hechos.",
        description:
          "PulseOps entrega un brief semanal en lenguaje claro que te dice por donde se fuga el dinero, que facturas perseguir y que corregir antes del viernes.",
        actions: [
          { href: "/signup", label: "Empieza gratis", variant: "primary" },
          {
            href: "/#how-it-works",
            label: "Ver como funciona",
            variant: "secondary",
          },
        ],
        stats: [
          {
            value: "56%",
            detail: "de las pequenas empresas tienen facturas vencidas",
          },
          { value: "$17.5K", detail: "saldo promedio pendiente por empresa" },
          {
            value: "75%",
            detail: "citan el alza de costos como el principal reto",
          },
          {
            value: "#1",
            detail: "la claridad de margen es el punto ciego mas comun",
          },
        ],
        footerNote:
          "Fuentes: encuesta crediticia de la Fed para pequenas empresas e investigacion SMB de Intuit.",
      },
      pain: {
        ...homePageContent.pain,
        eyebrow: "El problema real",
        title:
          "Los numeros ya existen. Simplemente no se pueden usar con la suficiente rapidez para actuar.",
        description:
          "Las ventas viven en un sistema, los costos en otro, los horarios en una hoja de calculo y las facturas en una bandeja de entrada. Los problemas se acumulan en silencio hasta que ya duelen.",
        items: [
          {
            icon: "Cash",
            title: "Trabajos con precio bajo",
            description:
              "La mano de obra supera el estimado, los materiales suben y el precio nunca alcanza al costo real.",
          },
          {
            icon: "AR",
            title: "Facturas que nadie persigue",
            description:
              "El efectivo ya se gano, pero la cobranza se retrasa porque las cuentas correctas no aparecen a tiempo.",
          },
          {
            icon: "Margin",
            title: "Fugas por linea",
            description:
              "Un tipo de servicio o un proveedor puede borrar margen sin hacerse visible en un dashboard resumido.",
          },
          {
            icon: "Timing",
            title: "Latigazos de flujo de caja",
            description:
              "Los proveedores quieren cobrar antes de que los clientes paguen, y el faltante se vuelve obvio demasiado tarde.",
          },
        ],
      },
      workflow: {
        ...homePageContent.workflow,
        eyebrow: "Como funciona",
        title: "Conectado en un dia. Accionable el lunes.",
        description:
          "Hacemos el trabajo sucio de integracion y normalizacion para que el dueno reciba un brief corto y util en lugar de otro reporte que mantener.",
        steps: [
          {
            step: "1",
            title: "Conecta los sistemas que ya usas",
            description:
              "QuickBooks, ServiceTitan, hojas de calculo, adjuntos de email y cargas manuales entran por una sola superficie.",
          },
          {
            step: "2",
            title: "Construye una vista limpia del negocio",
            description:
              "PulseOps reconcilia trabajos, costos, pagos y documentos en una sola vista operativa.",
          },
          {
            step: "3",
            title: "Muestra la evidencia fuente",
            description:
              "Cada recomendacion incluye procedencia, confianza y los registros exactos que la respaldan.",
          },
          {
            step: "4",
            title: "Entrega el brief semanal",
            description:
              "El dueno recibe seis respuestas enfocadas en decisiones, en lenguaje claro y con las siguientes acciones ordenadas por impacto.",
          },
        ],
        connectors: [
          "QuickBooks",
          "Jobber",
          "ServiceTitan",
          "Housecall Pro",
          "Google Sheets",
          "Excel",
          "Exportaciones bancarias",
        ],
      },
      questions: {
        ...homePageContent.questions,
        eyebrow: "El brief semanal",
        title: "Seis preguntas. Respondidas cada lunes.",
        description:
          "Estas son las preguntas que los duenos ya hacen. PulseOps se asegura de que alguien las responda con evidencia.",
        items: [
          {
            icon: "?",
            title: "Que trabajos estan mal cotizados?",
            description:
              "Encuentra los servicios donde el costo real supera de forma consistente el precio cotizado.",
          },
          {
            icon: "?",
            title: "Por donde se fuga el margen?",
            description:
              "Los retrabajos, las horas extra y la variacion de materiales se ordenan por impacto en dolares.",
          },
          {
            icon: "?",
            title: "Que facturas debemos perseguir hoy?",
            description:
              "Obten una lista corta y urgente de quien debe efectivo y que hacer primero.",
          },
          {
            icon: "?",
            title: "Que clientes necesitan deposito?",
            description:
              "Marca cuentas lentas para pagar y trabajos grandes proximos que deberian requerir efectivo por adelantado.",
          },
          {
            icon: "?",
            title: "Que facturas son sensibles al timing?",
            description:
              "Saca a la luz compras y pagos a proveedores que deben alinearse con las entradas de efectivo.",
          },
          {
            icon: "?",
            title: "Que merece mas atencion?",
            description:
              "Recibe una lista ordenada de las acciones de mayor impacto para la semana.",
          },
        ],
      },
      preview: {
        ...homePageContent.preview,
        eyebrow: "Como se ve",
        title: "Consejos, no un reporte.",
        description:
          "Cada recomendacion te dice que cambio, que significa en dolares y que hacer despues.",
        checklist: [
          "Solo destaca lo que cambio o necesita accion.",
          "Muestra evidencia fuente y confianza para cada recomendacion.",
          "Ordena los problemas por impacto en dolares para empezar por lo que mas importa.",
          "Funciona por email o dentro de la app con la misma superficie clara de decision.",
          "Toma menos de cinco minutos leerlo y actuar.",
        ],
        recommendations: [
          {
            title: "Brecha de precio en instalaciones de calentadores de agua",
            summary:
              "La mano de obra promedio fue de 3.4 horas frente a un estimado de 2.5 horas en 17 trabajos recientes.",
            detail: "Recuperacion estimada: $2,400 al mes.",
          },
          {
            title: "Tres facturas vencidas necesitan escalamiento",
            summary:
              "Riverdale Commercial y otras dos cuentas ya representan la mayor concentracion de cuentas por cobrar abiertas.",
            detail: "Efectivo en riesgo: $8,750.",
          },
          {
            title:
              "El calendario de un proveedor genera un bache de caja el viernes",
            summary:
              "Una factura de proveedor vence antes de que entren los cobros esperados, generando un faltante salvo que la cobranza se adelante.",
            detail: "Brecha proyectada: $1,400.",
          },
        ],
      },
      difference: {
        ...homePageContent.difference,
        eyebrow: "Lo que nos diferencia",
        title:
          "Otras herramientas muestran datos. Nosotros te decimos que hacer con ellos.",
        description:
          "La mayoria de los productos lee un sistema limpio y te entrega una grafica. PulseOps reconcilia la realidad desordenada y la convierte en una decision.",
        items: [
          {
            icon: "Merge",
            title: "Una imagen clara",
            description:
              "Datos bancarios, sistemas de trabajo, hojas de calculo y archivos de bandeja de entrada se reconcilian en una sola vista operativa.",
          },
          {
            icon: "Proof",
            title: "Muestra tu trabajo",
            description:
              "Las recomendaciones incluyen los trabajos, las facturas y los calculos detras de ellas para que el usuario pueda juzgar el consejo.",
          },
          {
            icon: "Learn",
            title: "Aprende de tu negocio",
            description:
              "Las correcciones, aprobaciones y recomendaciones rechazadas ajustan el sistema a como el negocio opera en realidad.",
          },
        ],
      },
      industries: {
        ...homePageContent.industries,
        eyebrow: "Creado para",
        title:
          "Negocios locales de servicio basados en proyectos con 5 a 50 empleados.",
        description:
          "El primer paquete de decision esta optimizado para negocios de field service y oficios que viven las mismas preguntas de caja y margen cada semana.",
        items: [
          "HVAC",
          "Plomeria",
          "Electricidad",
          "Paisajismo",
          "Servicio de albercas",
          "Limpieza",
          "Control de plagas",
          "Puertas de garaje",
          "Construccion ligera",
          "Reparacion de electrodomesticos",
        ],
        note: "Los paquetes adicionales para otros verticales llegan despues, una vez que el brief de efectivo y margen funcione de punta a punta.",
      },
      testimonials: {
        ...homePageContent.testimonials,
        eyebrow: "Desde el campo",
        title: "Duenos que dejaron de volar a ciegas.",
        items: [
          {
            quote:
              "PulseOps nos mostro que las visitas de mantenimiento costaban mas de lo que cobraban cuando cuentas el tiempo de traslado y los retrabajos. Cambiamos precios y el margen se recupero en seis semanas.",
            name: "Marcus R.",
            company: "HVAC - 14 tecnicos",
            initials: "MR",
          },
          {
            quote:
              "El primer brief me dio una lista de tres facturas para perseguir esa misma manana. Cobramos la mayor parte del atraso esa misma semana.",
            name: "Diana V.",
            company: "Plomeria - 9 empleados",
            initials: "DV",
          },
          {
            quote:
              "Arreglamos el proceso de estimacion, no a la cuadrilla, porque el sistema mostro exactamente donde empezaba el problema de margen.",
            name: "Tariq B.",
            company: "Paisajismo - 11 empleados",
            initials: "TB",
          },
        ],
      },
      pricing: {
        ...homePageContent.pricing,
        eyebrow: "Precios",
        title: "Tarifa plana. Sin analistas. Sin sorpresas.",
        description:
          "Todo esta incluido. Sin tarifas por asiento, sin contrato oculto de implementacion y sin sorpresas de uso en el primer producto.",
        tiers: [
          {
            name: "Brief de efectivo y margen",
            price: "$149",
            priceSuffix: "/mes",
            description:
              "Para negocios de servicio operados por sus duenos que quieren dejar de adivinar sobre caja y margen.",
            points: [
              "1 negocio y hasta 4 fuentes de datos",
              "Brief semanal de efectivo y margen",
              "Analisis de rentabilidad por trabajo",
              "Seguimiento de facturas y cuentas por cobrar",
              "Referencias de la industria",
              "Soporte por email",
            ],
            ctaLabel: "Empieza la prueba gratis",
          },
          {
            name: "Paquete completo de operaciones",
            price: "$299",
            priceSuffix: "/mes",
            description:
              "Para operadores en crecimiento que necesitan visibilidad de caja, margen, personal y excepciones en una sola superficie.",
            points: [
              "Hasta 3 ubicaciones y fuentes ilimitadas",
              "Capturas diarias mas brief semanal",
              "Seguimiento de rentabilidad por cuadrilla y trabajo",
              "Recomendaciones de depositos de clientes",
              "Alertas basadas en excepciones",
              "Soporte prioritario",
            ],
            ctaLabel: "Empieza la prueba gratis",
            featured: true,
            featuredLabel: "Mas popular",
          },
          {
            name: "Multiubicacion",
            price: "Personalizado",
            priceSuffix: "",
            description:
              "Para grupos y franquicias que necesitan visibilidad consolidada y comparativos.",
            points: [
              "Ubicaciones ilimitadas",
              "Benchmarking entre ubicaciones",
              "Conectores personalizados",
              "Soporte dedicado de onboarding",
              "Opcion white-label",
              "Soporte con SLA",
            ],
            ctaLabel: "Contactar ventas",
          },
        ],
      },
      cta: {
        ...homePageContent.cta,
        title: "Empieza a conocer tus numeros esta semana.",
        description:
          "Conecta tu primera fuente de datos en menos de 10 minutos. Tu primer brief llega el lunes.",
        primaryAction: "Empieza gratis",
        secondaryAction: "Hablar con ventas",
      },
    },
    login: {
      ...loginPageContent,
      eyebrow: "Iniciar sesion",
      title: "Bienvenido de nuevo",
      highlight:
        "Abre el ultimo brief de efectivo y margen, inspecciona la evidencia y revisa acciones del operador desde un solo espacio de trabajo.",
      details: [
        "Revision del brief semanal con evidencia y metadatos de confianza.",
        "Acceso al explorador para registros parseados y hechos extraidos.",
        "Visibilidad del pipeline para salud de fuentes y registros fallidos.",
      ],
      form: {
        ...loginPageContent.form,
        title: "Bienvenido de nuevo",
        subtitle:
          "Inicia sesion para entrar al espacio de trabajo de PulseOps.",
        fields: [
          {
            label: "Email de trabajo",
            placeholder: "jamie@browardhvac.com",
            type: "email",
          },
          {
            label: "Contrasena",
            placeholder: "Ingresa tu contrasena",
            type: "password",
          },
        ],
        actions: [
          { label: "Entrar", href: "/dashboard", variant: "primary" },
          {
            label: "Olvidaste tu contrasena?",
            href: "/help",
            variant: "secondary",
          },
        ],
        footerPrompt: "Necesitas una cuenta?",
        footerLinkLabel: "Empieza una prueba gratis",
        footerLinkHref: "/signup",
      },
    },
    press: {
      ...pressPageContent,
      hero: {
        ...pressPageContent.hero,
        eyebrow: "Prensa",
        title: "Recursos para prensa y medios.",
        description:
          "Material de contexto, posicionamiento del producto y datos de contacto para cobertura.",
      },
      boilerplate:
        "PulseOps ayuda a los negocios locales de servicio a proteger caja y margen por medio de un brief semanal de decision sustentado en sus datos operativos reales.",
      facts: [
        { value: "Field service", detail: "Foco inicial del ICP" },
        { value: "1 producto", detail: "Brief semanal de efectivo y margen" },
        {
          value: "Confianza primero",
          detail: "Evidencia y confianza en cada recomendacion",
        },
        { value: "Next.js", detail: "Superficie local actual del producto" },
      ],
      coverage: [
        "La nueva clase de herramientas analiticas para field service por fin esta hecha para el dueno, no para el contador.",
        "PulseOps entrega lo que QuickBooks no puede: una respuesta semanal a si el negocio realmente es rentable.",
        "Un brief de $149 que le dice a operadores de oficios que trabajos pierden dinero? Lo probamos.",
      ],
    },
    privacy: {
      ...privacyPageContent,
      title: "Politica de privacidad",
      updatedLabel: "Actualizado el 9 de abr de 2026",
      intro:
        "Esta politica explica que informacion recopila PulseOps, como se usa y como se protege mientras el producto se construye alrededor de un modelo operativo centrado en la confianza.",
      sections: [
        {
          title: "1. Informacion que recopilamos",
          body: [
            "Recopilamos informacion de cuenta, documentos subidos, datos de sistemas conectados, mensajes de soporte y senales de uso necesarias para operar el servicio.",
            "Minimizamos la recopilacion a lo necesario para ingestion, normalizacion, salida de decisiones, seguridad y soporte operativo.",
          ],
        },
        {
          title: "2. Como usamos la informacion",
          body: [
            "La informacion se usa para procesar cargas, generar recomendaciones, mejorar la calidad del modelo, atender clientes, asegurar el producto y cumplir obligaciones legales.",
          ],
        },
        {
          title: "3. Conexiones de datos y acceso de terceros",
          body: [
            "Los sistemas conectados y procesadores de carga se usan solo para operar el producto. No damos a los modelos acceso irrestricto a tus bases de datos ni a entornos arbitrarios de ejecucion de codigo.",
          ],
        },
        {
          title: "4. Seguridad de datos",
          body: [
            "Disenamos para aislamiento por tenant, control de acceso, auditabilidad, estrategia de redaccion y retencion desde el inicio, no como una etapa de endurecimiento posterior.",
          ],
        },
        {
          title: "5. Retencion de datos",
          body: [
            "Las ventanas de retencion se atan al flujo del producto, a la necesidad del negocio y a las obligaciones contractuales. Los artefactos y logs no se conservan indefinidamente por defecto.",
          ],
        },
        {
          title: "6. Tus derechos",
          body: [
            "Puedes solicitar acceso, correccion, exportacion o eliminacion de tus datos sujeto a obligaciones legales y operativas.",
          ],
        },
        {
          title: "7. Cookies",
          body: [
            "Usamos un conjunto limitado de cookies y mecanismos de almacenamiento local para autenticacion, seguridad y funcionalidad del producto.",
          ],
        },
        {
          title: "8. Cambios",
          body: [
            "Si esta politica cambia de forma material, actualizaremos la fecha de vigencia y comunicaremos el cambio por el producto o por email cuando corresponda.",
          ],
        },
      ],
    },
    shell: {
      content: marketingShellContent,
      footerGroups: marketingFooterGroups,
      navigationLinks: marketingNavigationLinks,
    },
    shared: {
      aboutMissionEyebrow: "Mission",
      aboutTeamEyebrow: "Team",
      aboutTeamTitle: "People who have actually run the problem.",
      careersApplyInterest: "Apply interest",
      aboutValuesEyebrow: "What We Care About",
      aboutValuesTitle: "A few things we care about deeply.",
      blogFeaturedEyebrow: "Featured",
      blogRequestArticle: "Request this article",
      careersOpenRolesEyebrow: "Open Roles",
      careersOpenRolesTitle: "Current openings",
      careersWhyJoinEyebrow: "Why Join",
      careersWhyJoinTitle: "We are small by design. Everyone ships real work.",
      contactReachEyebrow: "Reach Us",
      contactReachTitle: "Other ways to reach the team",
      contactSendAction: "Send message",
      contactSendTitle: "Send us a message",
      footerCopyright: "(c) 2026 PulseOps. All rights reserved.",
      footerNavigationLabel: "Footer navigation",
      helpSearchPlaceholder: "Search the help center",
      pressBoilerplateEyebrow: "Company Boilerplate",
      pressBoilerplateTitle: "Company boilerplate",
      pressBrandEyebrow: "Brand",
      pressBrandTitle: "Logos and color palette",
      pressCoverageEyebrow: "Coverage",
      pressCoverageTitle: "Recent press coverage",
      pressMediaDescription:
        "For interviews, logos, product screenshots, or background material, contact the media team.",
      pressMediaPrimary: "press@pulseops.io",
      pressMediaSecondary: "Contact Us",
      pressMediaTitle: "Media inquiries",
      sampleBriefSubtitle: "Week of Apr 14, 2026 - Precision Plumbing Co.",
      sampleBriefTitle: "Weekly Cash and Margin Brief",
      worksWithLabel: "Works with",
    },
    signup: {
      ...signupPageContent,
      eyebrow: "Empieza gratis",
      title: "Empieza tu prueba gratis",
      highlight:
        "Conecta un negocio, sube registros reales y recibe el primer brief de efectivo y margen antes de ampliar el alcance.",
      details: [
        "Precio plano sin impuesto por asiento.",
        "Soporte de carga manual para CSV y XLSX desde el primer dia.",
        "Recomendaciones centradas en la confianza con citas y confianza.",
      ],
      form: {
        ...signupPageContent.form,
        title: "Crea tu cuenta",
        subtitle:
          "Comparte lo necesario para levantar el primer espacio de trabajo y brief.",
        fields: [
          { label: "Nombre completo", placeholder: "Jamie Reynolds" },
          {
            label: "Email de trabajo",
            placeholder: "jamie@browardhvac.com",
            type: "email",
          },
          { label: "Empresa", placeholder: "Broward HVAC Co." },
          {
            label: "Contrasena",
            placeholder: "Elige una contrasena",
            type: "password",
          },
        ],
        actions: [
          { label: "Crear cuenta", href: "/dashboard", variant: "primary" },
          {
            label: "Hablar con ventas",
            href: "/contact",
            variant: "secondary",
          },
        ],
        footerPrompt: "Ya tienes una cuenta?",
        footerLinkLabel: "Inicia sesion",
        footerLinkHref: "/login",
      },
    },
    terms: {
      ...termsPageContent,
      title: "Terminos del servicio",
      updatedLabel: "Actualizado el 9 de abr de 2026",
      intro:
        "Estos terminos regulan el acceso a PulseOps y describen el uso de la suscripcion, el comportamiento aceptable y los limites del alcance actual del producto.",
      sections: [
        {
          title: "1. El servicio",
          body: [
            "PulseOps ofrece actualmente un producto acotado centrado en un brief semanal de efectivo y margen y en los flujos de ingestion, revision y recomendacion necesarios para producirlo.",
          ],
        },
        {
          title: "2. Registro de cuenta",
          body: [
            "Eres responsable de mantener seguras las credenciales de tu cuenta y de la actividad que ocurra bajo ella.",
          ],
        },
        {
          title: "3. Suscripciones y facturacion",
          body: [
            "Las suscripciones se renuevan segun el periodo de facturacion seleccionado salvo cancelacion antes de la renovacion.",
          ],
        },
        {
          title: "4. Tus datos",
          body: [
            "Conservas la propiedad de tus datos. Nos otorgas los derechos necesarios para almacenarlos, procesarlos y transformarlos con el fin de operar el servicio.",
          ],
        },
        {
          title: "5. Uso aceptable",
          body: [
            "No puedes usar el servicio para violar la ley, abusar del sistema, interferir con otros o intentar obtener acceso no autorizado a datos o infraestructura.",
          ],
        },
        {
          title: "6. Limitaciones del servicio",
          body: [
            "El servicio esta evolucionando. Algunas funciones mostradas en el diseno o la documentacion pueden estar planificadas y no totalmente implementadas, y buscamos etiquetar esos casos con claridad.",
          ],
        },
        {
          title: "7. Descargo y responsabilidad",
          body: [
            "Salvo donde la ley exija lo contrario, el servicio se ofrece segun disponibilidad y la responsabilidad se limita al maximo permitido.",
          ],
        },
        {
          title: "8. Cambios en los terminos",
          body: [
            "Podemos actualizar estos terminos con el tiempo. El uso continuado despues de una actualizacion constituye aceptacion de los terminos revisados.",
          ],
        },
      ],
    },
  },
  packsPage: {
    actions: {
      export: "Export preview",
      exportPreview: "Export preview",
      exporting: "Exporting...",
      exportingPreview: "Exporting preview...",
      generate: "Generate latest preview",
      generatePreview: "Generate latest preview",
      generating: "Generating...",
      generatingPreview: "Generating latest preview...",
      markReviewed: "Mark ready to share",
      markReady: "Mark ready to share",
      stillDrafting: "Still drafting",
      markingReviewed: "Marking ready...",
      markingReady: "Marking ready to share...",
    },
    bestNextMoveHeading: "Best next move",
    businessSignalsDescription:
      "These are the main operating signals that shape the selected preview.",
    businessSignalsHeading: "Business signals",
    conceptsDescription:
      "Each concept is a business theme this preview is combining into one analysis surface.",
    conceptsHeading: "What this pack groups together",
    dataHeaders: {
      class: "Class",
      confidence: "Confidence",
      contribution: "Contribution",
      sourceFile: "Source file",
    },
    detailEyebrow: "Analysis preview",
    emptyDraftRecommendations:
      "This pack is still in draft and has no recommendations yet.",
    emptyPackAction: "Show all previews",
    emptyPackDescription:
      "Clear the search or switch back to all previews to bring a grouped analysis back into view.",
    emptyPackList: "No packs match the current filter.",
    errors: {
      exportFailed: "Pack export failed.",
      exportTitle: "Could not export pack",
      feedbackFailed: "Recommendation feedback failed.",
      feedbackTitle: "Could not save feedback",
      generateTitle: "Could not generate pack",
      generationFailed: "Pack generation failed.",
      requestFailed: "The request could not be completed.",
      reviewFailed: "Pack review failed.",
      reviewTitle: "Could not update pack",
    },
    feedbackAccepted: "Accepted for this recommendation.",
    feedbackDismissed: "Dismissed for this recommendation.",
    feedbackSaving: "Saving feedback...",
    filterLabels: {
      all: "All",
      draft: "Draft",
      ready: "Ready",
    },
    evidenceHeading: "Evidence behind this preview",
    headerDescription:
      "Preview grouped business analysis before it becomes an operator decision.",
    labels: packsPageLabels,
    previewHealthDescription:
      "These signals show how complete and ready the selected analysis preview is.",
    previewHealthHeading: "Preview health",
    recommendationsHeading: "Recommendations",
    recommendationsDescription:
      "Start with the highest-priority action, then use the rest of the preview as supporting context.",
    recommendationActions: {
      accept: "Accept",
      dismiss: "Dismiss",
    },
    searchPlaceholder: "Search packs",
    previewEyebrow: "Analysis preview",
    selectorDescription:
      "Each preview groups one business concept into a short operator decision surface.",
    selectorEyebrow: "Choose a preview",
    selectorTitle: "Pick the business concept to review",
    sourceDataDescription:
      "These source files are the evidence currently feeding the selected preview.",
    sourceDataEmpty: "No source records are attached yet.",
    sourceDataHeading: "Evidence behind this preview",
    success: {
      exportDescription:
        "Your export should download shortly with the current preview contents.",
      exportTitle: "Preview export started",
      exportingDescription:
        "Preparing a shareable export of the current grouped analysis.",
      exportingTitle: "Preparing export",
      generateDescription:
        "The newest grouped analysis is ready and selected for review.",
      generateTitle: "Preview refreshed",
      generatingDescription:
        "Building the latest grouped analysis from the current workspace data.",
      generatingTitle: "Refreshing analysis preview",
      reviewDescription:
        "This preview is now marked ready to share with the team.",
      reviewTitle: "Preview marked ready",
      reviewingDescription:
        "Saving the current preview as ready to share.",
      reviewingTitle: "Updating preview status",
    },
  },
  pipelinePage: {
    dismissAction: "Dismiss alert",
    labels: pipelinePageLabels,
    sourceActions: {
      configure: "Configure",
      investigate: "Investigate",
      upload: "Upload",
      viewFailedRecords: "View failed records",
    },
    stageHeaders: {
      brief: "Brief",
      depth: "Pipeline depth",
      documentType: "Doc type",
      llm: "LLM",
      source: "Source",
      sql: "SQL",
      vector: "Vector",
    },
    tableHeaders: [
      "Time",
      "Source",
      "Document type",
      "Records",
      "Outcome",
      "Confidence",
      "Duration",
    ],
    testPipelineDescription:
      "Pipeline diagnostics are planned, but the test-run orchestration is not implemented yet.",
  },
  settingsPage: {
    actions: {
      cancel: "Cancel",
      connect: "Connect",
      connecting: "Connecting...",
      configure: "Configure",
      continue: "Continue",
      disconnect: "Disconnect",
      inviteMember: "Invite member",
      manage: "Manage",
      remove: "Remove",
      reconnect: "Reconnect",
      reset: "Reset",
      reviewFailures: "Review failures",
      revoke: "Revoke",
      revokeKey: "Revoke key",
      revoking: "Revoking...",
      saveCap: "Save cap",
      saveCard: "Save card",
      saveChanges: "Save changes",
      savePreferences: "Save preferences",
      saveProfile: "Save profile",
      saveWebsiteDetails: "Save website details",
      saving: "Saving...",
      sendingInvite: "Sending...",
      syncNow: "Sync now",
    },
    actionDescriptions: {
      activeSessions: "Review active sessions and revoke stale device access.",
      authentication:
        "Authentication and access-control settings for the workspace.",
      apiKeys: "Programmatic access keys for server-side integrations only.",
      billingModel: "Totals update automatically from tracked AI usage.",
      businessProfile:
        "This information shapes how PulseOps interprets your data and builds your Cash & Margin Brief.",
      appearance:
        "Mirror the settings design controls and persist the workspace color mode in local storage.",
      colorModePersisted: "Persisted across sessions.",
      connectedSources:
        "Connect your business systems to feed the ingestion pipeline.",
      currentCap: "Applies to the current workspace billing cycle.",
      currentCycle: "Current cycle across the workspace.",
      fallbackSessionNotice:
        "This local workspace is currently using the fallback development session.",
      manageAccounts:
        "You can manage team accounts and access policy.",
      manageOwnProfile:
        "You can only adjust your own account profile and password.",
      notificationPreferences:
        "Choose how and when PulseOps contacts you. Operator role or above required.",
      paymentMethods:
        "Add a business card for the service and an optional backup card. Only masked card details are stored.",
      preferences: "Workspace-level display and workflow defaults.",
      rolePermissions:
        "Defines what each role can see and do in your workspace.",
      usageCap: "Optional monthly cap on AI usage. Leave blank for no cap.",
      websiteDetails:
        "Structured public contact details for the marketing home and contact pages. Update these fields without touching page copy or a WYSIWYG editor.",
    },
    actionTitles: {
      activeSessions: "Active sessions",
      apiKeys: "API keys",
      appearance: "Appearance",
      authentication: "Authentication",
      billingModel: "Billing model",
      businessProfile: "Business profile",
      colorMode: "Color mode",
      connectedSources: "Connected sources",
      currentUsage: "Usage this billing period",
      notificationPreferences: "Notification preferences",
      paymentMethods: "Payment methods",
      preferences: "Preferences",
      rolePermissions: "Role permissions",
      teamMembers: "Team members",
      usageCap: "Usage cap",
      websiteDetails: "Website details",
    },
    appearance: {
      colorMode: "Color mode",
      dark: "Dark",
      light: "Light",
    },
    billing: {
      activePlanBadge: "Active plan",
      backupCard: "Backup card",
      billingModelValue: "Platform access + usage",
      billingZip: "Billing ZIP",
      billingZipValue: "Billing ZIP {{postalCode}}",
      businessCard: "Business card",
      capReached: "Cap reached.",
      cardHelp:
        "Card number and security code are used only to update the card and are not stored in this local prototype.",
      cardNumber: "Card number",
      cardholderName: "Cardholder name",
      currentCapLabel: "Current cap",
      expMonth: "Exp. month",
      expYear: "Exp. year",
      monthlyCapLabel: "Monthly cap",
      noCap: "No cap",
      noCapSet: "No cap set.",
      noCardOnFile: "No card on file.",
      noUsageAllowed: "No usage allowed at the current cap.",
      ofMonthlyCapUsed: "{{percent}} of monthly cap used",
      paymentMethodDescription:
        "{{brand}} ending in {{last4}} • Expires {{expiration}}",
      previewingUnsavedCap: "Previewing unsaved cap",
      securityCode: "Security code",
      setMonthlyCapCaption:
        "Set a monthly cap to pause new AI runs automatically.",
      usageCapFieldLabel: "Monthly cap (USD)",
      usageCapHint:
        "New AI runs pause once the current billing cycle reaches this amount.",
      usageDetails: {
        monthlyRecurring: "Monthly recurring",
        renews: "Renews {{date}}",
        trackedRuns: "{{count}} tracked runs",
        trackedRunsSettling:
          "{{count}} tracked runs, {{settlingCount}} settling",
      },
      usageLabels: {
        currentTotal: "Current total",
        platformAccess: "Platform access",
        usageThisPeriod: "Usage this period",
      },
      usedOfCap: "{{used}} used of {{cap}} cap",
    },
    dialogs: {
      connect: {
        apiKeyLabel: "API key",
        connect: "Connect",
        connecting: "Connecting...",
        description:
          "The key is sent over HTTPS and stored in your workspace settings. You can disconnect at any time.",
        title: "Connect {{integration}}",
      },
      invite: {
        email: "Email",
        name: "Name",
        role: "Role",
      },
      revokeKeyWarning:
        "Any service using this key will lose access immediately and will need a replacement key before the integration can recover.",
      twoFactorDescription:
        "Scan the QR code in your authenticator app, confirm the six-digit code, and store the backup codes securely.",
      twoFactorQrPlaceholder: "Authenticator QR placeholder",
    },
    labels: settingsPageLabels,
    accountDialog: {
      accessPolicy: "Access policy",
      currentAccountNotice: "This is the currently signed-in account.",
      currentDescription:
        "Update your account email and password. Role and access controls remain admin-governed.",
      email: "Email",
      lockedNotice:
        "Only another active admin can change role, status, or the setup, data-ops, and report access buckets for this account.",
      manageDescription:
        "Update account identity, password, and access settings for this team member.",
      name: "Name",
      newPassword: "New password",
      passwordHint: "Leave blank to keep the current password.",
      resetPassword: "Reset password",
      statusActive: "Active",
      statusInvited: "Invited",
      status: "Status",
    },
    errors: {
      accountUpdateFailed: "Could not update account",
      apiKeyRevokeFailed: "Could not revoke API key",
      backupCardRemoveFailed: "Could not remove backup card",
      integrationConnectFailed: "Could not connect integration",
      integrationDisconnectFailed: "Could not disconnect",
      inviteFailed: "Could not send invite",
      notificationsSaveFailed: "Could not save notifications",
      paymentMethodBackupFailed: "Could not save backup card",
      paymentMethodPrimaryFailed: "Could not save business card",
      preferencesSaveFailed: "Could not save preferences",
      profileSaveFailed: "Could not save profile",
      requestFailed: "The request could not be completed.",
      sessionRevokeFailed: "Could not revoke session",
      usageCapSaveFailed: "Could not save usage cap",
      validCardNumber: "Enter the card number.",
      validCardholderName: "Enter the cardholder name.",
      validDollarAmount: "Enter a valid dollar amount.",
      validDollarAmountNonNegative:
        "Enter a valid non-negative dollar amount.",
      validDollarAmountPrecision:
        "Enter a valid dollar amount with up to two decimal places.",
      validExpirationMonth: "Enter a valid expiration month.",
      validExpirationYear: "Enter a valid expiration year.",
      validSecurityCode: "Enter the security code.",
      websiteDetailsSaveFailed: "Could not save website details",
    },
    integrations: {
      descriptions: {
        gmailApInbox:
          "Invoice PDF attachments through the AP inbox forwarder.",
        quickBooksOnline:
          "P&L, expenses, and chart-of-accounts sync via OAuth.",
        serviceTitan: "Job reports, invoices, and technician logs via API.",
        xero: "Accounting connector not enabled yet.",
      },
      status: {
        available: "Available",
        connected: "Connected",
        failures: "{{count}} failures",
        notConnected: "Not connected",
      },
    },
    options: {
      goals: [
        "Improve cash flow visibility",
        "Increase job margin",
        "Reduce overhead costs",
        "Cut time spent on reporting",
        "Reduce cost per job",
      ],
      industry: [
        "HVAC / Field service",
        "Plumbing",
        "Electrical",
        "Landscaping",
        "Roofing",
        "Other...",
      ],
      invoiceCycle: ["Weekly", "Bi-weekly", "Monthly", "Per job"],
      inviteRoles: ["Admin", "Operator", "Analyst", "Viewer"],
      revenueModel: ["Job-based", "Subscription", "Mixed"],
      teamSize: [
        "1-4 people",
        "5-10 people",
        "11-25 people",
        "26-50 people",
        "51+ people",
      ],
    },
    placeholders: {
      apiKey: "Paste your API key here",
      cardholderName: "Broward HVAC Co.",
      email: "jamie@browardhvac.com",
      name: "Jamie Reynolds",
    },
    permissions: {
      connectSources: "Connect approved sources and uploads",
      expandScope: "Expand source scope or AI processing",
      manageUsers: "Manage users and report visibility",
      reviewParseIssues: "Review parse issues and ingestion queues",
      runAnalyses: "Run approved analyses and data exploration",
      viewDashboards: "View dashboards and weekly briefs",
    },
    preferenceItems: {
      compactDashboardDensity: {
        description:
          "Fit more queue and signal cards on a single desktop screen.",
        title: "Compact dashboard density",
      },
      evidenceFirstRecommendationView: {
        description:
          "Open recommendation cards with citations expanded by default.",
        title: "Evidence-first recommendation view",
      },
      experimentalPackDrafts: {
        description:
          "Show draft decision-pack types before they are fully productionized.",
        title: "Experimental pack drafts",
      },
      retainUploadedSourceFiles: {
        description:
          "Keep raw uploads in storage so operators can download the original document later.",
        title: "Retain uploaded source files",
      },
    },
    roles: {
      admin: "Admin",
      analyst: "Analyst",
      operator: "Operator",
      viewer: "Viewer",
    },
    securityRows: {
      changePassword: {
        actionLabel: "Change password",
        title: "Email and password",
      },
      singleSignOn: {
        actionLabel: "Configure SSO",
        description: "Available on higher plans for larger teams.",
        title: "Single sign-on",
      },
      twoFactor: {
        actionLabel: "Enable 2FA",
        description: "Protect the account with a second verification step.",
        setupUnavailable: "Two-factor setup handoff is not implemented yet.",
        title: "Two-factor authentication",
      },
    },
    tabs: {
      billing: "Billing",
      myAccount: "My account",
      peopleAccess: "People & access",
      sourcesOperations: "Sources & operations",
      workspace: "Workspace",
    },
    team: {
      accessBucketsLabel: "Access buckets",
      accessSummaries: {
        pending: "Access pending",
        reports: "Reports",
        setupOps: "Setup, Ops",
        setupOpsReports: "Setup, Ops, Reports",
      },
      manage: "Manage",
      manageAccount: "Manage account",
      membersCount: "{{count}} members",
      myAccount: "My account",
      permissionHeaders: {
        admin: "Admin",
        analyst: "Analyst",
        operator: "Operator",
        permission: "Permission",
        viewer: "Viewer",
      },
      signedInSummary: "Signed in as {{name}} ({{role}}).",
    },
    accessPolicy: {
      operationsDescription:
        "Can review ingestion queues, parse issues, and file operations.",
      operationsTitle: "Operations access",
      reportDescription:
        "Can view dashboards, briefs, and approved insight outputs.",
      reportTitle: "Report access",
      setupDescription:
        "Can connect approved sources and ingestion scope.",
      setupTitle: "Setup access",
    },
    websiteDetails: {
      fields: {
        mainPhone: "Main phone",
        partnershipsEmail: "Partnerships email",
        pressEmail: "Press email",
        salesEmail: "Sales email",
        supportEmail: "Support email",
        supportPhone: "Support phone",
      },
    },
    formLabels: {
      businessName: "Business name",
      goals: "Goals (all that apply)",
      industry: "Industry",
      invoiceCycle: "Invoice cycle",
      primaryLocation: "Primary location",
      revenueModel: "Revenue model",
      teamSize: "Team size",
    },
  },
  uploadModal: {
    acceptsDescription:
      "Accepts CSV and XLSX files. CSV can be up to 5 MB and XLSX can be up to 20 MB.",
    bestResultsHeading: "Best results on this path",
    bestResultsTipOne: "Upload one export per file.",
    bestResultsTipThree: "Use separate columns for dates, amounts, and IDs.",
    bestResultsTipTwo: "Keep the header row at the top of the sheet.",
    cancel: "Cancel",
    csvRule: "CSV up to 5 MB",
    documentIdLabel: "Document ID",
    done: "Done",
    duplicateDescription:
      "This file was already in the workspace, so the existing record was reused.",
    duplicateDialogDescription:
      "Upload complete. We matched this file to the copy already in your workspace.",
    duplicateNotice: "Already uploaded - using the existing record.",
    duplicateTag: "Existing record reused",
    errorHelp: "Choose a different file or try again.",
    errorTitle: "We couldn't finish that upload",
    familyConfidenceLabel: "Recognition confidence",
    familyPendingBadge: "Type still settling",
    familyPendingDescription:
      "The file is saved, but the document type is not locked in yet. Pipeline will keep moving it forward.",
    familyRecognizedDescription: "We recognized this file as {{family}}.",
    familyUnrecognizedDescription:
      "The file imported cleanly, but it did not match a named document type yet.",
    factsFoundLabel: "{{count}} facts found",
    fileQueuedDescription: "Upload complete. We're checking the file now.",
    fileTooLargeDescription:
      "{{format}} files can be up to {{maxSize}} on this upload path.",
    fileTypeFallback: "unknown type",
    importReadoutHeading: "Import readout",
    manualQueueTag: "Manual review queue",
    needsDifferentFileTag: "Needs a different file",
    nextStepLabel: "Next step",
    pathOverviewDescription:
      "Files on this path are saved, checked, and then prepared for review in Explorer or Pipeline.",
    pathOverviewTitle: "What this upload path does",
    processingNextSteps:
      "Check Pipeline for progress and Explorer when the file is ready to review.",
    processingDialogDescription:
      "Upload complete. Your file is in the workspace and still being prepared.",
    readyDialogDescription: "Upload complete. Your file is ready to review.",
    readyToSendTag: "Ready to upload",
    recognizedTypesDescription:
      "This importer can recognize clean business exports and route them into the right review experience.",
    recognizedTypesHeading: "Recognized document types",
    sourceNotRetainedTag: "Metadata only",
    sourceRetainedTag: "Stored for download",
    stepPreparedDuplicate:
      "We found the existing copy and linked this upload back to it.",
    stepPreparedProcessing:
      "The file is in the workspace and will keep moving through Pipeline.",
    stepPreparedReady: "The file is ready to review in Explorer.",
    stepPreparedReceived:
      "The file is in the workspace and ready for the next step.",
    tabularRouteTag: "Tabular review path",
    textRouteTag: "Text review path",
    title: "Upload files",
    upload: "Upload",
    uploadFailed: "Upload failed.",
    uploadingHint:
      "This can take a little longer for larger files. Keep this window open while we finish checking it.",
    uploadPrompt: "Drop a file here or click to browse",
    uploading: "Uploading...",
    uploadTypes: "CSV - XLSX - up to 20 MB",
    uploadedBadge: "OK",
    unsupportedFileDescription:
      "Choose a CSV or XLSX file for this upload path.",
    validationHint:
      "Pick a file that matches the rules above, then upload when you're ready.",
    validationRecoveryHelp: "Choose a different file and then try again.",
    validationTitle: "This file needs attention",
    xlsxRule: "XLSX up to 20 MB",
  },
} as const;

const normalizedDefaultUiMessagesEnUs = {
  ...defaultUiMessagesEnUs,
  marketing: {
    about: aboutPageContent,
    blog: blogPageContent,
    careers: careersPageContent,
    contact: contactPageContent,
    help: helpPageContent,
    home: homePageContent,
    login: loginPageContent,
    press: pressPageContent,
    privacy: privacyPageContent,
    shell: {
      content: marketingShellContent,
      footerGroups: marketingFooterGroups,
      navigationLinks: marketingNavigationLinks,
    },
    shared: defaultUiMessagesEnUs.marketing.shared,
    signup: signupPageContent,
    terms: termsPageContent,
  },
} as const;

type WidenUiMessages<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly WidenUiMessages<Item>[]
        : T extends Record<string, unknown>
          ? { readonly [Key in keyof T]: WidenUiMessages<T[Key]> }
          : T;

export type UiMessages = WidenUiMessages<
  typeof normalizedDefaultUiMessagesEnUs
>;

const defaultUiMessagesEs: UiMessages = {
  ...normalizedDefaultUiMessagesEnUs,
  appShell: {
    ...normalizedDefaultUiMessagesEnUs.appShell,
    localeLabel: "Idioma",
    mobileNavigationAriaLabel: "Navegacion movil",
    navItems: {
      ask: {
        label: "Preguntar",
        mobileLabel: "Preguntar",
      },
      blog: {
        label: "Blog",
        mobileLabel: "Blog",
      },
      dashboard: {
        label: "Panel",
        mobileLabel: "Inicio",
      },
      explorer: {
        label: "Explorador",
        mobileLabel: "Explorador",
      },
      packs: {
        label: "Paquetes de decision",
        mobileLabel: "Paquetes",
      },
      pipeline: {
        label: "Pipeline",
        mobileLabel: "Pipeline",
      },
      settings: {
        label: "Configuracion",
        mobileLabel: "Config.",
      },
    },
    primaryNavigationAriaLabel: "Navegacion principal",
    sidebarToggleLabel: "Alternar barra lateral",
    topBarAriaLabel: "Controles del espacio de trabajo",
    userRole: "Operador",
    workspaceAlertsTitle: "2 alertas requieren atencion",
    workspaceSwitcherLabel: "Espacio de trabajo",
  },
  askPage: {
    ...normalizedDefaultUiMessagesEnUs.askPage,
    actions: {
      ask: "Preguntar con evidencia",
      history: "Historial guardado de hilos",
    },
    askSurfaceEyebrow: "Superficie de preguntas",
    assistantLeadLabel: "Basado en",
    breadcrumbs: ["Panel", "Preguntar"],
    clarifyNextLabel: "Aclarar lo siguiente",
    copyAction: "Copiar",
    forkDialog: {
      cancel: "Cancelar",
      confirm: "Bifurcar hilo",
      confirming: "Bifurcando...",
      description:
        "El nuevo hilo conservara todos los mensajes anteriores hasta el punto seleccionado y continuara desde alli con una nueva pregunta.",
      forkPointLabel: "Punto de bifurcacion",
      helper:
        "El hilo bifurcado conservara la conversacion anterior y guardara la nueva rama en el historial.",
      placeholder: "Haz la siguiente pregunta en el hilo bifurcado...",
      priorMessagesLabel: "Mensajes anteriores incluidos en el nuevo hilo:",
      title: "Bifurcar hilo",
    },
    forkThread: "Bifurcar hilo",
    deleteDialog: {
      cancel: "Cancelar",
      delete: "Eliminar hilo",
      deleting: "Eliminando...",
      description:
        "Este hilo se eliminara permanentemente del espacio de trabajo. Esta accion no se puede deshacer.",
      threadFallback: "Este hilo",
      title: "Eliminar hilo?",
    },
    description:
      "Consulta el espacio de trabajo en lenguaje natural. Cada respuesta se apoya en hechos guardados y se devuelve con citas.",
    emptyStateDescription:
      "El planificador actual ya reconoce esos objetos de negocio. Cuando falta evidencia local, la pagina devuelve una respuesta clara de falta de evidencia en lugar de un mock vacio.",
    emptyStateTitle:
      "Empieza con una pregunta sobre facturas, trabajos, efectivo o margen.",
    errorFallback: "No se pudo completar la consulta.",
    historyActionDescription:
      "El historial de hilos en desktop ya es visible en la barra lateral. Un panel dedicado para pantallas pequenas todavia no esta implementado.",
    newThread: "Nuevo hilo",
    noAnswer:
      "Todavia no hay evidencia coincidente en este espacio de trabajo. Sube mas datos o acota la pregunta.",
    noThreadsDescription:
      "Haz una pregunta para crear un hilo reutilizable en este espacio de trabajo.",
    noThreadsTitle: "Todavia no hay hilos guardados",
    placeholder:
      "Pregunta por facturas vencidas, trabajos con precio bajo, presion de caja o deriva de margen.",
    saveToPack: "Guardar en paquete",
    saveToPackDescription:
      "Los hallazgos de Preguntar se podran guardar en paquetes cuando ese flujo este implementado.",
    starterPrompts: [
      "Que facturas estan vencidas hoy?",
      "Que trabajos estan mal valorados?",
      "Que merece atencion primero esta semana?",
    ],
    submitLabel: "Preguntar",
    submitting: "Ejecutando...",
    threadDeleteLabel: "Eliminar hilo",
    threadStatuses: {
      clarify: "Aclarar",
      facts: "Hechos",
      hybrid: "Hibrido",
      vectors: "Vectores",
    },
    threadsHeading: "Hilos",
    title: "Preguntar",
  },
  common: {
    close: "Cerrar",
    closeDialog: "Cerrar dialogo",
    localeLabel: "Idioma",
    resetDashboardFilters: "Restablecer filtros del panel",
    skipToMainContent: "Saltar al contenido principal",
  },
  contentPage: {
    actions: {
      delete: "Eliminar",
      edit: "Editar",
      newPost: "Nueva publicacion",
      viewPublicBlog: "Ver blog publico",
    },
    breadcrumbs: ["Panel", "Contenido"],
    deleteDialog: {
      cancel: "Cancelar",
      delete: "Eliminar publicacion",
      deleting: "Eliminando...",
      description:
        "Esta publicacion se eliminara permanentemente y dejara de aparecer en el blog publico.",
      postFallback: "Esta publicacion",
      title: "Eliminar publicacion?",
    },
    description:
      "Administra publicaciones publicadas y en borrador. Los cambios se reflejan de inmediato en el blog publico.",
    editor: {
      cancel: "Cancelar",
      create: "Crear publicacion",
      editDescription: "Edita los detalles de la publicacion.",
      editTitle: "Editar publicacion",
      newDescription:
        "Completa los campos de abajo para crear una nueva publicacion.",
      newTitle: "Nueva publicacion",
      saveChanges: "Guardar cambios",
      saving: "Guardando...",
    },
    emptyState: {
      description: "Crea tu primera publicacion para comenzar.",
      title: "Todavia no hay publicaciones",
    },
    fields: {
      author: "Autor",
      body: "Contenido (Markdown)",
      slug: "Slug",
      status: "Estado",
      summary: "Resumen",
      title: "Titulo",
    },
    loading: "Cargando publicaciones...",
    placeholders: {
      author: "Equipo PulseOps",
      body: "Escribe aqui el contenido completo. Se admite Markdown.",
      slug: "errores-de-flujo-de-caja",
      summary: "Resumen de un parrafo que se muestra en las vistas de listado.",
      title: "p. ej. 5 errores de flujo de caja",
    },
    publicBlogDescription:
      "Abre /blog, la pagina publica del blog gestionada por este flujo de contenido.",
    statusLabels: {
      draft: "Borrador",
      published: "Publicado",
    },
    tableHeaders: {
      actions: "Acciones",
      author: "Autor",
      date: "Fecha",
      status: "Estado",
      title: "Titulo",
    },
    title: "Publicaciones del blog",
    toggleStatusTitle: "Haz clic para alternar el estado",
  },
  dataLabels: {
    documentFamilies: {
      all: {
        description: "Todas las familias de documentos compatibles.",
        label: "Todos los tipos de documento",
      },
      "accounts-receivable-aging-report": {
        description:
          "Cortes de antiguedad usados para priorizar cobranza e identificar clientes lentos para pagar.",
        label: "Reporte de antiguedad de cuentas por cobrar",
      },
      "bank-transaction-export": {
        description:
          "Movimientos de efectivo a nivel transaccion para reconciliar entradas, salidas y anomalias.",
        label: "Exportacion de transacciones bancarias",
      },
      "chart-of-accounts-export": {
        description:
          "Datos de referencia del catalogo contable para normalizacion financiera y agrupaciones.",
        label: "Exportacion del catalogo de cuentas",
      },
      "customer-invoice": {
        description:
          "Facturas emitidas usadas para cuentas por cobrar, tiempos de pago y recomendaciones de cobranza.",
        label: "Factura de cliente",
      },
      "estimate-or-quote": {
        description:
          "Cotizaciones usadas para comparar el valor prometido del trabajo contra el costo y margen reales.",
        label: "Estimado o cotizacion",
      },
      "generic-business-document": {
        description:
          "Familia de respaldo para archivos de negocio parseables que no encajan claramente en una familia mas especifica.",
        label: "Documento de negocio generico",
      },
      "job-cost-report": {
        description:
          "Desglose de ingresos y costos por trabajo usado para detectar subcotizacion y analizar margen.",
        label: "Reporte de costo por trabajo",
      },
      "payroll-or-timecard-export": {
        description:
          "Horas y costos de mano de obra para analizar utilizacion y costo por cuadrilla.",
        label: "Exportacion de nomina o tarjetas de tiempo",
      },
      "profit-and-loss-statement": {
        description:
          "Resumen financiero de periodo usado para validar calculos de margen y tendencias operativas.",
        label: "Estado de resultados",
      },
      "schedule-or-work-order-export": {
        description:
          "Datos operativos de agenda usados para contexto de carga de trabajo y entrega del servicio.",
        label: "Exportacion de agenda u orden de trabajo",
      },
      "vendor-bill": {
        description:
          "Documentos por pagar usados para analizar el calendario de caja y fugas de margen.",
        label: "Factura de proveedor",
      },
    },
    generic: {
      document: "Documento",
      noParserArtifact: "Todavia no se ha capturado un artefacto del parser.",
      notUsed: "No usado",
      sizeUnavailable: "Tamano no disponible",
      unavailable: "No disponible",
      used: "Usado",
    },
    sources: {
      all: "Todas las fuentes",
      api: "API conectada",
      email: "Gmail / bandeja AP",
      upload: "Cargas manuales",
    },
    statuses: {
      all: "Todos los estados",
      extracted: "Extraido",
      failed: "Fallido",
      "needs-review": "Necesita revision",
      uploaded: "Subido",
    },
  },
  appError: {
    badge: "Error de aplicacion",
    description:
      "La falla fue registrada con metadatos de solicitud y trazabilidad cuando estuvieron disponibles.",
    goToDashboard: "Ir al panel",
    title: "Algo fallo en esta vista.",
    tryAgain: "Intentar de nuevo",
  },
  dashboardPage: {
    actionLabels: {
      approve: "Aprobar",
      dismiss: "Descartar",
      discard: "Descartar",
      fix: "Corregir",
      inspect: "Inspeccionar",
      inspectFiles: "Inspeccionar archivos",
      invoiceDate: "Fecha de factura",
      keepSeparate: "Mantener separado",
      merge: "Fusionar",
      openAsk: "Abrir Preguntar",
      openBrief: "Abrir brief",
      openExplorer: "Abrir explorador",
      review: "Revisar",
      serviceDate: "Fecha de servicio",
      skip: "Omitir",
    },
    activityLiveLabel: "En vivo - se actualiza automaticamente",
    activityTitle: "Actividad del pipeline",
    emptyQueueDescription:
      "Amplia los filtros o espera nueva actividad de documentos.",
    emptyQueueTitle: "No hay acciones de operador en el alcance actual.",
    filters: {
      dateRanges: {
        "7d": "Ultimos 7 dias",
        "30d": "Ultimos 30 dias",
        all: "Todo el tiempo",
      },
    },
    labels: {
      actions: {
        primary: "Subir archivos",
        secondary: "Abrir brief semanal",
      },
      breadcrumbs: ["Aplicacion", "Panel"],
      description:
        "Sigue el flujo de documentos, la revision operativa y las senales de negocio que deben guiar las decisiones de esta semana.",
      queueTitle: "Cola operativa",
      signalsTitle: "Senales del negocio",
      title: "Panel",
      views: {
        business: "Vista de negocio",
        operations: "Vista operativa",
      },
    },
    openExplorer: "Abrir explorador",
    queueItemsLabel: "{{count}} elementos",
    viewFullActivityLog: "Ver registro completo de actividad ->",
  },
  explorerPage: {
    actions: {
      export: "Exportar CSV",
      exporting: "Exportando...",
      upload: "Subir archivo",
    },
    allRecords: "Todos los registros",
    backToList: "Volver a la lista",
    breadcrumbs: ["Panel", "Explorador"],
    close: "Cerrar",
    description:
      "Explora artefactos parseados, hechos extraidos y registros en revision en una sola tabla del espacio de trabajo.",
    documentMetadataHeading: "Metadatos del documento",
    factsPreview: "Vista previa de hechos",
    extractedFactsHeading: "Hechos extraidos",
    parserMetadataHeading: "Metadatos del parser",
    noCitations: "Todavia no hay citas adjuntas.",
    emptyStateClearSearch: "Limpiar busqueda",
    emptyStateDescription:
      "Limpia la busqueda o cambia el filtro para volver a ver registros.",
    emptyStateEyebrow: "Nada en esta vista",
    emptyStateOpenPipeline: "Abrir Pipeline",
    emptyStateShowAll: "Mostrar todos los registros",
    emptyStateTitle: "Ningun registro coincide con la busqueda actual",
    jumpToCitations: "Citas",
    jumpToFacts: "Hechos extraidos",
    jumpToFindings: "Hallazgos clave",
    jumpToHeading: "Ir a",
    noFacts: "Todavia no hay hechos extraidos adjuntos.",
    noRecordSelectedDescription:
      "Ajusta los filtros actuales o la busqueda para traer un registro a la vista.",
    noRecordSelectedTitle: "No hay registro seleccionado",
    reviewChecklistHeading: "Orden de revision recomendado",
    reviewHealthConfidence: "Confianza",
    reviewHealthConfidenceEmpty:
      "La confianza aparecera cuando se extraigan los hechos.",
    reviewHealthConfidenceHigh:
      "Todos los hechos visibles tienen alta confianza.",
    reviewHealthConfidenceLow:
      "Trata estos hechos como de baja confianza hasta que llegue mas evidencia.",
    reviewHealthConfidenceMixed:
      "{{count}} hechos visibles tienen alta confianza.",
    reviewHealthEvidence: "Evidencia",
    reviewHealthEvidenceComplete:
      "Todos los hechos visibles incluyen evidencia fuente.",
    reviewHealthEvidenceEmpty: "Todavia no hay evidencia adjunta a los hechos.",
    reviewHealthEvidencePartial:
      "{{count}} hechos visibles todavia necesitan citas.",
    reviewHealthFocusFailed:
      "Resuelve el problema del Pipeline antes de confiar en los detalles de revision.",
    reviewHealthFocusFallback:
      "Revisa juntas las tarjetas de hechos y las citas.",
    reviewHealthFocusPrimary: "Empieza por {{label}}.",
    reviewHealthFocusWaiting:
      "Espera a que haya hechos listos para revision antes de hacer una revision completa.",
    reviewHealthHeading: "Salud de la revision",
    reviewHealthParser: "Parser",
    reviewHealthParserMissing:
      "Los detalles del parser todavia no estan disponibles, asi que empieza por los metadatos del documento y el estado del flujo.",
    reviewHealthParserReady:
      "Los detalles del parser estan disponibles abajo si necesitas confirmar encabezados, filas o secciones.",
    reviewStatsCitations: "Citas",
    reviewStatsCitationsDetail: "Referencias fuente adjuntas para verificar",
    reviewStatsFacts: "Hechos listos",
    reviewStatsFactsDetail: "Tarjetas de hechos con evidencia y campos fuente",
    reviewStatsFindings: "Hallazgos clave",
    reviewStatsFindingsDetail: "Senales principales para revisar primero",
    reviewStatsState: "Estado de revision",
    reviewStatsStateDetail: "Preparacion actual para la revision",
    searchPlaceholder: "Buscar registros...",
    summary: {
      averageConfidence: "Confianza media",
      averageConfidenceDetail: "por encima del umbral de 0.85 para el brief",
      needsReview: "Necesita revision",
      needsReviewDetail: "retenido - aun no pasa aguas abajo",
      totalRecords: "Total de registros",
      totalRecordsDetail: "en todas las fuentes y tipos",
    },
    tableHeaders: {
      confidence: "Confianza",
      date: "Fecha",
      document: "Documento",
      facts: "Hechos extraidos",
      source: "Fuente",
      status: "Estado",
      type: "Clase de documento",
    },
    title: "Explorador de datos",
  },
  globalError: {
    badge: "Error global",
    description:
      "La falla fue reportada a traves del flujo de logging estructurado.",
    reload: "Recargar pagina",
    retry: "Reintentar",
    title: "La aplicacion encontro un error fatal.",
  },
  marketing: {
    about: {
      ...aboutPageContent,
      hero: {
        ...aboutPageContent.hero,
        eyebrow: "Sobre PulseOps",
        title:
          "Construimos la herramienta que nos hubiera gustado tener cuando operabamos negocios de servicio.",
        description:
          "La meta no es otro dashboard. La meta es una respuesta semanal, rapida y confiable, a las preguntas de dinero que los duenos ya hacen.",
      },
      mission:
        "Todo negocio local de servicios merece operar con hechos en lugar de instinto, especialmente cuando los margenes son ajustados y el timing de caja no perdona.",
      story:
        "PulseOps nace de la misma frustracion repetida en los oficios: los datos existian, pero nadie tenia tiempo para reconciliarlos, confiar en ellos y convertirlos en una accion antes de que la semana siguiera avanzando.",
      stats: [
        {
          value: "5 min",
          detail: "tiempo objetivo de lectura del brief semanal",
        },
        {
          value: "1 pack",
          detail: "enfoque actual del producto: efectivo y margen semanal",
        },
        {
          value: "0 relleno",
          detail: "cada recomendacion necesita evidencia y confianza",
        },
      ],
      values: [
        {
          title: "Decisiones, no dashboards",
          description:
            "El producto debe terminar en una accion clara, no en otro lugar para mirar numeros.",
        },
        {
          title: "Muestra tu trabajo",
          description:
            "Las recomendaciones necesitan evidencia fuente, confianza y suficiente contexto para su revision.",
        },
        {
          title: "Hecho para el dueno",
          description:
            "Optimizamos para el operador que intenta proteger caja y margen, no para una presentacion ejecutiva.",
        },
      ],
      team: [
        {
          name: "Jordan Kim",
          role: "Cofundador y ex operador de field service",
          description:
            "Paso una decada dentro de negocios de servicio con buen instinto y flujo de informacion deficiente.",
        },
        {
          name: "Sofia Reyes",
          role: "Producto y diseno",
          description:
            "Se enfoca en hacer que preguntas operativas densas se sientan lo bastante simples para usarse un lunes por la manana.",
        },
        {
          name: "Marcus Liu",
          role: "Sistemas de datos",
          description:
            "Convierte documentos y exportaciones desordenadas en hechos tipados y revisables en los que el producto puede confiar.",
        },
      ],
      cta: {
        title: "Listo para verlo en accion?",
        description:
          "Empieza con el brief semanal de efectivo y margen y conecta un flujo real antes de ampliar el alcance.",
        primaryAction: "Empieza gratis",
        secondaryAction: "Contactanos",
      },
    },
    blog: {
      ...blogPageContent,
      hero: {
        ...blogPageContent.hero,
        eyebrow: "Blog",
        title: "Ideas practicas para duenos de negocios de servicio.",
        description:
          "Contenido para operadores sobre timing de caja, deriva de margen, precios en field service y calidad de decision.",
      },
      featuredPost: {
        ...blogPageContent.featuredPost,
        title:
          "Por que la mayoria de los negocios HVAC no puede responder 'somos rentables este mes?'",
        summary:
          "La respuesta suele quedar atrapada entre datos de costo por trabajo, facturas, cuentas de proveedor y hojas de calculo que nunca coinciden a tiempo.",
        meta: "Articulo destacado",
      },
      posts: [
        "Como saber que tu tarifa de mano de obra esta desactualizada antes de que empiece a costarte trabajos.",
        "La conversacion sobre depositos con clientes comerciales y cuando tenerla.",
        "El tiempo de traslado destruye el margen por trabajo. Asi se ve la matematica.",
        "El problema de facturas a 30/60/90 dias y por que un mal AR se vuelve un habito.",
        "Como un negocio de plomeria encontro margen al corregir una sola categoria de trabajo.",
        "El aumento lento del costo de materiales y por que los estimados envejecen mas rapido de lo que crees.",
      ],
      cta: {
        title: "Recibe el brief semanal gratis por 30 dias.",
        description:
          "Si el blog es util, el producto convierte esa misma forma de pensar en una superficie operativa recurrente.",
        primaryAction: "Empieza gratis",
        secondaryAction: "Ver precios",
      },
    },
    careers: {
      ...careersPageContent,
      hero: {
        ...careersPageContent.hero,
        eyebrow: "Carreras",
        title:
          "Ayudanos a construir la capa de claridad financiera para negocios locales de servicio.",
        description:
          "Seguimos siendo pequenos, enviamos trabajo real y optimizamos para un producto util en vez de teatro interno.",
      },
      reasons: [
        {
          title: "El problema es realmente dificil",
          description:
            "Documentos desordenados, sistemas fragmentados, requisitos de confianza y decisiones de negocio de alto impacto convergen en un solo producto.",
        },
        {
          title: "Los clientes te dicen rapido si funciona",
          description:
            "La salida ayuda o no ayuda a un dueno a proteger caja y margen esta misma semana.",
        },
        {
          title: "Construye lo que importa",
          description:
            "Preferimos alcance acotado, contratos claros y valor medible del producto por encima de mas superficie.",
        },
      ],
      openings: [
        {
          title: "Senior Data Engineer",
          meta: "Remoto - Tiempo completo",
          description:
            "Lidera rutas de ingestion y canonizacion desde archivos crudos hasta hechos y metricas revisables.",
        },
        {
          title: "Product Designer",
          meta: "Remoto - Tiempo completo",
          description:
            "Disena superficies de decision que sigan siendo simples sin ocultar confianza, procedencia ni riesgo.",
        },
        {
          title: "Customer Success - Especialista en Field Service",
          meta: "Remoto - Tiempo completo",
          description:
            "Traduce el dolor del operador en onboarding, implementacion y ciclos de feedback de producto.",
        },
        {
          title: "Growth Marketing Manager",
          meta: "Remoto - Tiempo completo",
          description:
            "Ayuda a que los operadores correctos descubran el producto sin mover el ICP ni las promesas del producto.",
        },
      ],
    },
    contact: {
      ...contactPageContent,
      hero: {
        ...contactPageContent.hero,
        eyebrow: "Contacto",
        title: "Ponte en contacto.",
        description:
          "Usa la via que mejor encaje con el problema. Mantenemos separadas las conversaciones de producto, soporte y alianzas.",
      },
      channels: [
        {
          title: "Soporte al cliente",
          description:
            "Ayuda con onboarding, problemas de datos o interpretacion del brief.",
          action: "support@pulseops.io",
        },
        {
          title: "Ventas y multiubicacion",
          description:
            "Precios, expansion y despliegues operativos mas amplios.",
          action: "sales@pulseops.io",
        },
        {
          title: "Prensa y medios",
          description: "Entrevistas, cobertura y contexto del producto.",
          action: "press@pulseops.io",
        },
        {
          title: "Alianzas e integraciones",
          description:
            "Alianzas de plataforma y conversaciones sobre conectores.",
          action: "partners@pulseops.io",
        },
      ],
      formFields: [
        { label: "Nombre", placeholder: "Jamie Reynolds" },
        {
          label: "Email de trabajo",
          placeholder: "jamie@browardhvac.com",
          type: "email",
        },
        { label: "Empresa", placeholder: "Broward HVAC Co." },
        { label: "Mensaje", placeholder: "Cuentanos en que necesitas ayuda." },
      ],
    },
    help: {
      ...helpPageContent,
      hero: {
        ...helpPageContent.hero,
        eyebrow: "Centro de ayuda",
        title: "Como podemos ayudarte?",
        description:
          "El primer producto es intencionalmente acotado, por lo que la ayuda se concentra en setup, ingestion, el brief semanal y controles de cuenta.",
      },
      groups: [
        {
          title: "Primeros pasos",
          items: [
            {
              question: "Que hace PulseOps primero?",
              answer:
                "El primer producto es el brief semanal de efectivo y margen para negocios de field service. No es una plataforma BI generalista.",
            },
            {
              question: "Que datos puedo subir hoy?",
              answer:
                "CSV y XLSX son los formatos principales de carga manual. Las fuentes adicionales llegan despues.",
            },
          ],
        },
        {
          title: "Conexion de datos",
          items: [
            {
              question:
                "Puedo conectar ServiceTitan y QuickBooks al mismo tiempo?",
              answer:
                "Si. El objetivo es reconciliar datos fragmentados en una sola vista operativa util.",
            },
            {
              question: "Que pasa si falla el parsing?",
              answer:
                "Los registros fallidos siguen visibles para revision y reintento en lugar de contaminar silenciosamente las salidas posteriores.",
            },
          ],
        },
        {
          title: "Tu brief",
          items: [
            {
              question: "Por que cada recomendacion incluye confianza?",
              answer:
                "La confianza es un requisito central del producto. El usuario necesita saber cuan fuerte es la evidencia antes de actuar.",
            },
            {
              question: "Se pueden rechazar recomendaciones?",
              answer:
                "Si. Los rechazos y ediciones forman parte del ciclo de retroalimentacion que ayuda al sistema a aprender del negocio.",
            },
          ],
        },
        {
          title: "Cuenta y facturacion",
          items: [
            {
              question: "Puedo cancelar en cualquier momento?",
              answer:
                "Si. El producto inicial esta disenado para seguir siendo simple y de baja friccion.",
            },
            {
              question: "Cobran por asiento?",
              answer:
                "No. El precio es una tarifa plana por paquete de producto, no por asiento.",
            },
          ],
        },
      ],
      cta: {
        title: "Todavia tienes una pregunta?",
        description:
          "Habla directamente con el equipo si el centro de ayuda no cubre tu caso.",
        primaryAction: "Contactar soporte",
        secondaryAction: "Empieza gratis",
      },
    },
    home: {
      ...homePageContent,
      hero: {
        ...homePageContent.hero,
        eyebrow: "Inteligencia de efectivo y margen",
        title:
          "Tu negocio de servicios funciona por intuicion. Empieza a operarlo con hechos.",
        description:
          "PulseOps entrega un brief semanal en lenguaje claro que te dice por donde se fuga el dinero, que facturas perseguir y que corregir antes del viernes.",
        actions: [
          { href: "/signup", label: "Empieza gratis", variant: "primary" },
          {
            href: "/#how-it-works",
            label: "Ver como funciona",
            variant: "secondary",
          },
        ],
        stats: [
          {
            value: "56%",
            detail: "de las pequenas empresas tienen facturas vencidas",
          },
          { value: "$17.5K", detail: "saldo promedio pendiente por empresa" },
          {
            value: "75%",
            detail: "citan el alza de costos como el principal reto",
          },
          {
            value: "#1",
            detail: "la claridad de margen es el punto ciego mas comun",
          },
        ],
        footerNote:
          "Fuentes: encuesta crediticia de la Fed para pequenas empresas e investigacion SMB de Intuit.",
      },
      pain: {
        ...homePageContent.pain,
        eyebrow: "El problema real",
        title:
          "Los numeros ya existen. Simplemente no se pueden usar con la suficiente rapidez para actuar.",
        description:
          "Las ventas viven en un sistema, los costos en otro, los horarios en una hoja de calculo y las facturas en una bandeja de entrada. Los problemas se acumulan en silencio hasta que ya duelen.",
        items: [
          {
            icon: "Cash",
            title: "Trabajos con precio bajo",
            description:
              "La mano de obra supera el estimado, los materiales suben y el precio nunca alcanza al costo real.",
          },
          {
            icon: "AR",
            title: "Facturas que nadie persigue",
            description:
              "El efectivo ya se gano, pero la cobranza se retrasa porque las cuentas correctas no aparecen a tiempo.",
          },
          {
            icon: "Margin",
            title: "Fugas por linea",
            description:
              "Un tipo de servicio o un proveedor puede borrar margen sin hacerse visible en un dashboard resumido.",
          },
          {
            icon: "Timing",
            title: "Latigazos de flujo de caja",
            description:
              "Los proveedores quieren cobrar antes de que los clientes paguen, y el faltante se vuelve obvio demasiado tarde.",
          },
        ],
      },
      workflow: {
        ...homePageContent.workflow,
        eyebrow: "Como funciona",
        title: "Conectado en un dia. Accionable el lunes.",
        description:
          "Hacemos el trabajo sucio de integracion y normalizacion para que el dueno reciba un brief corto y util en lugar de otro reporte que mantener.",
        steps: [
          {
            step: "1",
            title: "Conecta los sistemas que ya usas",
            description:
              "QuickBooks, ServiceTitan, hojas de calculo, adjuntos de email y cargas manuales entran por una sola superficie.",
          },
          {
            step: "2",
            title: "Construye una vista limpia del negocio",
            description:
              "PulseOps reconcilia trabajos, costos, pagos y documentos en una sola vista operativa.",
          },
          {
            step: "3",
            title: "Muestra la evidencia fuente",
            description:
              "Cada recomendacion incluye procedencia, confianza y los registros exactos que la respaldan.",
          },
          {
            step: "4",
            title: "Entrega el brief semanal",
            description:
              "El dueno recibe seis respuestas enfocadas en decisiones, en lenguaje claro y con las siguientes acciones ordenadas por impacto.",
          },
        ],
        connectors: [
          "QuickBooks",
          "Jobber",
          "ServiceTitan",
          "Housecall Pro",
          "Google Sheets",
          "Excel",
          "Exportaciones bancarias",
        ],
      },
      questions: {
        ...homePageContent.questions,
        eyebrow: "El brief semanal",
        title: "Seis preguntas. Respondidas cada lunes.",
        description:
          "Estas son las preguntas que los duenos ya hacen. PulseOps se asegura de que alguien las responda con evidencia.",
        items: [
          {
            icon: "?",
            title: "Que trabajos estan mal cotizados?",
            description:
              "Encuentra los servicios donde el costo real supera de forma consistente el precio cotizado.",
          },
          {
            icon: "?",
            title: "Por donde se fuga el margen?",
            description:
              "Los retrabajos, las horas extra y la variacion de materiales se ordenan por impacto en dolares.",
          },
          {
            icon: "?",
            title: "Que facturas debemos perseguir hoy?",
            description:
              "Obten una lista corta y urgente de quien debe efectivo y que hacer primero.",
          },
          {
            icon: "?",
            title: "Que clientes necesitan deposito?",
            description:
              "Marca cuentas lentas para pagar y trabajos grandes proximos que deberian requerir efectivo por adelantado.",
          },
          {
            icon: "?",
            title: "Que facturas son sensibles al timing?",
            description:
              "Saca a la luz compras y pagos a proveedores que deben alinearse con las entradas de efectivo.",
          },
          {
            icon: "?",
            title: "Que merece mas atencion?",
            description:
              "Recibe una lista ordenada de las acciones de mayor impacto para la semana.",
          },
        ],
      },
      preview: {
        ...homePageContent.preview,
        eyebrow: "Como se ve",
        title: "Consejos, no un reporte.",
        description:
          "Cada recomendacion te dice que cambio, que significa en dolares y que hacer despues.",
        checklist: [
          "Solo destaca lo que cambio o necesita accion.",
          "Muestra evidencia fuente y confianza para cada recomendacion.",
          "Ordena los problemas por impacto en dolares para empezar por lo que mas importa.",
          "Funciona por email o dentro de la app con la misma superficie clara de decision.",
          "Toma menos de cinco minutos leerlo y actuar.",
        ],
        recommendations: [
          {
            title: "Brecha de precio en instalaciones de calentadores de agua",
            summary:
              "La mano de obra promedio fue de 3.4 horas frente a un estimado de 2.5 horas en 17 trabajos recientes.",
            detail: "Recuperacion estimada: $2,400 al mes.",
          },
          {
            title: "Tres facturas vencidas necesitan escalamiento",
            summary:
              "Riverdale Commercial y otras dos cuentas ya representan la mayor concentracion de cuentas por cobrar abiertas.",
            detail: "Efectivo en riesgo: $8,750.",
          },
          {
            title:
              "El calendario de un proveedor genera un bache de caja el viernes",
            summary:
              "Una factura de proveedor vence antes de que entren los cobros esperados, generando un faltante salvo que la cobranza se adelante.",
            detail: "Brecha proyectada: $1,400.",
          },
        ],
      },
      difference: {
        ...homePageContent.difference,
        eyebrow: "Lo que nos diferencia",
        title:
          "Otras herramientas muestran datos. Nosotros te decimos que hacer con ellos.",
        description:
          "La mayoria de los productos lee un sistema limpio y te entrega una grafica. PulseOps reconcilia la realidad desordenada y la convierte en una decision.",
        items: [
          {
            icon: "Merge",
            title: "Una imagen clara",
            description:
              "Datos bancarios, sistemas de trabajo, hojas de calculo y archivos de bandeja de entrada se reconcilian en una sola vista operativa.",
          },
          {
            icon: "Proof",
            title: "Muestra tu trabajo",
            description:
              "Las recomendaciones incluyen los trabajos, las facturas y los calculos detras de ellas para que el usuario pueda juzgar el consejo.",
          },
          {
            icon: "Learn",
            title: "Aprende de tu negocio",
            description:
              "Las correcciones, aprobaciones y recomendaciones rechazadas ajustan el sistema a como el negocio opera en realidad.",
          },
        ],
      },
      industries: {
        ...homePageContent.industries,
        eyebrow: "Creado para",
        title:
          "Negocios locales de servicio basados en proyectos con 5 a 50 empleados.",
        description:
          "El primer paquete de decision esta optimizado para negocios de field service y oficios que viven las mismas preguntas de caja y margen cada semana.",
        items: [
          "HVAC",
          "Plomeria",
          "Electricidad",
          "Paisajismo",
          "Servicio de albercas",
          "Limpieza",
          "Control de plagas",
          "Puertas de garaje",
          "Construccion ligera",
          "Reparacion de electrodomesticos",
        ],
        note: "Los paquetes adicionales para otros verticales llegan despues, una vez que el brief de efectivo y margen funcione de punta a punta.",
      },
      testimonials: {
        ...homePageContent.testimonials,
        eyebrow: "Desde el campo",
        title: "Duenos que dejaron de volar a ciegas.",
        items: [
          {
            quote:
              "PulseOps nos mostro que las visitas de mantenimiento costaban mas de lo que cobraban cuando cuentas el tiempo de traslado y los retrabajos. Cambiamos precios y el margen se recupero en seis semanas.",
            name: "Marcus R.",
            company: "HVAC - 14 tecnicos",
            initials: "MR",
          },
          {
            quote:
              "El primer brief me dio una lista de tres facturas para perseguir esa misma manana. Cobramos la mayor parte del atraso esa misma semana.",
            name: "Diana V.",
            company: "Plomeria - 9 empleados",
            initials: "DV",
          },
          {
            quote:
              "Arreglamos el proceso de estimacion, no a la cuadrilla, porque el sistema mostro exactamente donde empezaba el problema de margen.",
            name: "Tariq B.",
            company: "Paisajismo - 11 empleados",
            initials: "TB",
          },
        ],
      },
      pricing: {
        ...homePageContent.pricing,
        eyebrow: "Precios",
        title: "Tarifa plana. Sin analistas. Sin sorpresas.",
        description:
          "Todo esta incluido. Sin tarifas por asiento, sin contrato oculto de implementacion y sin sorpresas de uso en el primer producto.",
        tiers: [
          {
            name: "Brief de efectivo y margen",
            price: "$149",
            priceSuffix: "/mes",
            description:
              "Para negocios de servicio operados por sus duenos que quieren dejar de adivinar sobre caja y margen.",
            points: [
              "1 negocio y hasta 4 fuentes de datos",
              "Brief semanal de efectivo y margen",
              "Analisis de rentabilidad por trabajo",
              "Seguimiento de facturas y cuentas por cobrar",
              "Referencias de la industria",
              "Soporte por email",
            ],
            ctaLabel: "Empieza la prueba gratis",
          },
          {
            name: "Paquete completo de operaciones",
            price: "$299",
            priceSuffix: "/mes",
            description:
              "Para operadores en crecimiento que necesitan visibilidad de caja, margen, personal y excepciones en una sola superficie.",
            points: [
              "Hasta 3 ubicaciones y fuentes ilimitadas",
              "Capturas diarias mas brief semanal",
              "Seguimiento de rentabilidad por cuadrilla y trabajo",
              "Recomendaciones de depositos de clientes",
              "Alertas basadas en excepciones",
              "Soporte prioritario",
            ],
            ctaLabel: "Empieza la prueba gratis",
            featured: true,
            featuredLabel: "Mas popular",
          },
          {
            name: "Multiubicacion",
            price: "Personalizado",
            priceSuffix: "",
            description:
              "Para grupos y franquicias que necesitan visibilidad consolidada y comparativos.",
            points: [
              "Ubicaciones ilimitadas",
              "Benchmarking entre ubicaciones",
              "Conectores personalizados",
              "Soporte dedicado de onboarding",
              "Opcion white-label",
              "Soporte con SLA",
            ],
            ctaLabel: "Contactar ventas",
          },
        ],
      },
      cta: {
        ...homePageContent.cta,
        title: "Empieza a conocer tus numeros esta semana.",
        description:
          "Conecta tu primera fuente de datos en menos de 10 minutos. Tu primer brief llega el lunes.",
        primaryAction: "Empieza gratis",
        secondaryAction: "Hablar con ventas",
      },
    },
    login: {
      ...loginPageContent,
      eyebrow: "Iniciar sesion",
      title: "Bienvenido de nuevo",
      highlight:
        "Abre el ultimo brief de efectivo y margen, inspecciona la evidencia y revisa acciones del operador desde un solo espacio de trabajo.",
      details: [
        "Revision del brief semanal con evidencia y metadatos de confianza.",
        "Acceso al explorador para registros parseados y hechos extraidos.",
        "Visibilidad del pipeline para salud de fuentes y registros fallidos.",
      ],
      form: {
        ...loginPageContent.form,
        title: "Bienvenido de nuevo",
        subtitle:
          "Inicia sesion para entrar al espacio de trabajo de PulseOps.",
        fields: [
          {
            label: "Email de trabajo",
            placeholder: "jamie@browardhvac.com",
            type: "email",
          },
          {
            label: "Contrasena",
            placeholder: "Ingresa tu contrasena",
            type: "password",
          },
        ],
        actions: [
          { label: "Entrar", href: "/dashboard", variant: "primary" },
          {
            label: "Olvidaste tu contrasena?",
            href: "/help",
            variant: "secondary",
          },
        ],
        footerPrompt: "Necesitas una cuenta?",
        footerLinkLabel: "Empieza una prueba gratis",
        footerLinkHref: "/signup",
      },
    },
    press: {
      ...pressPageContent,
      hero: {
        ...pressPageContent.hero,
        eyebrow: "Prensa",
        title: "Recursos para prensa y medios.",
        description:
          "Material de contexto, posicionamiento del producto y datos de contacto para cobertura.",
      },
      boilerplate:
        "PulseOps ayuda a los negocios locales de servicio a proteger caja y margen por medio de un brief semanal de decision sustentado en sus datos operativos reales.",
      facts: [
        { value: "Field service", detail: "Foco inicial del ICP" },
        { value: "1 producto", detail: "Brief semanal de efectivo y margen" },
        {
          value: "Confianza primero",
          detail: "Evidencia y confianza en cada recomendacion",
        },
        { value: "Next.js", detail: "Superficie local actual del producto" },
      ],
      coverage: [
        "La nueva clase de herramientas analiticas para field service por fin esta hecha para el dueno, no para el contador.",
        "PulseOps entrega lo que QuickBooks no puede: una respuesta semanal a si el negocio realmente es rentable.",
        "Un brief de $149 que le dice a operadores de oficios que trabajos pierden dinero? Lo probamos.",
      ],
    },
    privacy: {
      ...privacyPageContent,
      title: "Politica de privacidad",
      updatedLabel: "Actualizado el 9 de abr de 2026",
      intro:
        "Esta politica explica que informacion recopila PulseOps, como se usa y como se protege mientras el producto se construye alrededor de un modelo operativo centrado en la confianza.",
      sections: [
        {
          title: "1. Informacion que recopilamos",
          body: [
            "Recopilamos informacion de cuenta, documentos subidos, datos de sistemas conectados, mensajes de soporte y senales de uso necesarias para operar el servicio.",
            "Minimizamos la recopilacion a lo necesario para ingestion, normalizacion, salida de decisiones, seguridad y soporte operativo.",
          ],
        },
        {
          title: "2. Como usamos la informacion",
          body: [
            "La informacion se usa para procesar cargas, generar recomendaciones, mejorar la calidad del modelo, atender clientes, asegurar el producto y cumplir obligaciones legales.",
          ],
        },
        {
          title: "3. Conexiones de datos y acceso de terceros",
          body: [
            "Los sistemas conectados y procesadores de carga se usan solo para operar el producto. No damos a los modelos acceso irrestricto a tus bases de datos ni a entornos arbitrarios de ejecucion de codigo.",
          ],
        },
        {
          title: "4. Seguridad de datos",
          body: [
            "Disenamos para aislamiento por tenant, control de acceso, auditabilidad, estrategia de redaccion y retencion desde el inicio, no como una etapa de endurecimiento posterior.",
          ],
        },
        {
          title: "5. Retencion de datos",
          body: [
            "Las ventanas de retencion se atan al flujo del producto, a la necesidad del negocio y a las obligaciones contractuales. Los artefactos y logs no se conservan indefinidamente por defecto.",
          ],
        },
        {
          title: "6. Tus derechos",
          body: [
            "Puedes solicitar acceso, correccion, exportacion o eliminacion de tus datos sujeto a obligaciones legales y operativas.",
          ],
        },
        {
          title: "7. Cookies",
          body: [
            "Usamos un conjunto limitado de cookies y mecanismos de almacenamiento local para autenticacion, seguridad y funcionalidad del producto.",
          ],
        },
        {
          title: "8. Cambios",
          body: [
            "Si esta politica cambia de forma material, actualizaremos la fecha de vigencia y comunicaremos el cambio por el producto o por email cuando corresponda.",
          ],
        },
      ],
    },
    shell: {
      content: {
        ctaHref: "/signup",
        ctaLabel: "Empieza gratis",
        footerDescription:
          "Claridad semanal de efectivo y margen para negocios locales de servicio sin analistas, sin dashboards y sin adivinanzas.",
        footerTagline:
          "Construido para negocios locales de servicio en cualquier lugar.",
      },
      footerGroups: [
        {
          title: "Producto",
          links: [
            { href: "/#questions", label: "Lo que recibes" },
            { href: "/#how-it-works", label: "Como funciona" },
            { href: "/#pricing", label: "Precios" },
            { href: "/#difference", label: "Por que es diferente" },
          ],
        },
        {
          title: "Empresa",
          links: [
            { href: "/about", label: "Nosotros" },
            { href: "/blog", label: "Blog" },
            { href: "/careers", label: "Carreras" },
            { href: "/press", label: "Prensa" },
          ],
        },
        {
          title: "Soporte",
          links: [
            { href: "/help", label: "Centro de ayuda" },
            { href: "/contact", label: "Contacto" },
            { href: "/privacy", label: "Privacidad" },
            { href: "/terms", label: "Terminos" },
          ],
        },
      ],
      navigationLinks: [
        { href: "/#how-it-works", label: "Como funciona" },
        { href: "/#questions", label: "Lo que recibes" },
        { href: "/#difference", label: "Por que es diferente" },
        { href: "/#pricing", label: "Precios" },
        { href: "/blog", label: "Blog" },
      ],
    },
    shared: {
      aboutMissionEyebrow: "Mision",
      aboutTeamEyebrow: "Equipo",
      aboutTeamTitle: "Personas que realmente han operado el problema.",
      careersApplyInterest: "Aplicar interes",
      aboutValuesEyebrow: "Lo que nos importa",
      aboutValuesTitle: "Algunas cosas que nos importan de verdad.",
      blogFeaturedEyebrow: "Destacado",
      blogRequestArticle: "Solicitar este articulo",
      careersOpenRolesEyebrow: "Vacantes",
      careersOpenRolesTitle: "Puestos abiertos",
      careersWhyJoinEyebrow: "Por que unirte",
      careersWhyJoinTitle:
        "Somos pequenos por diseno. Todos entregan trabajo real.",
      contactReachEyebrow: "Contactanos",
      contactReachTitle: "Otras formas de llegar al equipo",
      contactSendAction: "Enviar mensaje",
      contactSendTitle: "Envianos un mensaje",
      footerCopyright: "(c) 2026 PulseOps. Todos los derechos reservados.",
      footerNavigationLabel: "Navegacion del pie de pagina",
      helpSearchPlaceholder: "Buscar en el centro de ayuda",
      pressBoilerplateEyebrow: "Boilerplate de la empresa",
      pressBoilerplateTitle: "Texto base de la empresa",
      pressBrandEyebrow: "Marca",
      pressBrandTitle: "Logos y paleta de colores",
      pressCoverageEyebrow: "Cobertura",
      pressCoverageTitle: "Cobertura reciente",
      pressMediaDescription:
        "Para entrevistas, logos, capturas del producto o material de contexto, contacta al equipo de medios.",
      pressMediaPrimary: "press@pulseops.io",
      pressMediaSecondary: "Contactanos",
      pressMediaTitle: "Consultas de medios",
      sampleBriefSubtitle:
        "Semana del 14 de abr de 2026 - Precision Plumbing Co.",
      sampleBriefTitle: "Informe semanal de efectivo y margen",
      worksWithLabel: "Funciona con",
    },
    signup: {
      ...signupPageContent,
      eyebrow: "Empieza gratis",
      title: "Empieza tu prueba gratis",
      highlight:
        "Conecta un negocio, sube registros reales y recibe el primer brief de efectivo y margen antes de ampliar el alcance.",
      details: [
        "Precio plano sin impuesto por asiento.",
        "Soporte de carga manual para CSV y XLSX desde el primer dia.",
        "Recomendaciones centradas en la confianza con citas y confianza.",
      ],
      form: {
        ...signupPageContent.form,
        title: "Crea tu cuenta",
        subtitle:
          "Comparte lo necesario para levantar el primer espacio de trabajo y brief.",
        fields: [
          { label: "Nombre completo", placeholder: "Jamie Reynolds" },
          {
            label: "Email de trabajo",
            placeholder: "jamie@browardhvac.com",
            type: "email",
          },
          { label: "Empresa", placeholder: "Broward HVAC Co." },
          {
            label: "Contrasena",
            placeholder: "Elige una contrasena",
            type: "password",
          },
        ],
        actions: [
          { label: "Crear cuenta", href: "/dashboard", variant: "primary" },
          {
            label: "Hablar con ventas",
            href: "/contact",
            variant: "secondary",
          },
        ],
        footerPrompt: "Ya tienes una cuenta?",
        footerLinkLabel: "Inicia sesion",
        footerLinkHref: "/login",
      },
    },
    terms: {
      ...termsPageContent,
      title: "Terminos del servicio",
      updatedLabel: "Actualizado el 9 de abr de 2026",
      intro:
        "Estos terminos regulan el acceso a PulseOps y describen el uso de la suscripcion, el comportamiento aceptable y los limites del alcance actual del producto.",
      sections: [
        {
          title: "1. El servicio",
          body: [
            "PulseOps ofrece actualmente un producto acotado centrado en un brief semanal de efectivo y margen y en los flujos de ingestion, revision y recomendacion necesarios para producirlo.",
          ],
        },
        {
          title: "2. Registro de cuenta",
          body: [
            "Eres responsable de mantener seguras las credenciales de tu cuenta y de la actividad que ocurra bajo ella.",
          ],
        },
        {
          title: "3. Suscripciones y facturacion",
          body: [
            "Las suscripciones se renuevan segun el periodo de facturacion seleccionado salvo cancelacion antes de la renovacion.",
          ],
        },
        {
          title: "4. Tus datos",
          body: [
            "Conservas la propiedad de tus datos. Nos otorgas los derechos necesarios para almacenarlos, procesarlos y transformarlos con el fin de operar el servicio.",
          ],
        },
        {
          title: "5. Uso aceptable",
          body: [
            "No puedes usar el servicio para violar la ley, abusar del sistema, interferir con otros o intentar obtener acceso no autorizado a datos o infraestructura.",
          ],
        },
        {
          title: "6. Limitaciones del servicio",
          body: [
            "El servicio esta evolucionando. Algunas funciones mostradas en el diseno o la documentacion pueden estar planificadas y no totalmente implementadas, y buscamos etiquetar esos casos con claridad.",
          ],
        },
        {
          title: "7. Descargo y responsabilidad",
          body: [
            "Salvo donde la ley exija lo contrario, el servicio se ofrece segun disponibilidad y la responsabilidad se limita al maximo permitido.",
          ],
        },
        {
          title: "8. Cambios en los terminos",
          body: [
            "Podemos actualizar estos terminos con el tiempo. El uso continuado despues de una actualizacion constituye aceptacion de los terminos revisados.",
          ],
        },
      ],
    },
  },
  packsPage: {
    ...normalizedDefaultUiMessagesEnUs.packsPage,
    actions: {
      export: "Exportar vista",
      exportPreview: "Exportar vista",
      exporting: "Exportando...",
      exportingPreview: "Exportando vista...",
      generate: "Generar vista mas reciente",
      generatePreview: "Generar vista mas reciente",
      generating: "Generando...",
      generatingPreview: "Generando vista mas reciente...",
      markReviewed: "Marcar lista para compartir",
      markReady: "Marcar lista para compartir",
      stillDrafting: "Sigue en borrador",
      markingReviewed: "Marcando lista...",
      markingReady: "Marcando lista para compartir...",
    },
    bestNextMoveHeading: "Mejor siguiente paso",
    businessSignalsDescription:
      "Estas son las senales operativas principales que moldean la vista seleccionada.",
    businessSignalsHeading: "Senales del negocio",
    conceptsDescription:
      "Cada concepto es un tema del negocio que esta vista combina en una sola superficie de analisis.",
    conceptsHeading: "Que agrupa este paquete",
    dataHeaders: {
      class: "Clase",
      confidence: "Confianza",
      contribution: "Contribucion",
      sourceFile: "Archivo fuente",
    },
    detailEyebrow: "Vista de analisis",
    emptyDraftRecommendations:
      "Este paquete sigue en borrador y todavia no tiene recomendaciones.",
    emptyPackAction: "Mostrar todas las vistas",
    emptyPackDescription:
      "Limpia la busqueda o vuelve a todas las vistas para recuperar un analisis agrupado.",
    emptyPackList: "Ningun paquete coincide con el filtro actual.",
    errors: {
      exportFailed: "La exportacion del paquete fallo.",
      exportTitle: "No se pudo exportar el paquete",
      feedbackFailed: "No se pudo guardar la respuesta sobre la recomendacion.",
      feedbackTitle: "No se pudo guardar la retroalimentacion",
      generateTitle: "No se pudo generar el paquete",
      generationFailed: "La generacion del paquete fallo.",
      requestFailed: "No se pudo completar la solicitud.",
      reviewFailed: "La revision del paquete fallo.",
      reviewTitle: "No se pudo actualizar el paquete",
    },
    feedbackAccepted: "Aceptado para esta recomendacion.",
    feedbackDismissed: "Descartado para esta recomendacion.",
    feedbackSaving: "Guardando feedback...",
    filterLabels: {
      all: "Todos",
      draft: "Borrador",
      ready: "Listo",
    },
    evidenceHeading: "Evidencia detras de esta vista",
    headerDescription:
      "Previsualiza analisis agrupados del negocio antes de convertirlos en una decision operativa.",
    labels: {
      breadcrumbs: ["Panel", "Paquetes de decision"],
      description:
        "Briefs semanales y recomendaciones sustentadas en datos ingeridos.",
      title: "Paquetes de decision",
    },
    previewHealthDescription:
      "Estas senales muestran que tan completa y lista esta la vista de analisis seleccionada.",
    previewHealthHeading: "Salud de la vista",
    recommendationsHeading: "Recomendaciones",
    recommendationsDescription:
      "Empieza por la accion de mayor prioridad y usa el resto de la vista como contexto de apoyo.",
    recommendationActions: {
      accept: "Aceptar",
      dismiss: "Descartar",
    },
    previewEyebrow: "Vista de analisis",
    searchPlaceholder: "Buscar paquetes",
    selectorDescription:
      "Cada vista agrupa un concepto del negocio en una superficie corta para decisiones operativas.",
    selectorEyebrow: "Elegir vista",
    selectorTitle: "Elige el concepto del negocio a revisar",
    sourceDataDescription:
      "Estos archivos fuente son la evidencia que actualmente alimenta la vista seleccionada.",
    sourceDataEmpty: "Todavia no hay registros fuente adjuntos.",
    sourceDataHeading: "Evidencia detras de esta vista",
    success: {
      exportDescription:
        "La exportacion deberia descargarse en breve con el contenido actual de la vista.",
      exportTitle: "La exportacion de la vista comenzo",
      exportingDescription:
        "Preparando una exportacion compartible del analisis agrupado actual.",
      exportingTitle: "Preparando exportacion",
      generateDescription:
        "El analisis agrupado mas reciente ya esta listo y seleccionado para revisarlo.",
      generateTitle: "Vista actualizada",
      generatingDescription:
        "Construyendo el analisis agrupado mas reciente desde los datos actuales del espacio.",
      generatingTitle: "Actualizando vista de analisis",
      reviewDescription:
        "Esta vista ahora esta marcada como lista para compartir con el equipo.",
      reviewTitle: "Vista marcada como lista",
      reviewingDescription:
        "Guardando la vista actual como lista para compartir.",
      reviewingTitle: "Actualizando estado de la vista",
    },
  },
  pipelinePage: {
    ...normalizedDefaultUiMessagesEnUs.pipelinePage,
    dismissAction: "Descartar alerta",
    labels: {
      actions: {
        primary: "Subir archivo",
        secondary: "Mostrar bloqueados",
      },
      breadcrumbs: ["Aplicacion", "Pipeline"],
      description:
        "Mira que esta entrando, que se trabo y que ya esta listo para alimentar hechos y el brief semanal.",
      sectionDescriptions: {
        rules:
          "Cada tipo de documento sigue una ruta clara para que el operador sepa que puede revisarse, citarse y usarse despues.",
        runs: "Los archivos recientes se muestran en lenguaje claro para que sea obvio que paso y que deberia pasar despues.",
        sources:
          "Este espacio de trabajo empieza con cargas manuales. Agrega mas rutas de entrada solo cuando esten activas y sean confiables.",
        stages:
          "El pipeline pasa de intake a revision y luego a registros listos para hechos. Estos conteos muestran donde se esta acumulando el trabajo.",
      },
      sectionTitles: {
        rules: "Reglas de procesamiento",
        runs: "Progreso reciente de archivos",
        sources: "Rutas de entrada",
        stages: "Como se mueven los archivos",
      },
      title: "Pipeline de datos",
    },
    sourceActions: {
      configure: "Configurar",
      investigate: "Investigar",
      upload: "Subir",
      viewFailedRecords: "Ver registros fallidos",
    },
    stageHeaders: {
      brief: "Brief",
      depth: "Profundidad del pipeline",
      documentType: "Tipo de documento",
      llm: "LLM",
      source: "Fuente",
      sql: "SQL",
      vector: "Vector",
    },
    tableHeaders: [
      "Hora",
      "Fuente",
      "Tipo de documento",
      "Registros",
      "Resultado",
      "Confianza",
      "Duracion",
    ],
    testPipelineDescription:
      "Los diagnosticos del pipeline estan planeados, pero la orquestacion de ejecucion de prueba todavia no esta implementada.",
  },
  settingsPage: {
    ...normalizedDefaultUiMessagesEnUs.settingsPage,
    actions: {
      cancel: "Cancelar",
      connect: "Conectar",
      connecting: "Conectando...",
      configure: "Configurar",
      continue: "Continuar",
      disconnect: "Desconectar",
      inviteMember: "Invitar miembro",
      manage: "Administrar",
      remove: "Eliminar",
      reconnect: "Reconectar",
      reset: "Restablecer",
      reviewFailures: "Revisar fallas",
      revoke: "Revocar",
      revokeKey: "Revocar clave",
      revoking: "Revocando...",
      saveCap: "Guardar tope",
      saveCard: "Guardar tarjeta",
      saveChanges: "Guardar cambios",
      savePreferences: "Guardar preferencias",
      saveProfile: "Guardar perfil",
      saveWebsiteDetails: "Guardar datos web",
      saving: "Guardando...",
      sendingInvite: "Enviando...",
      syncNow: "Sincronizar ahora",
    },
    actionDescriptions: {
      activeSessions:
        "Revisa las sesiones activas y revoca el acceso de dispositivos viejos.",
      authentication:
        "Configuracion de autenticacion y control de acceso para el espacio de trabajo.",
      apiKeys: "Claves de acceso programatico solo para integraciones de servidor.",
      billingModel:
        "Los totales se actualizan automaticamente con el uso de IA registrado.",
      businessProfile:
        "Esta informacion moldea como PulseOps interpreta tus datos y construye tu brief de efectivo y margen.",
      appearance:
        "Refleja los controles de diseno de configuracion y conserva el modo de color del espacio de trabajo en el almacenamiento local.",
      colorModePersisted: "Se mantiene entre sesiones.",
      connectedSources:
        "Conecta tus sistemas de negocio para alimentar el pipeline de ingestion.",
      currentCap: "Aplica al ciclo de facturacion actual del espacio de trabajo.",
      currentCycle: "Ciclo actual en todo el espacio de trabajo.",
      fallbackSessionNotice:
        "Este espacio de trabajo local esta usando la sesion de desarrollo de respaldo.",
      manageAccounts:
        "Puedes administrar las cuentas del equipo y la politica de acceso.",
      manageOwnProfile:
        "Solo puedes ajustar tu propio perfil y contrasena.",
      notificationPreferences:
        "Elige como y cuando PulseOps te contacta. Se requiere rol de operador o superior.",
      paymentMethods:
        "Agrega una tarjeta del negocio para el servicio y una tarjeta de respaldo opcional. Solo se guardan los datos enmascarados.",
      preferences:
        "Valores por defecto de visualizacion y flujo a nivel espacio de trabajo.",
      rolePermissions:
        "Define que puede ver y hacer cada rol dentro de tu espacio de trabajo.",
      usageCap:
        "Tope mensual opcional para el uso de IA. Dejalo vacio para no tener tope.",
      websiteDetails:
        "Datos publicos estructurados para la home y la pagina de contacto. Actualiza estos campos sin tocar el texto de la pagina ni un editor visual.",
    },
    actionTitles: {
      activeSessions: "Sesiones activas",
      apiKeys: "Claves API",
      appearance: "Apariencia",
      authentication: "Autenticacion",
      billingModel: "Modelo de facturacion",
      businessProfile: "Perfil del negocio",
      colorMode: "Modo de color",
      connectedSources: "Fuentes conectadas",
      currentUsage: "Uso en este periodo",
      notificationPreferences: "Preferencias de notificacion",
      paymentMethods: "Metodos de pago",
      preferences: "Preferencias",
      rolePermissions: "Permisos por rol",
      teamMembers: "Miembros del equipo",
      usageCap: "Tope de uso",
      websiteDetails: "Datos del sitio",
    },
    appearance: {
      colorMode: "Modo de color",
      dark: "Oscuro",
      light: "Claro",
    },
    billing: {
      activePlanBadge: "Plan activo",
      backupCard: "Tarjeta de respaldo",
      billingModelValue: "Acceso a plataforma + uso",
      billingZip: "Codigo postal",
      billingZipValue: "Codigo postal {{postalCode}}",
      businessCard: "Tarjeta del negocio",
      capReached: "Se alcanzo el tope.",
      cardHelp:
        "El numero de tarjeta y el codigo de seguridad solo se usan para actualizar la tarjeta y no se guardan en este prototipo local.",
      cardNumber: "Numero de tarjeta",
      cardholderName: "Nombre del titular",
      currentCapLabel: "Tope actual",
      expMonth: "Mes venc.",
      expYear: "Ano venc.",
      monthlyCapLabel: "Tope mensual",
      noCap: "Sin tope",
      noCapSet: "No hay tope configurado.",
      noCardOnFile: "No hay tarjeta guardada.",
      noUsageAllowed: "No se permite uso con el tope actual.",
      ofMonthlyCapUsed: "{{percent}} del tope mensual usado",
      paymentMethodDescription:
        "{{brand}} terminada en {{last4}} • Vence {{expiration}}",
      previewingUnsavedCap: "Vista previa del tope sin guardar",
      securityCode: "Codigo de seguridad",
      setMonthlyCapCaption:
        "Configura un tope mensual para pausar automaticamente nuevas corridas de IA.",
      usageCapFieldLabel: "Tope mensual (USD)",
      usageCapHint:
        "Las nuevas corridas de IA se pausan cuando el ciclo actual llega a este monto.",
      usageDetails: {
        monthlyRecurring: "Recurrente mensual",
        renews: "Renueva {{date}}",
        trackedRuns: "{{count}} corridas registradas",
        trackedRunsSettling:
          "{{count}} corridas registradas, {{settlingCount}} en conciliacion",
      },
      usageLabels: {
        currentTotal: "Total actual",
        platformAccess: "Acceso a la plataforma",
        usageThisPeriod: "Uso en este periodo",
      },
      usedOfCap: "{{used}} usados de un tope de {{cap}}",
    },
    dialogs: {
      connect: {
        apiKeyLabel: "Clave API",
        connect: "Conectar",
        connecting: "Conectando...",
        description:
          "La clave se envia por HTTPS y se guarda en la configuracion de tu espacio de trabajo. Puedes desconectarla en cualquier momento.",
        title: "Conectar {{integration}}",
      },
      invite: {
        email: "Email",
        name: "Nombre",
        role: "Rol",
      },
      revokeKeyWarning:
        "Cualquier servicio que use esta clave perdera acceso de inmediato y necesitara un reemplazo antes de que la integracion pueda recuperarse.",
      twoFactorDescription:
        "Escanea el codigo QR en tu app autenticadora, confirma el codigo de seis digitos y guarda los codigos de respaldo en un lugar seguro.",
      twoFactorQrPlaceholder: "Marcador QR del autenticador",
    },
    accountDialog: {
      accessPolicy: "Politica de acceso",
      currentAccountNotice: "Esta es la cuenta actualmente iniciada.",
      currentDescription:
        "Actualiza el email y la contrasena de tu cuenta. El rol y los controles de acceso siguen gobernados por admin.",
      email: "Email",
      lockedNotice:
        "Solo otro admin activo puede cambiar el rol, el estado o los permisos de setup, data-ops y reportes de esta cuenta.",
      manageDescription:
        "Actualiza la identidad, la contrasena y la configuracion de acceso de este miembro del equipo.",
      name: "Nombre",
      newPassword: "Nueva contrasena",
      passwordHint: "Deja esto vacio para mantener la contrasena actual.",
      resetPassword: "Restablecer contrasena",
      statusActive: "Activo",
      statusInvited: "Invitado",
      status: "Estado",
    },
    errors: {
      accountUpdateFailed: "No se pudo actualizar la cuenta",
      apiKeyRevokeFailed: "No se pudo revocar la clave API",
      backupCardRemoveFailed: "No se pudo eliminar la tarjeta de respaldo",
      integrationConnectFailed: "No se pudo conectar la integracion",
      integrationDisconnectFailed: "No se pudo desconectar",
      inviteFailed: "No se pudo enviar la invitacion",
      notificationsSaveFailed: "No se pudieron guardar las notificaciones",
      paymentMethodBackupFailed:
        "No se pudo guardar la tarjeta de respaldo",
      paymentMethodPrimaryFailed:
        "No se pudo guardar la tarjeta del negocio",
      preferencesSaveFailed: "No se pudieron guardar las preferencias",
      profileSaveFailed: "No se pudo guardar el perfil",
      requestFailed: "No se pudo completar la solicitud.",
      sessionRevokeFailed: "No se pudo revocar la sesion",
      usageCapSaveFailed: "No se pudo guardar el tope de uso",
      validCardNumber: "Ingresa el numero de tarjeta.",
      validCardholderName: "Ingresa el nombre del titular.",
      validDollarAmount: "Ingresa un monto valido.",
      validDollarAmountNonNegative:
        "Ingresa un monto valido que no sea negativo.",
      validDollarAmountPrecision:
        "Ingresa un monto valido con hasta dos decimales.",
      validExpirationMonth: "Ingresa un mes de vencimiento valido.",
      validExpirationYear: "Ingresa un ano de vencimiento valido.",
      validSecurityCode: "Ingresa el codigo de seguridad.",
      websiteDetailsSaveFailed: "No se pudieron guardar los datos del sitio",
    },
    integrations: {
      descriptions: {
        gmailApInbox:
          "Adjuntos PDF de facturas a traves del reenviador del buzon de AP.",
        quickBooksOnline:
          "Sync de P&L, gastos y plan de cuentas via OAuth.",
        serviceTitan:
          "Reportes de trabajo, facturas y bitacoras de tecnicos via API.",
        xero: "El conector contable todavia no esta habilitado.",
      },
      status: {
        available: "Disponible",
        connected: "Conectado",
        failures: "{{count}} fallas",
        notConnected: "Sin conectar",
      },
    },
    labels: {
      breadcrumbs: ["Panel", "Configuracion"],
      description:
        "Administra tu organizacion, equipo, integraciones y preferencias de seguridad.",
      dialogs: {
        inviteDescription:
          "Invita a un companero al espacio de trabajo actual.",
        inviteTitle: "Invitar miembro del equipo",
        revokeDescription:
          "Revocar esta clave bloquea de inmediato el acceso programatico que depende de ella.",
        revokeTitle: "Revocar clave API?",
        twoFactorDescription:
          "Agrega un segundo factor antes de permitir acciones de cuenta de alto riesgo.",
        twoFactorTitle: "Configurar autenticacion de dos factores",
      },
      title: "Configuracion",
    },
    options: {
      goals: [
        "Mejorar la visibilidad del flujo de caja",
        "Aumentar el margen por trabajo",
        "Reducir costos indirectos",
        "Reducir tiempo dedicado a reportes",
        "Bajar el costo por trabajo",
      ],
      industry: [
        "HVAC / Field service",
        "Plomeria",
        "Electricidad",
        "Paisajismo",
        "Techos",
        "Otro...",
      ],
      invoiceCycle: ["Semanal", "Quincenal", "Mensual", "Por trabajo"],
      inviteRoles: ["Admin", "Operador", "Analista", "Viewer"],
      revenueModel: ["Por trabajo", "Suscripcion", "Mixto"],
      teamSize: [
        "1-4 personas",
        "5-10 personas",
        "11-25 personas",
        "26-50 personas",
        "51+ personas",
      ],
    },
    placeholders: {
      apiKey: "Pega aqui tu clave API",
      cardholderName: "Broward HVAC Co.",
      email: "jamie@browardhvac.com",
      name: "Jamie Reynolds",
    },
    permissions: {
      connectSources: "Conectar fuentes y cargas aprobadas",
      expandScope: "Ampliar el alcance de fuentes o procesamiento de IA",
      manageUsers: "Administrar usuarios y visibilidad de reportes",
      reviewParseIssues: "Revisar problemas de parseo y colas de ingestion",
      runAnalyses: "Ejecutar analisis aprobados y exploracion de datos",
      viewDashboards: "Ver paneles y briefs semanales",
    },
    preferenceItems: {
      compactDashboardDensity: {
        description:
          "Muestra mas tarjetas de cola y senales en una sola pantalla de escritorio.",
        title: "Densidad compacta del panel",
      },
      evidenceFirstRecommendationView: {
        description:
          "Abre las tarjetas de recomendacion con las citas expandidas por defecto.",
        title: "Vista de recomendaciones primero con evidencia",
      },
      experimentalPackDrafts: {
        description:
          "Muestra tipos de decision packs en borrador antes de que esten totalmente listos para produccion.",
        title: "Borradores experimentales de packs",
      },
      retainUploadedSourceFiles: {
        description:
          "Conserva las cargas crudas en almacenamiento para que los operadores puedan descargar el documento original despues.",
        title: "Conservar archivos fuente cargados",
      },
    },
    roles: {
      admin: "Admin",
      analyst: "Analista",
      operator: "Operador",
      viewer: "Viewer",
    },
    securityRows: {
      changePassword: {
        actionLabel: "Cambiar contrasena",
        title: "Email y contrasena",
      },
      singleSignOn: {
        actionLabel: "Configurar SSO",
        description: "Disponible en planes superiores para equipos mas grandes.",
        title: "Inicio de sesion unico",
      },
      twoFactor: {
        actionLabel: "Activar 2FA",
        description:
          "Protege la cuenta con un segundo paso de verificacion.",
        setupUnavailable:
          "El traspaso para configurar dos factores todavia no esta implementado.",
        title: "Autenticacion de dos factores",
      },
    },
    tabs: {
      billing: "Facturacion",
      myAccount: "Mi cuenta",
      peopleAccess: "Personas y acceso",
      sourcesOperations: "Fuentes y operaciones",
      workspace: "Espacio de trabajo",
    },
    team: {
      accessBucketsLabel: "Bloques de acceso",
      accessSummaries: {
        pending: "Acceso pendiente",
        reports: "Reportes",
        setupOps: "Setup, Ops",
        setupOpsReports: "Setup, Ops, Reportes",
      },
      manage: "Administrar",
      manageAccount: "Administrar cuenta",
      membersCount: "{{count}} miembros",
      myAccount: "Mi cuenta",
      permissionHeaders: {
        admin: "Admin",
        analyst: "Analista",
        operator: "Operador",
        permission: "Permiso",
        viewer: "Viewer",
      },
      signedInSummary: "Sesion iniciada como {{name}} ({{role}}).",
    },
    accessPolicy: {
      operationsDescription:
        "Puede revisar colas de ingestion, problemas de parseo y operaciones de archivos.",
      operationsTitle: "Acceso de operaciones",
      reportDescription:
        "Puede ver dashboards, briefs y salidas aprobadas de insights.",
      reportTitle: "Acceso a reportes",
      setupDescription:
        "Puede conectar fuentes aprobadas y alcance de ingestion.",
      setupTitle: "Acceso de setup",
    },
    websiteDetails: {
      fields: {
        mainPhone: "Telefono principal",
        partnershipsEmail: "Email de alianzas",
        pressEmail: "Email de prensa",
        salesEmail: "Email de ventas",
        supportEmail: "Email de soporte",
        supportPhone: "Telefono de soporte",
      },
    },
    formLabels: {
      businessName: "Nombre del negocio",
      goals: "Objetivos (todos los que apliquen)",
      industry: "Industria",
      invoiceCycle: "Ciclo de facturacion",
      primaryLocation: "Ubicacion principal",
      revenueModel: "Modelo de ingresos",
      teamSize: "Tamano del equipo",
    },
  },
  uploadModal: {
    acceptsDescription:
      "Acepta archivos CSV y XLSX. CSV puede ser de hasta 5 MB y XLSX de hasta 20 MB.",
    bestResultsHeading: "Mejores resultados en esta via",
    bestResultsTipOne: "Sube una exportacion por archivo.",
    bestResultsTipThree:
      "Usa columnas separadas para fechas, montos e identificadores.",
    bestResultsTipTwo: "Mantene la fila de encabezados al inicio de la hoja.",
    cancel: "Cancelar",
    csvRule: "CSV hasta 5 MB",
    documentIdLabel: "ID del documento",
    done: "Listo",
    duplicateDescription:
      "Este archivo ya estaba en el espacio de trabajo, asi que se reutilizo el registro existente.",
    duplicateDialogDescription:
      "Carga completa. Relacionamos este archivo con la copia que ya estaba en tu espacio de trabajo.",
    duplicateNotice: "Ya estaba subido - se uso el registro existente.",
    duplicateTag: "Se reutilizo el registro existente",
    errorHelp: "Elige otro archivo o vuelve a intentarlo.",
    errorTitle: "No pudimos terminar esa carga",
    familyConfidenceLabel: "Confianza del reconocimiento",
    familyPendingBadge: "Tipo todavia en revision",
    familyPendingDescription:
      "El archivo ya esta guardado, pero el tipo de documento todavia no quedo definido. Pipeline seguira avanzandolo.",
    familyRecognizedDescription: "Reconocimos este archivo como {{family}}.",
    familyUnrecognizedDescription:
      "El archivo se importo bien, pero todavia no coincide con un tipo de documento con nombre.",
    factsFoundLabel: "{{count}} hechos encontrados",
    fileQueuedDescription: "Carga completa. Ya estamos revisando el archivo.",
    fileTooLargeDescription:
      "Los archivos {{format}} pueden ser de hasta {{maxSize}} en esta via de carga.",
    fileTypeFallback: "tipo desconocido",
    importReadoutHeading: "Resumen de importacion",
    manualQueueTag: "Cola manual de revision",
    needsDifferentFileTag: "Necesita otro archivo",
    nextStepLabel: "Siguiente paso",
    pathOverviewDescription:
      "Los archivos en esta via se guardan, se revisan y luego se preparan para revisarlos en Explorer o Pipeline.",
    pathOverviewTitle: "Que hace esta via de carga",
    processingNextSteps:
      "Revisa el Pipeline para ver el progreso y Explorer cuando el archivo este listo.",
    processingDialogDescription:
      "Carga completa. Tu archivo ya esta en el espacio de trabajo y todavia se esta preparando.",
    readyDialogDescription:
      "Carga completa. Tu archivo esta listo para revisar.",
    readyToSendTag: "Listo para subir",
    recognizedTypesDescription:
      "Este importador puede reconocer exportaciones limpias del negocio y llevarlas a la experiencia de revision correcta.",
    recognizedTypesHeading: "Tipos de documento reconocidos",
    sourceNotRetainedTag: "Solo metadatos",
    sourceRetainedTag: "Guardado para descargar",
    stepPreparedDuplicate:
      "Encontramos la copia existente y vinculamos esta carga con ese registro.",
    stepPreparedProcessing:
      "El archivo ya esta en el espacio de trabajo y seguira avanzando en Pipeline.",
    stepPreparedReady: "El archivo esta listo para revisar en Explorer.",
    stepPreparedReceived:
      "El archivo ya esta en el espacio de trabajo y listo para el siguiente paso.",
    tabularRouteTag: "Ruta tabular de revision",
    textRouteTag: "Ruta de revision de texto",
    title: "Subir archivos",
    upload: "Subir",
    uploadFailed: "La carga fallo.",
    uploadingHint:
      "Esto puede tardar un poco mas con archivos grandes. Deja esta ventana abierta mientras terminamos de revisarlo.",
    uploadPrompt: "Suelta un archivo aqui o haz clic para buscar",
    uploading: "Subiendo...",
    uploadTypes: "CSV - XLSX - hasta 20 MB",
    uploadedBadge: "OK",
    unsupportedFileDescription:
      "Elige un archivo CSV o XLSX para esta via de carga.",
    validationHint:
      "Elige un archivo que cumpla las reglas anteriores y luego subelo cuando quieras.",
    validationRecoveryHelp:
      "Elige un archivo diferente y luego vuelve a intentarlo.",
    validationTitle: "Este archivo necesita atencion",
    xlsxRule: "XLSX hasta 20 MB",
  },
};

const defaultUiMessagesByLocale = {
  "es-ES": defaultUiMessagesEs,
  "es-MX": defaultUiMessagesEs,
  "en-GB": normalizedDefaultUiMessagesEnUs,
  "en-US": normalizedDefaultUiMessagesEnUs,
} satisfies Record<SupportedUiLocale, UiMessages>;

export const defaultUiTranslationBundles = Object.fromEntries(
  supportedUiLocales.map((locale) => [
    locale.code,
    defaultUiMessagesByLocale[locale.code],
  ]),
) as Record<SupportedUiLocale, UiMessages>;

export function getDefaultUiMessages(locale?: string | null) {
  return defaultUiTranslationBundles[resolveUiLocale(locale)];
}
