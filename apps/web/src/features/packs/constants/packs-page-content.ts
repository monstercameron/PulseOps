export type PackMetric = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
  value: string;
}>;

export type PackRecommendation = Readonly<{
  actions: readonly string[];
  citations: readonly string[];
  confidence: number;
  id: string;
  priority: "danger" | "info" | "success" | "warning";
  priorityLabel: string;
  summary: string;
  title: string;
}>;

export type PackSourceRecord = Readonly<{
  classLabel: string;
  confidenceLabel: string;
  contributionLabel: string;
  id: string;
  name: string;
}>;

export type PackItem = Readonly<{
  accent: "accent" | "info" | "warning";
  generatedAtLabel: string;
  id: string;
  meta: readonly string[];
  metrics: readonly PackMetric[];
  recommendations: readonly PackRecommendation[];
  sourceData: readonly PackSourceRecord[];
  statusLabel: string;
  statusTone: "success" | "warning";
  title: string;
}>;

export type PacksPageData = Readonly<{
  filters: readonly {
    id: "all" | "draft" | "ready";
    label: string;
  }[];
  latestPackId?: string;
  packs: readonly PackItem[];
}>;

export const packsPageLabels = {
  breadcrumbs: ["Dashboard", "Decision Packs"],
  description: "Weekly briefs and recommendations grounded in ingested data.",
  title: "Decision Packs",
} as const;

export const fallbackPacksPageData: PacksPageData = {
  filters: [
    { id: "all", label: "All" },
    { id: "ready", label: "Ready" },
    { id: "draft", label: "Draft" },
  ],
  packs: [
    {
      accent: "accent",
      generatedAtLabel: "Generated Apr 19, 2026 at 6:14 AM",
      id: "pack_cash_margin_current",
      meta: ["Week of Apr 14, 2026", "5 recommendations", "Based on 52 records"],
      metrics: [
        {
          detail: "+12% versus last week",
          label: "Revenue this week",
          tone: "success",
          value: "$48,320",
        },
        {
          detail: "-2.1 points versus last week",
          label: "Gross margin",
          tone: "danger",
          value: "38.4%",
        },
        {
          detail: "Three invoices past due",
          label: "Outstanding A/R",
          tone: "danger",
          value: "$14,800",
        },
        {
          detail: "+4 versus last week",
          label: "Jobs completed",
          tone: "success",
          value: "23",
        },
      ],
      recommendations: [
        {
          id: "pack_rec_1",
          actions: ["Accept", "Dismiss"],
          citations: [
            "AP_Invoice_Cooltek_0419.pdf",
            "AP_Invoice_ThermoFlux_0412.pdf",
            "AP_Invoice_SkyAir_0408.pdf",
          ],
          confidence: 0.91,
          priority: "danger",
          priorityLabel: "High",
          summary:
            "Three overdue invoices now represent the largest concentration of open receivables. Escalate ThermoFlux to a phone call and push payment reminders today.",
          title: "Chase three overdue invoices worth $14,800.",
        },
        {
          id: "pack_rec_2",
          actions: ["Accept", "Dismiss"],
          citations: ["Job_Report_Week17_Batch.csv", "AP_Invoice_Cooltek_0419.pdf"],
          confidence: 0.86,
          priority: "warning",
          priorityLabel: "Medium",
          summary:
            "Four jobs came in below the stated margin target, primarily because parts cost variance ran above estimate.",
          title: "Review four jobs priced below target margin.",
        },
        {
          id: "pack_rec_3",
          actions: ["Accept", "Dismiss"],
          citations: ["AP_Invoice_Cooltek_0419.pdf", "QBO_Expenses_Apr2026.xlsx"],
          confidence: 0.78,
          priority: "info",
          priorityLabel: "Opportunity",
          summary:
            "Cooltek Supply has been the largest parts vendor for six consecutive weeks and likely qualifies for improved pricing tiers.",
          title: "Renegotiate Cooltek supplier pricing.",
        },
      ],
      sourceData: [
        {
          id: "source_job_report",
          classLabel: "Job report",
          confidenceLabel: "0.97",
          contributionLabel: "Revenue, margins, utilization",
          name: "Job_Report_Week17_Batch.csv",
        },
        {
          id: "source_profit_loss",
          classLabel: "P&L",
          confidenceLabel: "0.89",
          contributionLabel: "Cash, runway, expense baseline",
          name: "QBO_PL_Mar2026.xlsx",
        },
        {
          id: "source_invoice",
          classLabel: "Invoice",
          confidenceLabel: "0.94",
          contributionLabel: "A/R and supplier spend",
          name: "AP_Invoice_Cooltek_0419.pdf",
        },
      ],
      statusLabel: "Ready",
      statusTone: "success",
      title: "Cash and Margin Brief",
    },
    {
      accent: "info",
      generatedAtLabel: "Generated Apr 19, 2026 at 6:12 AM",
      id: "pack_capacity_current",
      meta: ["Week of Apr 14, 2026", "3 recommendations", "Based on 31 records"],
      metrics: [
        {
          detail: "Crew load is above the target threshold",
          label: "Utilization",
          tone: "warning",
          value: "94%",
        },
        {
          detail: "Two weeks at the current pace",
          label: "Capacity risk",
          tone: "warning",
          value: "High",
        },
      ],
      recommendations: [
        {
          id: "capacity_rec_1",
          actions: ["Accept", "Dismiss"],
          citations: ["Job_Report_Week17_Batch.csv", "Job_Report_Week16_Batch.csv"],
          confidence: 0.93,
          priority: "success",
          priorityLabel: "Watch",
          summary:
            "Technician utilization is high enough that scheduling delays are likely if demand stays flat for two more weeks.",
          title: "Consider adding temporary capacity.",
        },
      ],
      sourceData: [],
      statusLabel: "Ready",
      statusTone: "success",
      title: "Capacity and Utilization",
    },
    {
      accent: "warning",
      generatedAtLabel: "Drafted Apr 19, 2026 at 6:08 AM",
      id: "pack_parts_supplier",
      meta: ["Week of Apr 14, 2026", "2 recommendations", "Based on 18 records"],
      metrics: [],
      recommendations: [],
      sourceData: [],
      statusLabel: "Draft",
      statusTone: "warning",
      title: "Parts and Supplier",
    },
  ],
} as const;
