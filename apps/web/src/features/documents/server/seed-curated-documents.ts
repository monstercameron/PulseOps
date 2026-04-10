import { createHash } from "node:crypto";

import {
  attachDocumentClassification,
  attachStoredObjectToDocument,
  createUploadedDocument,
  markDocumentExtracted,
  markDocumentParsed,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { classifyDocumentFamily } from "@/features/documents/domain/document-family-heuristics";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { createCanonicalEntity } from "@/features/entities/domain/canonical-entity";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import {
  readCuratedAssetDocument,
  type CuratedAssetDocumentName,
} from "@/features/ingestion/testing/asset-documents";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import {
  parseCsvText,
  type ParsedCsv,
} from "@/features/parsing/lib/csv/parse-csv";
import { parseDocumentWithService } from "@/features/parsing/services/parser-service";
import {
  buildObjectStorageKey,
  sanitizeObjectKeySegment,
  type ObjectStorage,
} from "@/features/storage/lib/object-storage";
import { createCitation } from "@/features/trust/domain/citation";

const curatedSeedFileNames = [
  "10020Records.csv",
  "field-service-customer-invoice.csv",
  "field-service-job-cost-report.csv",
  "field-service-vendor-bill.csv",
  "supermarket_sales - Sheet1.csv",
] as const satisfies readonly CuratedAssetDocumentName[];

const curatedDocumentCreatedAts: Record<CuratedAssetDocumentName, string> = {
  "10020Records.csv": "2026-04-09T13:00:00.000Z",
  "field-service-customer-invoice.csv": "2026-04-09T13:15:00.000Z",
  "field-service-job-cost-report.csv": "2026-04-09T13:30:00.000Z",
  "field-service-vendor-bill.csv": "2026-04-09T13:45:00.000Z",
  "supermarket_sales - Sheet1.csv": "2026-04-09T14:00:00.000Z",
};

const seedingPromisesByOrgId = new Map<string, Promise<void>>();

type EnsureCuratedDocumentsSeededInput = Readonly<{
  documentRepository: DocumentRepository;
  entityRepository: EntityRepository;
  factRepository: FactRepository;
  orgId: string;
  parserArtifactRepository: ParserArtifactRepository;
  storage: ObjectStorage;
}>;

type SeedFactDefinition = Readonly<{
  canonicalFactTypeId: "document.observation.number";
  confidenceScore: number;
  excerpt: string;
  fieldKey: string;
  label: string;
  locator: Record<string, string | number | boolean>;
  locatorType: "field" | "sheet";
  value: number;
}>;

export async function ensureCuratedDocumentsSeeded(
  input: EnsureCuratedDocumentsSeededInput,
): Promise<void> {
  const existingPromise = seedingPromisesByOrgId.get(input.orgId);

  if (existingPromise !== undefined) {
    return existingPromise;
  }

  const seedingPromise = seedCuratedDocuments(input).finally(() => {
    seedingPromisesByOrgId.delete(input.orgId);
  });

  seedingPromisesByOrgId.set(input.orgId, seedingPromise);

  return seedingPromise;
}

async function seedCuratedDocuments({
  documentRepository,
  entityRepository,
  factRepository,
  orgId,
  parserArtifactRepository,
  storage,
}: EnsureCuratedDocumentsSeededInput) {
  const existingDocuments = await documentRepository.listByOrgId(orgId);
  const existingDocumentsByFileName = new Map(
    existingDocuments.map((document) => [document.fileName, document]),
  );

  for (const fileName of curatedSeedFileNames) {
    const existingDocument = existingDocumentsByFileName.get(fileName);

    if (existingDocument !== undefined) {
      await backfillCuratedDocumentParserArtifact({
        document: existingDocument,
        documentRepository,
        fileName,
        orgId,
        parserArtifactRepository,
      });
      continue;
    }

    await seedSingleCuratedDocument({
      documentRepository,
      entityRepository,
      factRepository,
      fileName,
      orgId,
      parserArtifactRepository,
      storage,
    });
  }
}

async function seedSingleCuratedDocument(
  input: Readonly<{
    documentRepository: DocumentRepository;
    entityRepository: EntityRepository;
    factRepository: FactRepository;
    fileName: CuratedAssetDocumentName;
    orgId: string;
    parserArtifactRepository: ParserArtifactRepository;
    storage: ObjectStorage;
  }>,
) {
  const createdAt = curatedDocumentCreatedAts[input.fileName];
  const body = await readCuratedAssetDocument(input.fileName);
  const parsedCsv = parseCsvText(body.toString("utf8"));
  const documentId = buildCuratedDocumentId(input.orgId, input.fileName);
  let document = createUploadedDocument(
    {
      fileName: input.fileName,
      id: documentId,
      orgId: input.orgId,
    },
    createdAt,
  );
  const rawObject = await input.storage.putObject({
    body,
    contentType: document.contentType,
    key: buildObjectStorageKey({
      createdAt,
      documentId,
      fileName: input.fileName,
      orgId: input.orgId,
    }),
    metadata: {
      documentId,
      orgId: input.orgId,
      seedSource: "curated-assets",
    },
  });
  const parserArtifact = await createCuratedParserArtifact({
    body,
    createdAt,
    documentId,
    fileName: input.fileName,
    orgId: input.orgId,
  });
  const classification = classifyCuratedDocument(
    input.fileName,
    parserArtifact,
  );

  document = attachStoredObjectToDocument(document, rawObject, createdAt);
  document = markDocumentParsed(document, parserArtifact.id, createdAt);
  document = attachDocumentClassification(
    document,
    classification?.suggestedDocumentFamily ?? "generic-business-document",
    classification?.confidenceScore ?? 0.58,
    createdAt,
  );
  document = markDocumentExtracted(document, createdAt);

  await input.documentRepository.put(document);
  await input.parserArtifactRepository.put(parserArtifact);

  const entity = createCanonicalEntity({
    canonicalKey: `seed:${input.fileName}`,
    createdAt,
    displayName: input.fileName,
    entityType: "document",
    orgId: input.orgId,
    sourceDocumentId: document.id,
  });

  await input.entityRepository.put(entity);

  for (const factDefinition of buildCuratedSeedFacts(
    document,
    parsedCsv,
    rawObject.sha256,
  )) {
    await input.factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: factDefinition.canonicalFactTypeId,
        citations: [
          createCitation({
            confidenceScore: factDefinition.confidenceScore,
            documentFamily:
              document.suggestedDocumentFamily ?? "generic-business-document",
            documentId: document.id,
            excerpt: factDefinition.excerpt,
            locator: factDefinition.locator,
            locatorType: factDefinition.locatorType,
            sourceHash: rawObject.sha256,
          }),
        ],
        confidenceScore: factDefinition.confidenceScore,
        documentFamily:
          document.suggestedDocumentFamily ?? "generic-business-document",
        documentId: document.id,
        entityId: entity.id,
        entityType: "document",
        label: factDefinition.label,
        orgId: input.orgId,
        sourceFieldKey: factDefinition.fieldKey,
        value: factDefinition.value,
      }),
    );
  }
}

function buildCuratedSeedFacts(
  document: DocumentRecord,
  parsedCsv: ParsedCsv,
  sourceHash: string,
): SeedFactDefinition[] {
  const seededFacts: SeedFactDefinition[] = [
    {
      canonicalFactTypeId: "document.observation.number",
      confidenceScore: 0.99,
      excerpt: `${parsedCsv.rowCount} rows were parsed from ${document.fileName}.`,
      fieldKey: "seed.row_count",
      label: "Rows parsed",
      locator: {
        sheet: "Sheet1",
      },
      locatorType: "sheet",
      value: parsedCsv.rowCount,
    },
  ];

  if (document.fileName === "10020Records.csv") {
    seededFacts.push(
      buildColumnAggregateFact({
        columnKey: "total_revenue",
        label: "Total revenue",
        parsedCsv,
      }),
      buildColumnAggregateFact({
        columnKey: "total_profit",
        label: "Total profit",
        parsedCsv,
      }),
    );
  }

  if (document.fileName === "supermarket_sales - Sheet1.csv") {
    seededFacts.push(
      buildColumnAggregateFact({
        columnKey: "total",
        label: "Total sales",
        parsedCsv,
      }),
      buildColumnAggregateFact({
        columnKey: "gross_income",
        label: "Gross income",
        parsedCsv,
      }),
    );
  }

  return seededFacts.map((fact) => ({
    ...fact,
    excerpt: `${fact.excerpt} Source hash ${sourceHash.slice(0, 12)}.`,
  }));
}

function buildColumnAggregateFact(
  input: Readonly<{
    columnKey: string;
    label: string;
    parsedCsv: ParsedCsv;
  }>,
): SeedFactDefinition {
  const aggregateValue = Number(
    input.parsedCsv.records
      .reduce(
        (total, record) => total + readNumericCell(record[input.columnKey]),
        0,
      )
      .toFixed(2),
  );

  return {
    canonicalFactTypeId: "document.observation.number",
    confidenceScore: 0.97,
    excerpt: `${input.label} was aggregated from the ${input.columnKey} column across ${input.parsedCsv.rowCount} rows.`,
    fieldKey: `seed.${input.columnKey}`,
    label: input.label,
    locator: {
      field: input.columnKey,
    },
    locatorType: "field",
    value: aggregateValue,
  };
}

function readNumericCell(value: string | undefined) {
  if (value === undefined) {
    return 0;
  }

  const normalizedValue = value.replace(/,/g, "").trim();
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function buildCuratedDocumentId(orgId: string, fileName: string) {
  return `seed_doc_${sanitizeObjectKeySegment(orgId)}_${createHash("sha1").update(fileName).digest("hex").slice(0, 12)}`;
}

function buildCuratedParserArtifactId(orgId: string, fileName: string) {
  return `seed_parser_${sanitizeObjectKeySegment(orgId)}_${createHash("sha1").update(fileName).digest("hex").slice(0, 12)}`;
}

async function createCuratedParserArtifact(
  input: Readonly<{
    body: Buffer;
    createdAt: string;
    documentId: string;
    fileName: CuratedAssetDocumentName;
    orgId: string;
  }>,
): Promise<ParserArtifact> {
  const { parserArtifact } = await parseDocumentWithService({
    body: input.body,
    createdAt: input.createdAt,
    documentId: input.documentId,
    fileName: input.fileName,
    parserArtifactId: buildCuratedParserArtifactId(input.orgId, input.fileName),
  });

  return parserArtifact;
}

function classifyCuratedDocument(
  fileName: CuratedAssetDocumentName,
  parserArtifact: ParserArtifact,
) {
  return classifyDocumentFamily({
    fileName,
    headers: Array.from(
      new Set(parserArtifact.sheets.flatMap((sheet) => sheet.headers)),
    ),
  });
}

async function backfillCuratedDocumentParserArtifact(
  input: Readonly<{
    document: DocumentRecord;
    documentRepository: DocumentRepository;
    fileName: CuratedAssetDocumentName;
    orgId: string;
    parserArtifactRepository: ParserArtifactRepository;
  }>,
) {
  if (input.document.parserArtifactId !== undefined) {
    const existingParserArtifact = await input.parserArtifactRepository.getById(
      input.document.parserArtifactId,
    );

    if (existingParserArtifact !== null) {
      return;
    }
  }

  const parserArtifact = await createCuratedParserArtifact({
    body: await readCuratedAssetDocument(input.fileName),
    createdAt: input.document.createdAt,
    documentId: input.document.id,
    fileName: input.fileName,
    orgId: input.orgId,
  });
  const classification = classifyCuratedDocument(
    input.fileName,
    parserArtifact,
  );
  let document = markDocumentParsed(
    input.document,
    parserArtifact.id,
    input.document.updatedAt,
  );

  document = attachDocumentClassification(
    document,
    classification?.suggestedDocumentFamily ?? "generic-business-document",
    classification?.confidenceScore ??
      input.document.classificationConfidenceScore ??
      0.58,
    input.document.updatedAt,
  );
  document = markDocumentExtracted(document, input.document.updatedAt);

  await input.parserArtifactRepository.put(parserArtifact);
  await input.documentRepository.put(document);
}
