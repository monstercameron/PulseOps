export type PipelineAlert = Readonly<{
  actionLabel?: string;
  description: string;
  dismissLabel?: string;
  title: string;
  tone: "danger" | "warning";
}>;

export type PipelineStat = Readonly<{
  detail: string;
  label: string;
  value: string;
}>;

export type PipelineSource = Readonly<{
  actionLabel: string;
  detailRows: readonly {
    label: string;
    value: string;
  }[];
  healthLabel: string;
  healthTone: "danger" | "success" | "warning";
  id: string;
  subtitle: string;
  title: string;
  typeChips: readonly string[];
}>;

export type PipelineRule = Readonly<{
  briefEnabled: boolean;
  detailFields: readonly {
    label: string;
    value: string;
  }[];
  documentType: string;
  id: string;
  llmEnabled: boolean;
  policyLabel: string;
  sourceLabel: string;
  sqlEnabled: boolean;
  vectorEnabled: boolean;
}>;

export type PipelineRun = Readonly<{
  confidenceLabel: string;
  documentType: string;
  durationLabel: string;
  id: string;
  outcomeLabel: string;
  outcomeTone: "danger" | "success" | "warning";
  recordsLabel: string;
  sourceLabel: string;
  timeLabel: string;
}>;

export type PipelinePageData = Readonly<{
  alert: PipelineAlert | null;
  rules: readonly PipelineRule[];
  runs: readonly PipelineRun[];
  sources: readonly PipelineSource[];
  stats: readonly PipelineStat[];
}>;

export const pipelinePageLabels = {
  actions: {
    primary: "Test pipeline",
    secondary: "Upload file",
  },
  breadcrumbs: ["App", "Pipeline"],
  description:
    "Monitor data sources, control how each document type is processed, and track what feeds the weekly brief.",
  sectionDescriptions: {
    rules:
      "Each rule controls how far a document travels: extraction, SQL storage, vector retrieval, and brief eligibility.",
    runs: "Every document processed today. Warnings indicate partial runs or failures that need review.",
    sources:
      "Where data enters the system. Each source syncs independently and produces one or more document types.",
  },
  sectionTitles: {
    rules: "Pipeline rules",
    runs: "Recent pipeline activity",
    sources: "Connected sources",
  },
  title: "Data pipeline",
} as const;

export const fallbackPipelinePageData: PipelinePageData = {
  alert: {
    actionLabel: "View failed records",
    description:
      "Three invoice PDFs failed in the last 14 minutes after a probable vendor layout change.",
    dismissLabel: "Dismiss",
    title: "Gmail / AP inbox needs attention.",
    tone: "warning",
  },
  rules: [
    {
      id: "rule_invoice_pdf",
      briefEnabled: true,
      detailFields: [
        { label: "Parse engine", value: "Auto-detect v3" },
        { label: "Extraction contract", value: "invoice-v2.json" },
        { label: "Redaction", value: "PII stripped before model use" },
        { label: "Human review", value: "Not required" },
        { label: "Retention", value: "90 days post-cancellation" },
        { label: "Feeds brief", value: "Cash and margin" },
      ],
      documentType: "Invoice PDF",
      llmEnabled: true,
      policyLabel: "Parse -> classify -> extract facts",
      sourceLabel: "Gmail / AP",
      sqlEnabled: true,
      vectorEnabled: true,
    },
    {
      id: "rule_vendor_receipt",
      briefEnabled: false,
      detailFields: [
        { label: "Parse engine", value: "Auto-detect v3" },
        { label: "LLM access", value: "Blocked after classification" },
        { label: "Human review", value: "Not required" },
      ],
      documentType: "Vendor receipt",
      llmEnabled: false,
      policyLabel: "Parse -> classify",
      sourceLabel: "Gmail / AP",
      sqlEnabled: false,
      vectorEnabled: false,
    },
    {
      id: "rule_job_report",
      briefEnabled: true,
      detailFields: [
        { label: "Parse engine", value: "Structured tabular parser" },
        { label: "Extraction contract", value: "job-report-v1.json" },
        { label: "Human review", value: "Not required" },
        { label: "Feeds brief", value: "Capacity and cash" },
      ],
      documentType: "Job report",
      llmEnabled: true,
      policyLabel: "Full pipeline -> feeds brief",
      sourceLabel: "ServiceTitan",
      sqlEnabled: true,
      vectorEnabled: false,
    },
    {
      id: "rule_profit_loss",
      briefEnabled: true,
      detailFields: [
        { label: "Parse engine", value: "Accounting parser" },
        { label: "LLM access", value: "Blocked - SQL only" },
        { label: "Redaction", value: "Full PII redaction" },
        { label: "Feeds brief", value: "Cash and margin" },
      ],
      documentType: "P&L / Expense",
      llmEnabled: false,
      policyLabel: "Parse -> extract -> SQL only",
      sourceLabel: "QuickBooks",
      sqlEnabled: true,
      vectorEnabled: false,
    },
  ],
  runs: [
    {
      id: "run_servicetitan_jobs",
      confidenceLabel: "0.93",
      documentType: "Job report",
      durationLabel: "1.2s",
      outcomeLabel: "OK",
      outcomeTone: "success",
      recordsLabel: "7",
      sourceLabel: "ServiceTitan",
      timeLabel: "9:41 AM",
    },
    {
      id: "run_qbo_expense",
      confidenceLabel: "0.91",
      documentType: "P&L / Expense",
      durationLabel: "3.4s",
      outcomeLabel: "OK",
      outcomeTone: "success",
      recordsLabel: "34",
      sourceLabel: "QuickBooks",
      timeLabel: "9:27 AM",
    },
    {
      id: "run_email_invoice",
      confidenceLabel: "0.61",
      documentType: "Invoice PDF",
      durationLabel: "8.1s",
      outcomeLabel: "Partial",
      outcomeTone: "warning",
      recordsLabel: "6 (3 failed)",
      sourceLabel: "Gmail / AP",
      timeLabel: "9:14 AM",
    },
  ],
  sources: [
    {
      id: "source_servicetitan",
      actionLabel: "Configure",
      detailRows: [
        { label: "Last sync", value: "8 min ago" },
        { label: "Today", value: "19 records" },
      ],
      healthLabel: "Connected",
      healthTone: "success",
      subtitle: "Job management - API - every 15 minutes",
      title: "ServiceTitan",
      typeChips: ["Job report", "Invoice", "Tech log"],
    },
    {
      id: "source_quickbooks",
      actionLabel: "Configure",
      detailRows: [
        { label: "Last sync", value: "22 min ago" },
        { label: "Today", value: "34 accounts" },
      ],
      healthLabel: "Connected",
      healthTone: "success",
      subtitle: "Accounting - OAuth - every 30 minutes",
      title: "QuickBooks Online",
      typeChips: ["P&L", "Invoice", "Expense"],
    },
    {
      id: "source_gmail",
      actionLabel: "Investigate",
      detailRows: [
        { label: "Last sync", value: "14 min ago - 3 failed" },
        { label: "Today", value: "47 messages" },
      ],
      healthLabel: "Needs review",
      healthTone: "warning",
      subtitle: "Email intake - invoice attachments and vendor receipts",
      title: "Gmail / AP inbox",
      typeChips: ["Invoice PDF", "Vendor receipt"],
    },
    {
      id: "source_uploads",
      actionLabel: "Upload",
      detailRows: [
        { label: "Last upload", value: "2 hours ago" },
        { label: "This week", value: "6 files" },
      ],
      healthLabel: "Manual review",
      healthTone: "success",
      subtitle: "CSV / XLSX review queue before extraction",
      title: "Manual uploads",
      typeChips: ["Spreadsheet", "XLSX export"],
    },
  ],
  stats: [
    { label: "Sources", value: "4", detail: "3 healthy and 1 needs attention" },
    { label: "Records today", value: "847", detail: "Across all sources and types" },
    { label: "Pipeline runs", value: "23", detail: "20 OK and 3 warnings" },
    { label: "Average confidence", value: "0.87", detail: "Above the working threshold" },
  ],
} as const;
