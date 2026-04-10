import type { CatalogContent } from "@/features/catalog/constants/catalog-content.shared";

export const catalogContentEsEs: CatalogContent = {
  header: {
    actions: [
      { label: "Ruta del catalogo", variant: "secondary" },
      { label: "Bloques programables", variant: "primary" },
    ],
    breadcrumbs: ["App", "Catalogo de componentes"],
    description:
      "Inventario reutilizable de componentes extraido de los mocks actuales. Esta ruta aloja bloques guiados por props en lugar de paginas completas.",
    title: "Catalogo de componentes de PulseOps",
  },
  inventory: {
    rows: [
      { family: "Marketing", id: "inventory-hero", name: "MarketingHero", notes: "Bloque hero con pila de CTA y franja de estadisticas.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-problem", name: "ProblemCard", notes: "Las tarjetas de dolor, vertical y confianza comparten esta estructura.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-workflow", name: "WorkflowStepCard", notes: "Se usa para flujos de como funciona y onboarding.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-question", name: "QuestionCard", notes: "Grid de preguntas del decision pack y prompts de resultado.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-pricing", name: "PricingCard", notes: "Tarjeta de plan para precios publicos y comparaciones.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-testimonial", name: "TestimonialCard", notes: "Bloque de prueba social para citas y casos.", sourcePages: ["design/index.html", "design/blog.html"] },
      { family: "Marketing", id: "inventory-cta", name: "CallToActionBanner", notes: "Bloque final de conversion para landing y anuncios.", sourcePages: ["design/index.html"] },
      { family: "Workspace", id: "inventory-header", name: "WorkspaceHeader", notes: "Cabecera de ruta con breadcrumbs y acciones.", sourcePages: ["design/app-dashboard.html", "design/app-explorer.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-filter", name: "FilterChip", notes: "Pills de alcance para dashboard, explorer, ask y packs.", sourcePages: ["design/app-dashboard.html", "design/app-explorer.html", "design/app-ask.html"] },
      { family: "Workspace", id: "inventory-metric", name: "MetricTile", notes: "Tile KPI para dashboards y resumenes del decision pack.", sourcePages: ["design/app-dashboard.html", "design/app-decision-packs.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-activity", name: "ActivityFeedItem", notes: "Evento operativo con etiqueta, hora y accion.", sourcePages: ["design/app-dashboard.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-queue", name: "DecisionQueueCard", notes: "Tarjeta de revision operativa para merges, fallos y aprobaciones.", sourcePages: ["design/app-dashboard.html"] },
      { family: "Workspace", id: "inventory-signal", name: "SignalCard", notes: "Tile indicador de salud del negocio e impacto.", sourcePages: ["design/app-dashboard.html", "design/app-decision-packs.html"] },
      { family: "Workspace", id: "inventory-pack", name: "PackListItem", notes: "Fila de packs con estado, conteos y marcador.", sourcePages: ["design/app-decision-packs.html"] },
      { family: "Workspace", id: "inventory-rec", name: "RecommendationCard", notes: "Recomendacion priorizada con confianza y citas.", sourcePages: ["design/app-decision-packs.html"] },
      { family: "Datos", id: "inventory-table", name: "CatalogTable", notes: "Host generico para inventario y filas del explorer.", sourcePages: ["design/app-explorer.html", "design/app-decision-packs.html"] },
      { family: "Datos", id: "inventory-conversation", name: "ConversationBubble", notes: "Burbuja del hilo ask para usuario y asistente.", sourcePages: ["design/app-ask.html"] },
      { family: "Datos", id: "inventory-citation", name: "CitationList", notes: "Chips de fuente usados para procedencia entre features.", sourcePages: ["design/app-ask.html", "design/app-decision-packs.html", "design/app-explorer.html"] },
      { family: "Ajustes", id: "inventory-field", name: "FieldGroup", notes: "Wrapper de label e hint para formularios de ajustes.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-text", name: "TextField", notes: "Superficie de texto para campos de org, politicas y seguridad.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-segmented", name: "SegmentedControl", notes: "Selector segmentado para tema, alcance y modo.", sourcePages: ["design/app-settings.html", "design/app-dashboard.html"] },
      { family: "Ajustes", id: "inventory-toggle", name: "ToggleRow", notes: "Fila de preferencia para notificaciones y seguridad.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-preference", name: "PreferencePanel", notes: "Shell de panel para grupos de ajustes.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-team", name: "TeamMemberRow", notes: "Fila de miembros para roles, invitaciones y usuarios activos.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-actions", name: "SettingsActionRow", notes: "Fila de acciones principal y secundaria para footers.", sourcePages: ["design/app-settings.html"] },
      { family: "Ajustes", id: "inventory-dialog", name: "DialogFrame", notes: "Shell modal para invitacion, 2FA y confirmaciones.", sourcePages: ["design/app-settings.html"] },
    ],
    section: {
      description: "Cada fila relaciona un bloque reutilizable con las paginas mock de las que fue derivado.",
      eyebrow: "Inventario",
      title: "Inventario actual de componentes",
    },
    table: {
      ariaLabel: "Inventario de componentes",
      componentHeader: "Componente",
      intentHeader: "Objetivo del catalogo",
      sourceHeader: "Fuentes de diseno",
    },
  },
  marketing: {
    cta: {
      description:
        "Esto sigue siendo una vista del catalogo, no un flujo de conversion real. El objetivo es fijar la superficie reutilizable antes de componer paginas.",
      primaryAction: "Usar en futuras landing pages",
      secondaryAction: "Mantener el foco en el brief MVP",
      title: "Las superficies CTA tambien estan catalogadas como bloques reutilizables.",
    },
    hero: {
      actions: [
        { label: "Empieza gratis - sin tarjeta", variant: "primary" },
        { label: "Ver como funciona", variant: "secondary" },
      ],
      description:
        "PulseOps convierte datos dispersos del negocio en un brief operativo con citas, confianza y una lista clara de acciones semanales.",
      eyebrow: "Inteligencia de caja y margen",
      footerNote: "Fuentes: Fed Small Business Credit Survey e informes SMB de Intuit",
      stats: [
        { detail: "de pequenas empresas tienen facturas pendientes", value: "56%" },
        { detail: "cuenta por cobrar media por negocio", value: "17,5 mil USD" },
        { detail: "citan la inflacion de costes como riesgo principal", value: "75%" },
        { detail: "reto: predecir el margen por trabajo", value: "#1" },
      ],
      titleLines: ["Dirige un negocio de servicios con", "hechos en vez de intuicion."],
    },
    pricingCards: [
      {
        ctaLabel: "Iniciar prueba",
        description: "Para negocios de servicios liderados por el owner y centrados en caja y margen semanal.",
        name: "Brief de caja y margen",
        points: ["Un negocio y hasta cuatro fuentes", "Brief semanal de caja y margen", "Seguimiento de facturas y cuentas por cobrar"],
        price: "$149",
        priceSuffix: "/mes",
      },
      {
        ctaLabel: "Iniciar prueba",
        description: "Para operadores en crecimiento que quieren mas monitoreo e intervencion.",
        featured: true,
        featuredLabel: "Mas elegido",
        name: "Pack operativo completo",
        points: ["Snapshots diarios y brief semanal", "Seguimiento de cuadrillas y rentabilidad por trabajo", "Alertas por excepcion"],
        price: "$299",
        priceSuffix: "/mes",
      },
      {
        ctaLabel: "Contactar ventas",
        description: "Para operadores multi sede que necesitan rollups y benchmarking.",
        name: "Multi sede",
        points: ["Ubicaciones ilimitadas", "Benchmarking entre sitios", "Soporte para conectores custom"],
        price: "Custom",
        priceSuffix: "pricing",
      },
    ],
    problemCards: [
      { description: "Los presupuestos se mantienen planos mientras mano de obra y materiales cambian. La perdida de margen solo aparece al final.", icon: "$", title: "Trabajos mal valorados" },
      { description: "La caja ya se gano, pero nadie persigue las facturas que ahora financian el capital de trabajo del cliente.", icon: "#", title: "Facturas sin dueno" },
      { description: "Pequenos sobrecostes se acumulan en silencio entre cuadrillas, proveedores y tipos de trabajo.", icon: "%", title: "Fuga de margen" },
      { description: "Cobros y pagos van en relojes distintos, y eso crea presion de caja evitable.", icon: "!", title: "Latigazo de caja" },
    ],
    questions: {
      badgeLabel: "Preguntas del brief semanal",
      description:
        "Estas tarjetas se estructuran alrededor de las seis preguntas operativas que el producto debe responder cada semana.",
      items: [
        { description: "Compara margen estimado versus real y marca los tipos de trabajo que fallan el objetivo.", icon: "$", title: "Que trabajos estan mal valorados?" },
        { description: "Ordena el seguimiento de facturas segun dias vencidos y dolares en riesgo.", icon: "#", title: "Que facturas necesitan accion hoy?" },
        { description: "Muestra los cambios de mayor impacto para actuar primero cuando el tiempo es limitado.", icon: ">", title: "Que merece atencion primero?" },
      ],
      title: "Tarjetas de preguntas orientadas a decisiones",
    },
    section: {
      description: "Bloques del sitio publico compartidos entre la home y las paginas de marketing.",
      eyebrow: "Marketing",
      title: "Bloques del sitio publico",
    },
    testimonials: [
      { company: "HVAC - 14 tecnicos", initials: "MR", name: "Marcus R.", quote: "PulseOps mostro que linea de servicio perdia dinero cuando sumamos desplazamiento y callbacks. Eso nos permitio corregir precios sin intuicion." },
      { company: "Plomeria - 9 empleados", initials: "DV", name: "Diana V.", quote: "El primer brief me dio una lista de llamadas para facturas vencidas. Cobramos una parte relevante del saldo esa misma semana." },
      { company: "Paisajismo - 2 cuadrillas", initials: "TB", name: "Tariq B.", quote: "Aislamos el problema de margen a un patron de estimacion y no a una cuadrilla, y eso cambio por completo la solucion." },
    ],
    workflowSteps: [
      { description: "Empieza con uploads y sistemas existentes en lugar de pedir al operador que vuelva a cargar datos.", step: "1", title: "Conectar o subir" },
      { description: "Normaliza archivos en una sola vista operativa tipada con procedencia explicita.", step: "2", title: "Construir una vista canonica" },
      { description: "Marca que cambio, por que cambio y que tan confiable es el sistema.", step: "3", title: "Explicar cada recomendacion" },
      { description: "Entrega un brief del lunes en lugar de esperar que el usuario vigile dashboards toda la semana.", step: "4", title: "Enviar el brief semanal" },
    ],
  },
  pageSummary: {
    badgeLabel: "Resultado de revision de diseno",
    description:
      "El catalogo cubre estructuras repetidas del sitio publico y de los mocks internos: heroes, precios, KPI, colas, recomendaciones, chips de procedencia, tablas del explorer, burbujas de ask, campos de ajustes y marcos de dialogo.",
    metrics: [
      { detail: "de 7 paginas mock distintas", label: "Bloques catalogados", tone: "success", trend: "21 piezas reutilizables", value: "21" },
      { detail: "marketing, workspace, datos y ajustes", label: "Familias de componentes", tone: "info", trend: "4 areas agrupadas", value: "4" },
      { detail: "cada ejemplo acepta datos por props", label: "Modo de ensamblaje", tone: "warning", trend: "Sin paginas construidas", value: "Solo catalogo" },
      { detail: "recomendaciones y respuestas mantienen visible la fuente", label: "Superficies de confianza", tone: "danger", trend: "Las citas siguen primero", value: "Integrado" },
    ],
    sectionLinks: [
      { href: "#inventory", label: "Inventario" },
      { href: "#marketing", label: "Marketing" },
      { href: "#workspace", label: "Workspace" },
      { href: "#data", label: "Datos y confianza" },
      { href: "#controls", label: "Ajustes y dialogos" },
    ],
    title: "Las paginas todavia no se estan construyendo. La app ahora tiene un catalogo de piezas reutilizables.",
  },
  settings: {
    dialog: {
      actions: { cancel: "Cancelar", continue: "Continuar" },
      description: "Un shell modal extraido del mock de ajustes para flujos de invitacion, seguridad y confirmacion.",
      manualCodeLabel: "Codigo manual",
      manualCodeValue: "JBSW Y3DP EHPK 3PXP",
      qrLabel: "QR",
      recoveryCodes: ["8f2k-mn94", "t7qp-38xc", "w2ra-91bz", "6mds-44yt"],
      recoveryCodesLabel: "Codigos de recuperacion",
      stepLabel: "Configuracion 2FA",
      title: "Configurar autenticacion de dos factores",
      verificationCodeHint: "Usa el codigo de seis digitos de tu app autenticadora.",
      verificationCodeLabel: "Codigo de verificacion",
      verificationCodeValue: "000000",
    },
    panel: {
      actions: { primaryLabel: "Guardar cambios", secondaryLabel: "Cancelar" },
      description:
        "Este panel demuestra como la pagina de ajustes puede ensamblarse desde un pequeno kit de controles en lugar de un archivo grande.",
      organizationField: {
        hint: "Se usa para ajustar el primer brief y sus benchmarks.",
        label: "Nombre de la organizacion",
        value: "Broward HVAC Co.",
      },
      team: {
        badgeLabel: "4 miembros",
        description: "Primitivas simples de lista para owners, admins, operadores e invitaciones.",
        members: [
          { accessSummary: "Setup, Ops, Reports", email: "jamie@browardhvac.com", name: "Jamie R.", role: "Owner", status: "active", statusLabel: "Activo" },
          { accessSummary: "Setup, Ops, Reports", email: "dana@browardhvac.com", name: "Dana M.", role: "Admin", status: "active", statusLabel: "Activo" },
          { accessSummary: "Reports", email: "ops@browardhvac.com", name: "Usuario invitado", role: "Viewer", status: "invited", statusLabel: "Invitado" },
        ],
        title: "Filas de miembros del equipo",
      },
      themeField: {
        label: "Preferencia de tema",
        options: ["Oscuro", "Claro", "Sistema"],
      },
      title: "Preferencias del workspace",
      toggles: [
        { description: "Email inmediato cuando un fallo de parseo bloquea el camino del brief.", enabled: true, title: "Notificar fallos criticos de parseo" },
        { description: "Enviar la lista semanal de recomendaciones rankeadas cada lunes por la manana.", enabled: true, title: "Enviar el brief semanal de caja y margen" },
        { description: "Permitir extracciones de baja confianza visibles pero fuera de la salida del pack.", title: "Mostrar registros de baja confianza en explorer" },
      ],
      verticalField: {
        label: "Industria principal",
        value: "HVAC",
      },
    },
    section: {
      description: "Superficies de control extraidas del mock de ajustes.",
      eyebrow: "Ajustes",
      title: "Superficies de ajustes y dialogos",
    },
  },
  workspace: {
    activity: {
      badgeLabel: "Stream mock en vivo",
      items: [
        { action: "Revisar", detail: "Parseado, clasificado y puesto en cola para extraccion", label: "Importacion", time: "hace 14 min", title: "47 facturas importadas desde Gmail / AP inbox", tone: "info" },
        { action: "Inspeccionar", detail: "El layout no soportado necesita actualizacion de parser o revision manual", label: "Fallo", time: "hace 14 min", title: "3 facturas PDF fallaron en el parseo de layout", tone: "danger" },
        { action: "Aprobar", detail: "Equipment Rental y Subcontract Labor esperan aprobacion del operador", label: "IA", time: "hace 1 h", title: "2 categorias nuevas de proveedor detectadas automaticamente", tone: "warning" },
        { action: "Abrir pack", detail: "8 recomendaciones generadas y 3 marcadas como alta prioridad", label: "Pack", time: "hace 6 h", title: "Brief de caja y margen completado para Broward HVAC Co.", tone: "accent" },
      ],
      title: "Actividad del pipeline",
    },
    filterKit: {
      chips: ["Ultimos 7 dias", "Solo facturas", "ServiceTitan", "Requiere revision"],
      description: "Los chips de filtro se comparten entre dashboard, explorer, ask y packs.",
      eyebrow: "Kit de filtros y navegacion",
    },
    metrics: [
      { detail: "entre uploads y fuentes conectadas", label: "Archivos recibidos", tone: "success", trend: "+8 frente a ayer", value: "52" },
      { detail: "ligeramente por debajo de ayer por cambios de layout de factura", label: "Exito de parseo", tone: "danger", trend: "-1,1 pts", value: "94,2%" },
      { detail: "la salida de decision sigue sobre el umbral 0,85 del brief", label: "Confianza media", tone: "success", trend: "+0,03", value: "0,87" },
      { detail: "retenido antes de escribir downstream o entrar al pack", label: "Pendiente de revision", tone: "warning", trend: "7 items", value: "7" },
    ],
    packs: {
      badgeLabel: "7 total",
      items: [
        { accent: "accent", meta: "52 registros y 5 recomendaciones", periodLabel: "Semana del 14 abr 2026", status: "ready", statusLabel: "Listo", title: "Brief de caja y margen" },
        { accent: "info", meta: "31 registros y 3 recomendaciones", periodLabel: "Semana del 14 abr 2026", status: "ready", statusLabel: "Listo", title: "Capacidad y utilizacion" },
        { accent: "warning", meta: "18 registros y 2 recomendaciones", periodLabel: "Semana del 14 abr 2026", status: "draft", statusLabel: "Borrador", title: "Piezas y proveedor" },
      ],
      title: "Lista de decision packs",
    },
    queue: {
      badgeLabel: "5 items",
      items: [
        { actions: ["Fusionar", "Mantener separados"], context: "Aparece en 14 facturas por un total de $33,400", priority: "danger", priorityLabel: "Alta prioridad", title: "HVAC Parts Ltd y HVAC Parts LLC parecen ser el mismo proveedor", typeLabel: "Merge de proveedor" },
        { actions: ["Aprobar", "Renombrar", "Descartar"], context: "Detectado en 6 reportes esta semana", priority: "warning", priorityLabel: "Requiere revision", title: "Aprobar un nuevo bucket de coste para Equipment Rental", typeLabel: "Revision de bucket" },
        { actions: ["Mapear ahora", "Omitir"], context: "Office supplies y vehicle maintenance no estan mapeados", priority: "info", priorityLabel: "Informativo", title: "Dos cuentas de QuickBooks necesitan asignacion", typeLabel: "Mapeo de cuenta" },
      ],
      title: "Cola del operador",
    },
    recommendations: [
      { actions: ["Aceptar", "Descartar"], citations: ["AP_Invoice_Cooltek_0419.pdf", "AP_Invoice_ThermoFlux_0412.pdf", "QBO_PL_Mar2026.xlsx"], confidence: 0.91, priority: "danger", priorityLabel: "Urgente", summary: "Tres facturas ya estan vencidas y representan $14,800 en caja cobrable. Empieza por el saldo mas antiguo y mas alto.", title: "Perseguir facturas vencidas antes del viernes" },
      { actions: ["Aceptar", "Ahora no"], citations: ["Job_Report_Week17_Batch.csv", "AP_Invoice_Cooltek_0419.pdf"], confidence: 0.86, priority: "warning", priorityLabel: "Vigilar", summary: "Cuatro trabajos fallaron el objetivo de margen porque el coste de piezas subio sobre la estimacion. Revisa el precio del tipo de trabajo afectado.", title: "Reajustar trabajos que fallan el objetivo de margen" },
    ],
    section: {
      description: "Componentes operativos de dashboard, pipeline, decision packs y colas.",
      eyebrow: "Workspace",
      title: "Bloques de la app autenticada",
    },
    signals: [
      { detail: "12 facturas y 38 dias de retraso medio", label: "Facturas vencidas", tone: "danger", value: "$42,800" },
      { detail: "brecha media de margen de $380 por trabajo", label: "Trabajos mal valorados", tone: "warning", value: "3 trabajos" },
      { detail: "por encima del mes pasado y en maximo de 3 meses", label: "Tendencia de margen", tone: "success", value: "+2,1%" },
      { detail: "tasa de aceptacion en los ultimos 30 dias", label: "Aceptacion de recomendaciones", tone: "info", value: "71%" },
    ],
  },
  data: {
    ask: {
      assistantAvatarLabel: "PO",
      assistantLeadLabel: "Basado en",
      assistantMessage: "Tres facturas estan vencidas al 19 abr 2026. Total pendiente:",
      citations: ["AP_Invoice_ThermoFlux_0412.pdf", "AP_Invoice_SkyAir_0408.pdf", "AP_Invoice_Cooltek_0419.pdf"],
      filters: ["Todos los datos", "Esta semana", "Solo facturas"],
      overdueItems: [
        { label: "11 dias vencida", name: "AP_Invoice_ThermoFlux_0412", tone: "danger" },
        { label: "7 dias vencida", name: "AP_Invoice_SkyAir_0408", tone: "warning" },
        { label: "5 dias vencida", name: "AP_Invoice_Cooltek_0419", tone: "warning" },
      ],
      title: "Vista del hilo ask",
      totalOutstanding: "$14,800",
      userAvatarLabel: "JR",
      userQuestion: "Que facturas estan vencidas a dia de hoy?",
    },
    records: [
      { confidence: 0.94, id: "record-1", name: "AP_Invoice_Cooltek_0419.pdf", source: "Gmail / AP inbox", statusLabel: "Extraido", statusTone: "success", typeLabel: "Factura", typeTone: "neutral" },
      { confidence: 0.97, id: "record-2", name: "Job_Report_Week17_Batch.csv", source: "ServiceTitan", statusLabel: "Extraido", statusTone: "success", typeLabel: "Reporte de trabajo", typeTone: "info" },
      { confidence: 0.72, id: "record-3", name: "Supplier_Receipt_Airpro_0418.pdf", source: "Gmail / AP inbox", statusLabel: "Requiere revision", statusTone: "warning", typeLabel: "Recibo", typeTone: "neutral" },
      { confidence: null, id: "record-4", name: "Invoice_Brightside_0412.pdf", source: "Gmail / AP inbox", statusLabel: "Parseo fallido", statusTone: "danger", typeLabel: "Factura", typeTone: "neutral" },
    ],
    section: {
      description: "Bloques con evidencia primero compartidos entre explorer, ask y recomendaciones.",
      eyebrow: "Datos y confianza",
      title: "Bloques de explorer y procedencia",
    },
    table: {
      ariaLabel: "Vista de explorer",
      classHeader: "Clase",
      confidenceHeader: "Confianza",
      description: "La misma tabla generica puede alojar vistas de inventario y vistas previas de registros parseados.",
      documentHeader: "Documento",
      statusHeader: "Estado",
      title: "Vista previa de tabla explorer",
    },
  },
};
