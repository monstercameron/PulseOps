import fs from "node:fs";
import path from "node:path";

import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, "assets", "docs");
const reportPath = path.join(
  rootDir,
  ".codex-tmp",
  "extraction-prompt-optimization-report.json",
);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.BIZOPS_OPENAI_EXTRACTION_MODEL || "gpt-5-mini";
const promptRoundLimit = Math.max(
  1,
  Number(process.env.PROMPT_ROUND_LIMIT ?? "20"),
);

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required.");
}

const client = new OpenAI({ apiKey });

const observationSchema = z.object({
  canonicalFactTypeId: z.string().trim().min(1).nullable(),
  confidenceScore: z.number().finite().min(0).max(1),
  excerpt: z.string().trim().min(1).max(400).nullable(),
  key: z.string().trim().min(1),
  label: z.string().trim().min(1).max(160),
  locator: z.object({
    column: z.string().trim().min(1).nullable(),
    fieldPath: z.string().trim().min(1).nullable(),
    lineEnd: z.number().int().positive().nullable(),
    lineStart: z.number().int().positive().nullable(),
    page: z.number().int().positive().nullable(),
    reference: z.string().trim().min(1).nullable(),
    row: z.number().int().positive().nullable(),
    sheet: z.string().trim().min(1).nullable(),
  }),
  locatorType: z.enum([
    "cell",
    "row",
    "sheet",
    "page",
    "line-range",
    "table",
    "field",
    "object-path",
  ]),
  value: z.union([
    z.string().min(1),
    z.number().finite(),
    z.boolean(),
    z.array(z.string().min(1)).min(1),
  ]),
  valueType: z.enum(["text", "number", "boolean", "datetime", "list"]),
});

const extractionPlanSchema = z.object({
  documentFamily: z.string().trim().min(1),
  observations: z.array(observationSchema).max(16),
});

const assetDefinitions = [
  {
    expectedFacts: [
      fact(["rows parsed", "row count"], "number", 1000),
      fact(["total sales", "total revenue", "sales total"], "number", 322966.75),
      fact(["gross income", "total gross income"], "number", 15379.37),
      fact(["average rating", "avg rating", "rating"], "number", 6.9727, 0.05),
      fact(
        ["date range", "sales period", "period covered"],
        "date-range",
        { end: "2019-03-30", start: "2019-01-01" },
      ),
      fact(
        ["top branch by sales", "highest sales branch"],
        "text-number",
        { number: 110568.71, text: "C" },
      ),
      fact(
        ["top product line by sales", "highest sales product line"],
        "text-number",
        { number: 56144.84, text: "Food and beverages" },
      ),
    ],
    fileName: "supermarket_sales - Sheet1.csv",
    format: "csv",
    kind: "tabular",
  },
  {
    expectedFacts: [
      fact(["rows parsed", "row count"], "number", 100),
      fact(["total revenue", "revenue total"], "number", 137348768.31),
      fact(["total profit", "profit total"], "number", 44168198.4),
      fact(["total units sold", "units sold", "units total"], "number", 512871),
      fact(
        ["order date range", "date range", "period covered"],
        "date-range",
        { end: "2017-05-22", start: "2010-02-02" },
      ),
      fact(
        ["top region by revenue", "highest revenue region"],
        "text-number",
        { number: 39672031.43, text: "Sub-Saharan Africa" },
      ),
      fact(
        ["top item type by profit", "highest profit item type"],
        "text-number",
        { number: 14556048.66, text: "Cosmetics" },
      ),
    ],
    fileName: "10020Records.xlsx",
    format: "xlsx",
    kind: "tabular",
  },
  {
    expectedFacts: [
      fact(["document title", "title", "heading"], "text", "Weekly Cash And Margin Alert"),
      fact(["revenue collected this week", "weekly revenue collected"], "number", 184230),
      fact(["gross profit this week", "gross profit"], "number", 39445),
      fact(["gross margin this week", "gross margin"], "number", 21.4, 0.05),
      fact(["outstanding receivables over 30 days", "overdue receivables"], "number", 67800),
      fact(["vendor bills due within 7 days", "vendor bills due"], "number", 24960),
      fact(["payroll due", "payroll due on"], "date-number", { date: "2026-04-03", number: 31200 }),
      fact(["bank balance", "bank balance as of"], "date-number", { date: "2026-04-01", number: 52440 }),
      fact(["lowest margin job", "low margin job"], "text-number", { number: 8.2, text: "WO-2041" }),
      fact(["highest margin job", "high margin job"], "text-number", { number: 46.8, text: "WO-2057" }),
    ],
    fileName: "weekly_cash_margin_alert.pdf",
    format: "pdf",
    kind: "text",
  },
];

await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });

const assets = await Promise.all(assetDefinitions.map(loadAsset));
const results = [];

for (const round of Array.from({ length: promptRoundLimit }, (_, index) => index + 1)) {
  const variant = buildVariant(round);
  const startedAt = Date.now();
  console.log(`Running round ${round}: ${variant.name}`);
  const assetResults = [];

  for (const asset of assets) {
    const prompt = buildPrompt(asset, variant);
    const response = await client.responses.parse({
      instructions: prompt.instructions,
      input: prompt.input,
      model,
      store: false,
      text: {
        format: zodTextFormat(
          extractionPlanSchema,
          `bizops_prompt_optimization_round_${round}`,
        ),
      },
    });
    const plan = response.output_parsed;

    if (!plan) {
      throw new Error(`No parsed output for round ${round} and ${asset.fileName}.`);
    }

    assetResults.push(
      evaluate({
        asset,
        plan,
        promptInputLength: prompt.input.length,
        promptInstructionLength: prompt.instructions.length,
        usage: response.usage ?? null,
      }),
    );
  }

  const matchedFacts = assetResults.reduce((total, item) => total + item.matchedFacts, 0);
  const totalExpectedFacts = assetResults.reduce(
    (total, item) => total + item.expectedFacts,
    0,
  );
  const overallScore = round2(average(assetResults.map((item) => item.score)));

  results.push({
    assetResults,
    matchedFacts,
    name: variant.name,
    overallScore,
    round,
    roundDurationMs: Date.now() - startedAt,
    totalExpectedFacts,
    variant,
  });
  console.log(
    `Round ${round} score ${overallScore} with ${matchedFacts}/${totalExpectedFacts} matched facts.`,
  );
}

const rankedRounds = [...results].sort(
  (left, right) =>
    right.overallScore - left.overallScore || left.round - right.round,
);
const report = {
  generatedAt: new Date().toISOString(),
  model,
  rankedRounds: rankedRounds.map((item) => ({
    matchedFacts: item.matchedFacts,
    name: item.name,
    overallScore: item.overallScore,
    round: item.round,
    totalExpectedFacts: item.totalExpectedFacts,
  })),
  rounds: results,
};

await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      bestRound: rankedRounds[0],
      reportPath,
    },
    null,
    2,
  ),
);

function buildVariant(round) {
  return {
    includeAntiTrivia: round >= 5,
    includeBusinessExample: round === 11,
    includeBusinessPriorityMix: round >= 3,
    includeDocumentFraming: round >= 2,
    includeHeadingPriority: round >= 4 && round !== 17,
    includeKnownBusinessQuestions: round >= 9,
    includeNumericProfile: round >= 6,
    includeRankingProfile: round >= 8,
    includeRiskPriority: round >= 15,
    includeSelectionTemplate: round >= 20,
    includeTextPriority: round >= 7,
    includeTitleFieldHint: round >= 19,
    limitObservationsToHighValue: round >= 10,
    name: [
      "Baseline preview only",
      "Decision support framing",
      "KPI prioritization",
      "Heading and period emphasis",
      "Anti-trivia guardrails",
      "Numeric profile",
      "Numeric plus date profile",
      "Top contributor profile",
      "Operator question framing",
      "High-value cap",
      "Positive example",
      "Compact final-shape instructions",
      "Compact without example",
      "Compact and aggressive ranking",
      "Compact and alert-heavy",
      "Compact balanced",
      "Compact balanced without heading requirement",
      "Compact balanced with stronger heading",
      "Compact balanced with explicit title field",
      "Final combined candidate",
    ][round - 1],
    rankingMode:
      round >= 14 ? (round >= 16 ? "balanced" : "aggressive") : "light",
    useCompactFinalShape: round >= 12,
  };
}

function buildPrompt(asset, variant) {
  const instructions = buildInstructions(asset, variant);

  return {
    input:
      asset.kind === "tabular"
        ? buildTabularInput(asset, variant)
        : buildTextInput(asset, variant),
    instructions,
  };
}

function buildInstructions(asset, variant) {
  const lines = [
    "You extract operator-useful business facts from uploaded documents for a weekly cash and margin review system.",
    "Return strict JSON only.",
    "Do not hallucinate values or business context not explicitly present in the prompt.",
    "Each observation must include a stable key, a business-readable label, typed value, confidence score, and source locator.",
    "Use ISO 8601 date strings when possible.",
  ];

  if (variant.includeDocumentFraming) {
    lines.push(
      "Optimize for facts an owner or operator would act on: totals, margins, balances, due dates, volume, concentration, top contributors, and risk signals.",
    );
  }

  if (variant.includeBusinessPriorityMix) {
    lines.push(
      "Favor document-level KPIs and summaries over row-level trivia.",
    );
  }

  if (variant.includeHeadingPriority) {
    lines.push(
      "If the source exposes a title, heading, statement name, or reporting period, include it.",
    );
  }

  if (variant.includeAntiTrivia) {
    lines.push(
      "Do not spend observation slots on repeated dimension labels, isolated row identifiers, or vague labels like Metric 1.",
    );
  }

  if (variant.includeKnownBusinessQuestions) {
    lines.push(
      "Prefer facts that answer how much money is involved, what date range is covered, what is overdue or due soon, and what branch, product, region, or customer dominates the result.",
    );
  }

  if (variant.includeRiskPriority) {
    lines.push(
      "If the source contains overdue, due-soon, cash-risk, or low-margin facts, include at least one when supported.",
    );
  }

  if (variant.useCompactFinalShape) {
    lines.push(
      "Aim for a balanced set: title or period, core totals or margins, one or two rankings, and one risk or timing fact when supported.",
    );
  }

  if (variant.includeBusinessExample) {
    lines.push(
      asset.kind === "tabular"
        ? "Strong fact example: Total sales = 322966.75. Weak fact example: Branch = C."
        : "Strong fact example: Outstanding receivables over 30 days = 67800. Weak fact example: Recommended action = collect receivables.",
    );
  }

  if (variant.includeTitleFieldHint) {
    lines.push(
      "If you extract a title or heading, prefer labels like Document title, Heading, or Reporting period.",
    );
  }

  if (variant.includeSelectionTemplate) {
    lines.push(
      "Selection template: 1 title or period fact, 3 to 5 KPI facts, up to 2 concentration facts, and up to 2 risk or timing facts.",
    );
  }

  lines.push(
    variant.limitObservationsToHighValue
      ? "Return at most 12 observations."
      : "Return at most 16 observations.",
  );

  return lines.join(" ");
}

function buildTabularInput(asset, variant) {
  const sections = [
    `File name: ${asset.fileName}`,
    "Source kind: tabular business export.",
    "Use a specific supported family only when the evidence is strong; otherwise use generic-business-document.",
    "Tabular preview:",
    buildTabularPreview(asset.sheets),
  ];

  if (variant.includeNumericProfile || variant.includeRankingProfile || variant.includeTextPriority) {
    sections.push("Computed business summary:");
    sections.push(buildTabularBusinessProfile(asset.sheets, variant));
  }

  return sections.join("\n\n");
}

function buildTextInput(asset, variant) {
  const sections = [
    `File name: ${asset.fileName}`,
    "Source kind: parsed business document text.",
    "Use a specific supported family only when the evidence is strong; otherwise use generic-business-document.",
    "Text preview with line numbers:",
    buildTextPreview(asset.text),
  ];

  if (variant.includeTextPriority) {
    sections.push(
      "Prioritize explicit amounts, margins, due dates, balances, job identifiers tied to performance, and reporting headings.",
    );
  }

  return sections.join("\n\n");
}

function buildTabularPreview(sheets) {
  return sheets
    .map((sheet) =>
      [
        `Sheet: ${sheet.name}`,
        `Headers: ${sheet.headers.join(", ")}`,
        `Row count: ${sheet.rowCount}`,
        "Sample rows:",
        JSON.stringify(sheet.records.slice(0, 3), null, 2),
      ].join("\n"),
    )
    .join("\n\n");
}

function buildTextPreview(text) {
  return text
    .slice(0, 12000)
    .split("\n")
    .slice(0, 180)
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");
}

function buildTabularBusinessProfile(sheets, variant) {
  return sheets
    .map((sheet) => {
      const sections = [
        `Sheet summary: ${sheet.name}`,
        `Row count: ${sheet.rowCount}`,
        `Column count: ${sheet.columnCount}`,
      ];
      const numerics = inferNumericProfiles(sheet);
      const dates = inferDateProfiles(sheet);
      const rankings = variant.includeRankingProfile
        ? inferRankingProfiles(sheet, numerics)
        : [];

      if (variant.includeNumericProfile && numerics.length > 0) {
        sections.push("Numeric columns:");
        sections.push(
          ...numerics.map(
            (item) =>
              `- ${item.header}: sum=${item.sum} | avg=${item.avg} | min=${item.min} | max=${item.max}`,
          ),
        );
      }

      if (variant.includeTextPriority && dates.length > 0) {
        sections.push("Date columns:");
        sections.push(
          ...dates.map(
            (item) => `- ${item.header}: start=${item.start} | end=${item.end}`,
          ),
        );
      }

      if (variant.includeRankingProfile && rankings.length > 0) {
        sections.push("Top contributors:");
        sections.push(
          ...rankings.map(
            (item) =>
              `- ${item.dimension} by ${item.metric}: ${item.values
                .map((value) => `${value.key}=${value.value}`)
                .join("; ")}`,
          ),
        );
      }

      return sections.join("\n");
    })
    .join("\n\n");
}

function inferNumericProfiles(sheet) {
  return sheet.headers
    .map((header) => {
      const values = sheet.records
        .map((record) => parseLooseNumber(record[header]))
        .filter((value) => value !== null);

      if (values.length < Math.max(5, Math.floor(sheet.rowCount * 0.6))) {
        return null;
      }

      return {
        avg: round2(average(values)),
        header,
        max: round2(Math.max(...values)),
        min: round2(Math.min(...values)),
        sum: round2(values.reduce((total, value) => total + value, 0)),
      };
    })
    .filter(Boolean)
    .sort((left, right) => Math.abs(right.sum) - Math.abs(left.sum))
    .slice(0, 6);
}

function inferDateProfiles(sheet) {
  return sheet.headers
    .map((header) => {
      const values = sheet.records
        .map((record) => normalizeLooseDate(record[header]))
        .filter(Boolean)
        .sort();

      if (values.length < Math.max(5, Math.floor(sheet.rowCount * 0.6))) {
        return null;
      }

      return { end: values.at(-1), header, start: values[0] };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function inferRankingProfiles(sheet, numerics) {
  const dimensions = sheet.headers.filter((header) => {
    const distinctValues = new Set(
      sheet.records.map((record) => record[header]).filter(Boolean),
    );

    return distinctValues.size >= 2 && distinctValues.size <= 12;
  });
  const pairs = [];

  for (const dimension of dimensions) {
    for (const numeric of numerics.slice(0, 3)) {
      const totals = new Map();

      for (const record of sheet.records) {
        const key = record[dimension];
        const value = parseLooseNumber(record[numeric.header]);

        if (!key || value === null) {
          continue;
        }

        totals.set(key, (totals.get(key) || 0) + value);
      }

      const values = [...totals.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([key, value]) => ({ key, value: round2(value) }));

      if (values.length >= 2) {
        pairs.push({ dimension, metric: numeric.header, values });
      }
    }
  }

  return pairs.slice(0, 4);
}

async function loadAsset(definition) {
  const filePath = path.join(assetsDir, definition.fileName);
  const buffer = await fs.promises.readFile(filePath);

  if (definition.kind === "tabular") {
    return {
      ...definition,
      filePath,
      sheets:
        definition.format === "csv"
          ? [parseCsvSheet(buffer.toString("utf8"), "Sheet1")]
          : await parseXlsxSheets(buffer),
    };
  }

  return {
    ...definition,
    filePath,
    text: await parsePdfText(buffer),
  };
}

function parseCsvSheet(csvText, name) {
  const rows = parseCsv(csvText, {
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map(normalizeHeader);
  const records = dataRows
    .filter((row) => row.some((cell) => normalizeCellValue(cell).length > 0))
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, normalizeCellValue(row[index])]),
      ),
    );

  return {
    columnCount: headers.length,
    headers,
    name,
    records,
    rowCount: records.length,
  };
}

async function parseXlsxSheets(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  return workbook.worksheets
    .map((worksheet) => {
      const rows = worksheet
        .getSheetValues()
        .slice(1)
        .filter(Array.isArray)
        .map((row) => row.slice(1));

      if (rows.length === 0) {
        return null;
      }

      const [headerRow, ...dataRows] = rows;
      const headers = headerRow.map((cell) => normalizeHeader(normalizeCellValue(cell)));
      const records = dataRows
        .filter((row) => row.some((cell) => normalizeCellValue(cell).length > 0))
        .map((row) =>
          Object.fromEntries(
            headers.map((header, index) => [header, normalizeCellValue(row[index])]),
          ),
        );

      return {
        columnCount: headers.length,
        headers,
        name: worksheet.name,
        records,
        rowCount: records.length,
      };
    })
    .filter(Boolean);
}

async function parsePdfText(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdf = await loadingTask.promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (text.length > 0) {
      pageTexts.push(text);
    }
  }

  return normalizeParsedText(pageTexts.join("\n"));
}

function normalizeParsedText(text) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  if (!normalized) {
    throw new Error("Parsed text document is empty.");
  }

  return normalized;
}

function evaluate({ asset, plan, promptInputLength, promptInstructionLength, usage }) {
  let matchedFacts = 0;
  const matchedFactDetails = [];

  for (const expectedFact of asset.expectedFacts) {
    const matched = plan.observations.find((observation) =>
      matchesExpected(observation, expectedFact),
    );

    if (matched) {
      matchedFacts += 1;
      matchedFactDetails.push({
        expected: expectedFact.labelHints[0],
        matchedLabel: matched.label,
        value: matched.value,
      });
    }
  }

  const businessLabelHits = plan.observations.filter((observation) =>
    /(title|heading|period|revenue|sales|profit|margin|balance|receivable|vendor|payroll|top|highest|lowest|branch|city|product|region|date range|rows)/i.test(
      observation.label,
    ),
  ).length;
  const locatorsPresent = plan.observations.filter((observation) =>
    Object.values(observation.locator).some((value) => value !== null),
  ).length;
  const numericOrDateFacts = plan.observations.filter((observation) =>
    ["number", "datetime"].includes(observation.valueType),
  ).length;
  const score =
    (matchedFacts / asset.expectedFacts.length) * 70 +
    (businessLabelHits / Math.max(plan.observations.length, 1)) * 10 +
    (locatorsPresent / Math.max(plan.observations.length, 1)) * 10 +
    (numericOrDateFacts / Math.max(plan.observations.length, 1)) * 10;

  return {
    asset: asset.fileName,
    documentFamily: plan.documentFamily,
    expectedFacts: asset.expectedFacts.length,
    locatorsPresent,
    matchedFactDetails,
    matchedFacts,
    numericOrDateFacts,
    observationCount: plan.observations.length,
    sampleObservations: plan.observations.slice(0, 8).map((observation) => ({
      label: observation.label,
      value: observation.value,
      valueType: observation.valueType,
    })),
    promptInputLength,
    promptInstructionLength,
    score: round2(score),
    usage,
  };
}

function matchesExpected(observation, expectedFact) {
  const label = observation.label.trim().toLowerCase();
  const labelMatched = expectedFact.labelHints.some((hint) =>
    label.includes(hint.toLowerCase()),
  );

  if (!labelMatched) {
    return false;
  }

  if (expectedFact.type === "number") {
    return (
      typeof observation.value === "number" &&
      withinTolerance(observation.value, expectedFact.value, expectedFact.tolerance)
    );
  }

  if (expectedFact.type === "text") {
    return (
      typeof observation.value === "string" &&
      observation.value.toLowerCase().includes(String(expectedFact.value).toLowerCase())
    );
  }

  if (expectedFact.type === "date-range") {
    return (
      typeof observation.value === "string" &&
      observation.value.includes(expectedFact.value.start) &&
      observation.value.includes(expectedFact.value.end)
    );
  }

  if (expectedFact.type === "text-number") {
    return (
      String(observation.excerpt ?? observation.value)
        .toLowerCase()
        .includes(expectedFact.value.text.toLowerCase()) &&
      valueContainsNumber(observation, expectedFact.value.number, expectedFact.tolerance)
    );
  }

  if (expectedFact.type === "date-number") {
    return (
      String(observation.excerpt ?? observation.value).includes(expectedFact.value.date) &&
      valueContainsNumber(observation, expectedFact.value.number, expectedFact.tolerance)
    );
  }

  return false;
}

function valueContainsNumber(observation, expectedNumber, tolerance) {
  if (typeof observation.value === "number") {
    return withinTolerance(observation.value, expectedNumber, tolerance);
  }

  if (typeof observation.value === "string") {
    const candidates = observation.value.match(/-?\d[\d,.]*(?:\.\d+)?/g) ?? [];

    return candidates.some((candidate) =>
      withinTolerance(Number(candidate.replace(/,/g, "")), expectedNumber, tolerance),
    );
  }

  return false;
}

function parseLooseNumber(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(
    value.replace(/[,$%]/g, "").replace(/^\((.*)\)$/, "-$1").trim(),
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLooseDate(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2, "0")}-${slashMatch[2].padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function normalizeHeader(header) {
  return normalizeCellValue(header).trim().replace(/\s+/g, "_").toLowerCase();
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

function withinTolerance(actual, expected, explicitTolerance) {
  const tolerance =
    explicitTolerance ??
    Math.max(Math.abs(expected) * 0.01, Math.abs(expected) < 100 ? 0.1 : 1);

  return Math.abs(actual - expected) <= tolerance;
}

function average(values) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function round2(value) {
  return Number(value.toFixed(2));
}

function fact(labelHints, type, value, tolerance) {
  return { labelHints, tolerance, type, value };
}
