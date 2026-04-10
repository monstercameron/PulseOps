type PackPreviewTone = "danger" | "info" | "success" | "warning";
type PackRecommendationPriority = PackPreviewTone;
type PackStatusTone = "success" | "warning";

type PackPreviewMetricInput = Readonly<{
  detail: string;
  label: string;
  tone: PackPreviewTone;
  value: string;
}>;

type PackPreviewRecommendationInput = Readonly<{
  citations: readonly string[];
  confidence: number;
  priority: PackRecommendationPriority;
  summary: string;
  title: string;
}>;

type PackPreviewSourceInput = Readonly<{
  confidenceLabel: string;
}>;

type PackPreviewInput = Readonly<{
  metrics: readonly PackPreviewMetricInput[];
  recommendations: readonly PackPreviewRecommendationInput[];
  sourceData: readonly PackPreviewSourceInput[];
  statusTone: PackStatusTone;
  title: string;
}>;

export type PackConcept = Readonly<{
  description: string;
  id: string;
  label: string;
  tone: PackPreviewTone;
}>;

export type PackOverviewStat = Readonly<{
  detail: string;
  label: string;
  tone: PackPreviewTone;
  value: string;
}>;

export type PackPreviewContent = Readonly<{
  concepts: readonly PackConcept[];
  listSummary: string;
  nextStepLabel: string;
  overviewStats: readonly PackOverviewStat[];
  previewSummary: string;
}>;

export function buildPackPreviewContent(
  input: PackPreviewInput,
): PackPreviewContent {
  const concepts = inferPackConcepts(input);
  const recommendationCount = input.recommendations.length;
  const evidenceReferenceCount = countUniqueCitations(input.recommendations);
  const sourceCount = input.sourceData.length;
  const averageConfidence = getAverageConfidence(input);

  return {
    concepts,
    listSummary: buildListSummary(input, concepts),
    nextStepLabel: buildNextStepLabel(input),
    overviewStats: [
      {
        detail:
          recommendationCount > 0
            ? "Actions currently surfaced in this analysis preview."
            : "Recommendations are still being assembled for this concept.",
        label: "Recommendations",
        tone:
          recommendationCount === 0
            ? "warning"
            : input.statusTone === "success"
              ? "success"
              : "info",
        value: String(recommendationCount),
      },
      {
        detail:
          evidenceReferenceCount > 0
            ? "Unique evidence references backing the current preview."
            : "Evidence references are still thin for this concept.",
        label: "Evidence refs",
        tone: evidenceReferenceCount > 0 ? "info" : "warning",
        value: String(evidenceReferenceCount),
      },
      {
        detail:
          sourceCount > 0
            ? "Files currently contributing to this pack."
            : "No source files are attached to this preview yet.",
        label: "Source files",
        tone: sourceCount > 0 ? "success" : "warning",
        value: String(sourceCount),
      },
      {
        detail:
          averageConfidence === "--"
            ? "Confidence will appear once sources or recommendations are available."
            : "Average confidence across the evidence behind this preview.",
        label: "Average confidence",
        tone: getConfidenceTone(averageConfidence),
        value: averageConfidence,
      },
    ],
    previewSummary: buildPreviewSummary(input),
  };
}

function inferPackConcepts(input: PackPreviewInput): readonly PackConcept[] {
  const normalizedTitle = input.title.toLowerCase();

  if (normalizedTitle.includes("cash") && normalizedTitle.includes("margin")) {
    return [
      {
        description: "How quickly open invoices and receivables should turn into cash this week.",
        id: "concept_cash_collection",
        label: "Cash collection",
        tone: "danger",
      },
      {
        description: "Where jobs or cost variance are dragging gross margin below target.",
        id: "concept_margin_leakage",
        label: "Margin leakage",
        tone: "warning",
      },
      {
        description: "Which vendor or parts patterns are adding pressure to weekly margin.",
        id: "concept_supplier_spend",
        label: "Supplier spend",
        tone: "info",
      },
    ];
  }

  if (normalizedTitle.includes("capacity") || normalizedTitle.includes("utilization")) {
    return [
      {
        description: "Crew load and utilization pressure across the current schedule.",
        id: "concept_crew_load",
        label: "Crew load",
        tone: "warning",
      },
      {
        description: "How likely scheduling delays become if demand stays at the current pace.",
        id: "concept_schedule_risk",
        label: "Schedule risk",
        tone: "danger",
      },
      {
        description: "Whether staffing coverage needs to change before work starts slipping.",
        id: "concept_coverage_options",
        label: "Coverage options",
        tone: "info",
      },
    ];
  }

  if (normalizedTitle.includes("parts") || normalizedTitle.includes("supplier")) {
    return [
      {
        description: "Where vendor concentration is creating pricing or dependency risk.",
        id: "concept_vendor_concentration",
        label: "Vendor concentration",
        tone: "warning",
      },
      {
        description: "Which part categories look expensive enough to justify procurement changes.",
        id: "concept_parts_pricing",
        label: "Parts pricing",
        tone: "danger",
      },
      {
        description: "How much leverage exists before the next purchasing cycle closes.",
        id: "concept_procurement_leverage",
        label: "Procurement leverage",
        tone: "info",
      },
    ];
  }

  return input.metrics.slice(0, 3).map((metric, index) => ({
    description: metric.detail,
    id: `concept_metric_${index}`,
    label: metric.label,
    tone: metric.tone,
  }));
}

function buildListSummary(
  input: PackPreviewInput,
  concepts: readonly PackConcept[],
) {
  if (concepts.length > 0) {
    return concepts.map((concept) => concept.label).join(", ");
  }

  if (input.recommendations.length > 0) {
    return input.recommendations
      .slice(0, 3)
      .map((recommendation) => recommendation.title)
      .join(", ");
  }

  return "Previewing grouped business analysis.";
}

function buildPreviewSummary(input: PackPreviewInput) {
  const normalizedTitle = input.title.toLowerCase();

  if (normalizedTitle.includes("cash") && normalizedTitle.includes("margin")) {
    return input.statusTone === "success"
      ? "This preview groups cash movement, margin leakage, and receivable pressure into one weekly operator story."
      : "This preview is still assembling the weekly story across cash movement, margin leakage, and receivable pressure.";
  }

  if (normalizedTitle.includes("capacity") || normalizedTitle.includes("utilization")) {
    return input.statusTone === "success"
      ? "This preview groups crew load, schedule pressure, and staffing risk so the next operating decision is easy to compare."
      : "This preview is still grouping crew load, schedule pressure, and staffing risk before it is ready to share.";
  }

  if (normalizedTitle.includes("parts") || normalizedTitle.includes("supplier")) {
    return input.statusTone === "success"
      ? "This preview groups vendor concentration, parts pricing, and procurement leverage before supplier actions are taken."
      : "This preview is still grouping vendor concentration, parts pricing, and procurement leverage before recommendations are ready.";
  }

  return input.statusTone === "success"
    ? "This preview groups related business signals into one short decision surface."
    : "This preview is still grouping related business signals before it is ready to share.";
}

function buildNextStepLabel(input: PackPreviewInput) {
  const normalizedTitle = input.title.toLowerCase();

  if (input.statusTone === "warning" && input.recommendations.length === 0) {
    return "Hold this preview as draft until the grouped analysis has clear recommendations and evidence coverage.";
  }

  if (normalizedTitle.includes("cash") && normalizedTitle.includes("margin")) {
    return "Start with the highest-severity cash or margin action, then use the rest of the preview as supporting context.";
  }

  if (normalizedTitle.includes("capacity") || normalizedTitle.includes("utilization")) {
    return "Use this preview to decide whether the next move is staffing, scheduling, or workload smoothing.";
  }

  if (normalizedTitle.includes("parts") || normalizedTitle.includes("supplier")) {
    return "Use this preview to decide whether supplier leverage is strong enough to justify a procurement change.";
  }

  return "Use the top recommendation first, then review the evidence and supporting metrics before acting.";
}

function countUniqueCitations(
  recommendations: readonly PackPreviewRecommendationInput[],
) {
  return new Set(
    recommendations.flatMap((recommendation) => recommendation.citations),
  ).size;
}

function getAverageConfidence(input: PackPreviewInput) {
  const recommendationConfidences = input.recommendations.map(
    (recommendation) => recommendation.confidence,
  );

  if (recommendationConfidences.length > 0) {
    return (
      recommendationConfidences.reduce(
        (total, confidence) => total + confidence,
        0,
      ) / recommendationConfidences.length
    ).toFixed(2);
  }

  const sourceConfidences = input.sourceData
    .map((record) => Number.parseFloat(record.confidenceLabel))
    .filter((value) => Number.isFinite(value));

  if (sourceConfidences.length === 0) {
    return "--";
  }

  return (
    sourceConfidences.reduce((total, confidence) => total + confidence, 0) /
    sourceConfidences.length
  ).toFixed(2);
}

function getConfidenceTone(
  value: string,
): PackPreviewTone {
  if (value === "--") {
    return "warning";
  }

  const numericValue = Number.parseFloat(value);

  if (numericValue >= 0.9) {
    return "success";
  }

  if (numericValue >= 0.8) {
    return "info";
  }

  return "warning";
}
