export type PipelineAlert = Readonly<{
  actionLabel?: string;
  description: string;
  dismissLabel?: string;
  title: string;
  tone: "danger" | "warning";
}>;

export type PipelineFocus = Readonly<{
  description: string;
  tone: "danger" | "info" | "success" | "warning";
  title: string;
}>;

export type PipelinePlaybookStep = Readonly<{
  description: string;
  id: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
}>;

export type PipelinePlaybook = Readonly<{
  description: string;
  steps: readonly PipelinePlaybookStep[];
  title: string;
}>;

export type PipelineFilter = Readonly<{
  active: boolean;
  count: number;
  id: "all" | "attention" | "intake" | "ready" | "review";
  label: string;
  queryValue?: string;
}>;

export type PipelineStage = Readonly<{
  count: string;
  description: string;
  id: string;
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
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

export type PipelineRunStep = Readonly<{
  label: string;
  state: "complete" | "current" | "upcoming";
}>;

export type PipelineRun = Readonly<{
  confidenceLabel: string;
  detail: string;
  documentType: string;
  durationLabel: string;
  fileName: string;
  id: string;
  nextStepLabel: string;
  outcomeLabel: string;
  outcomeTone: "danger" | "info" | "success" | "warning";
  recordsLabel: string;
  sourceLabel: string;
  steps: readonly PipelineRunStep[];
  timeLabel: string;
}>;

export type PipelinePageData = Readonly<{
  alert: PipelineAlert | null;
  filters: readonly PipelineFilter[];
  focus: PipelineFocus;
  playbook: PipelinePlaybook;
  rules: readonly PipelineRule[];
  runs: readonly PipelineRun[];
  sources: readonly PipelineSource[];
  stages: readonly PipelineStage[];
  stats: readonly PipelineStat[];
}>;

export const pipelinePageLabels = {
  actions: {
    primary: "Upload file",
    secondary: "Show blocked files",
  },
  breadcrumbs: ["App", "Pipeline"],
  description:
    "See what is coming in, what is blocked, and what is ready to feed facts and the weekly brief.",
  sectionDescriptions: {
    rules:
      "Each document type follows a clear path so operators know what can be reviewed, cited, and used downstream.",
    runs: "Recent files are shown in plain language so it is obvious what just happened and what should happen next.",
    sources:
      "This workspace starts with manual uploads. Add more intake paths only when they are active and reliable.",
    stages:
      "The pipeline moves from intake to handoff readiness. These counts show where work is piling up before downstream review starts.",
  },
  sectionTitles: {
    rules: "Processing rules",
    runs: "Recent file progress",
    sources: "Intake paths",
    stages: "How files move",
  },
  title: "Data pipeline",
} as const;

export const fallbackPipelinePageData: PipelinePageData = {
  alert: {
    actionLabel: "Show blocked files",
    description:
      "weekly_cash_margin_alert.pdf, weekly_cash_margin_alert_2.pdf, and upload-invalid-175828127081.xlsx stopped before facts could be prepared.",
    dismissLabel: "Dismiss",
    title: "3 files need attention before they can move forward.",
    tone: "warning",
  },
  filters: [
    { active: true, count: 60, id: "all", label: "All files" },
    {
      active: false,
      count: 3,
      id: "attention",
      label: "Needs attention",
      queryValue: "failed",
    },
    {
      active: false,
      count: 1,
      id: "intake",
      label: "In intake",
      queryValue: "uploaded,stored",
    },
    {
      active: false,
      count: 4,
      id: "review",
      label: "Ready for review",
      queryValue: "parsed,classified",
    },
    {
      active: false,
      count: 52,
      id: "ready",
      label: "Facts ready",
      queryValue: "extracted",
    },
  ],
  focus: {
    description:
      "Three files are blocked, one more is still moving through intake, and four are waiting for a quick review before their facts can be trusted downstream.",
    title: "The pipeline needs a quick operator pass right now.",
    tone: "warning",
  },
  playbook: {
    description:
      "Use Pipeline to keep files moving, clear anything blocked, and confirm when a file is ready to leave intake.",
    steps: [
      {
        description:
          "Three files are blocked right now. Fix these first so nothing questionable moves downstream.",
        id: "playbook_blocked",
        label: "1. Clear blocked files",
        tone: "danger",
      },
      {
        description:
          "One file is still in intake checks. Wait here until the structure and routing pass cleanly.",
        id: "playbook_intake",
        label: "2. Let intake finish",
        tone: "warning",
      },
      {
        description:
          "Four files are ready to leave Pipeline and move into fact review. Fifty-two are already fact-ready.",
        id: "playbook_handoff",
        label: "3. Hand off clean files",
        tone: "success",
      },
    ],
    title: "Pipeline owns intake and readiness.",
  },
  rules: [
    {
      id: "rule_customer_invoice",
      briefEnabled: true,
      detailFields: [
        { label: "Accepted format", value: "CSV / XLSX" },
        {
          label: "Review path",
          value:
            "Operator checks amounts, dates, and customer details after the file leaves Pipeline",
        },
        {
          label: "Feeds",
          value: "Cash collection, margin, and weekly brief recommendations",
        },
      ],
      documentType: "Customer invoice",
      llmEnabled: true,
      policyLabel: "Upload -> check structure -> review details -> facts ready",
      sourceLabel: "Manual uploads",
      sqlEnabled: true,
      vectorEnabled: true,
    },
    {
      id: "rule_vendor_bill",
      briefEnabled: true,
      detailFields: [
        { label: "Accepted format", value: "CSV / XLSX" },
        {
          label: "Review path",
          value:
            "Operator confirms vendor, amount, and service period before facts are used",
        },
        { label: "Feeds", value: "Payables timing and margin leakage checks" },
      ],
      documentType: "Vendor bill",
      llmEnabled: true,
      policyLabel:
        "Upload -> classify -> review supporting details -> facts ready",
      sourceLabel: "Manual uploads",
      sqlEnabled: true,
      vectorEnabled: true,
    },
    {
      id: "rule_job_cost_report",
      briefEnabled: true,
      detailFields: [
        { label: "Accepted format", value: "CSV / XLSX" },
        {
          label: "Review path",
          value:
            "Operator checks labor, parts, and job identifiers before pack use",
        },
        {
          label: "Feeds",
          value: "Underpriced job detection and weekly cash and margin brief",
        },
      ],
      documentType: "Job cost report",
      llmEnabled: true,
      policyLabel:
        "Upload -> parse columns -> review key fields -> facts ready",
      sourceLabel: "Manual uploads",
      sqlEnabled: true,
      vectorEnabled: false,
    },
  ],
  runs: [
    {
      confidenceLabel: "--",
      detail:
        "The file was received, but the structure did not match what we expected, so facts were not created.",
      documentType: "Customer invoice",
      durationLabel: "8.1s",
      fileName: "weekly_cash_margin_alert.pdf",
      id: "run_upload_blocked_1",
      nextStepLabel:
        "Next: inspect the file in Pipeline and upload a corrected version if needed.",
      outcomeLabel: "Needs attention",
      outcomeTone: "danger",
      recordsLabel: "1 file",
      sourceLabel: "Manual uploads",
      steps: [
        { label: "Received", state: "complete" },
        { label: "Checked", state: "current" },
        { label: "Review", state: "upcoming" },
        { label: "Facts ready", state: "upcoming" },
      ],
      timeLabel: "10:35 AM",
    },
    {
      confidenceLabel: "0.91",
      detail:
        "The structure and document family look right. A reviewer should confirm the key fields before these facts feed decisions.",
      documentType: "Vendor bill",
      durationLabel: "2.4s",
      fileName: "northwind_vendor_bill_april.xlsx",
      id: "run_upload_review_1",
      nextStepLabel:
        "Next: hand this file off for fact review so the visible details can be confirmed.",
      outcomeLabel: "Ready for review",
      outcomeTone: "warning",
      recordsLabel: "1 file",
      sourceLabel: "Manual uploads",
      steps: [
        { label: "Received", state: "complete" },
        { label: "Checked", state: "complete" },
        { label: "Review", state: "current" },
        { label: "Facts ready", state: "upcoming" },
      ],
      timeLabel: "10:12 AM",
    },
    {
      confidenceLabel: "0.94",
      detail:
        "This file has cleared pipeline checks and is ready to support downstream review and the weekly brief.",
      documentType: "Job cost report",
      durationLabel: "1.2s",
      fileName: "job_cost_report_week_15.csv",
      id: "run_upload_ready_1",
      nextStepLabel:
        "Next: use this file in downstream review or let it feed the weekly brief.",
      outcomeLabel: "Facts ready",
      outcomeTone: "success",
      recordsLabel: "1 file",
      sourceLabel: "Manual uploads",
      steps: [
        { label: "Received", state: "complete" },
        { label: "Checked", state: "complete" },
        { label: "Review", state: "complete" },
        { label: "Facts ready", state: "current" },
      ],
      timeLabel: "9:41 AM",
    },
  ],
  sources: [
    {
      id: "source_upload",
      actionLabel: "Upload",
      detailRows: [
        { label: "Last upload", value: "10:35 AM" },
        { label: "This week", value: "60 files" },
      ],
      healthLabel: "Active",
      healthTone: "success",
      subtitle: "Manual CSV / XLSX intake for the first field-service MVP workflow",
      title: "Manual uploads",
      typeChips: ["Customer invoice", "Vendor bill", "Job cost report"],
    },
  ],
  stages: [
    {
      count: "1",
      description:
        "Files that have arrived and are still moving through intake checks.",
      id: "stage_intake",
      label: "In intake",
      tone: "info",
    },
    {
      count: "4",
      description:
        "Files that have finished intake and are ready to leave Pipeline for fact review.",
      id: "stage_review",
      label: "Ready for review",
      tone: "warning",
    },
    {
      count: "52",
      description:
        "Files already cleared for downstream review, cited facts, and the weekly brief.",
      id: "stage_ready",
      label: "Facts ready",
      tone: "success",
    },
    {
      count: "3",
      description:
        "Files that stopped and need attention before they can move forward.",
      id: "stage_attention",
      label: "Needs attention",
      tone: "danger",
    },
  ],
  stats: [
    {
      detail: "Files currently visible on this pipeline surface.",
      label: "Files in scope",
      value: "60",
    },
    {
      detail: "Blocked files should be fixed before anything moves downstream.",
      label: "Blocked now",
      value: "3",
    },
    {
      detail: "Files that already support downstream review and the weekly brief.",
      label: "Facts ready",
      value: "52",
    },
    {
      detail:
        "Average confidence across files that already reached review or better.",
      label: "Average confidence",
      value: "0.91",
    },
  ],
} as const;
