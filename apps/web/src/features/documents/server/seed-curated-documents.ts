import { createHash } from "node:crypto";

import {
  attachDocumentClassification,
  attachStoredObjectToDocument,
  createUploadedDocument,
  markDocumentExtracted,
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
import { parseCsvText, type ParsedCsv } from "@/features/parsing/lib/csv/parse-csv";
import {
  buildObjectStorageKey,
  sanitizeObjectKeySegment,
  type ObjectStorage,
} from "@/features/storage/lib/object-storage";
import { createCitation } from "@/features/trust/domain/citation";

const curatedSeedFileNames = [
  "10020Records.csv",
  "supermarket_sales - Sheet1.csv",
] as const satisfies readonly CuratedAssetDocumentName[];

const curatedDocumentCreatedAts: Record<CuratedAssetDocumentName, string> = {
  "10020Records.csv": "2026-04-09T13:00:00.000Z",
  "supermarket_sales - Sheet1.csv": "2026-04-09T14:00:00.000Z",
};

const seedingPromisesByOrgId = new Map<string, Promise<void>>();

type EnsureCuratedDocumentsSeededInput = Readonly<{
  documentRepository: DocumentRepository;
  entityRepository: EntityRepository;
  factRepository: FactRepository;
  orgId: string;
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
  storage,
}: EnsureCuratedDocumentsSeededInput) {
  const existingDocuments = await documentRepository.listByOrgId(orgId);
  const existingFileNames = new Set(
    existingDocuments.map((document) => document.fileName),
  );

  for (const fileName of curatedSeedFileNames) {
    if (existingFileNames.has(fileName)) {
      continue;
    }

    await seedSingleCuratedDocument({
      documentRepository,
      entityRepository,
      factRepository,
      fileName,
      orgId,
      storage,
    });
  }
}

async function seedSingleCuratedDocument(input: Readonly<{
  documentRepository: DocumentRepository;
  entityRepository: EntityRepository;
  factRepository: FactRepository;
  fileName: CuratedAssetDocumentName;
  orgId: string;
  storage: ObjectStorage;
}>) {
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
  const classification = classifyDocumentFamily({
    fileName: input.fileName,
    headers: parsedCsv.headers,
  });

  document = attachStoredObjectToDocument(document, rawObject, createdAt);
  document = attachDocumentClassification(
    document,
    classification?.suggestedDocumentFamily ?? "generic-business-document",
    classification?.confidenceScore ?? 0.58,
    createdAt,
  );
  document = markDocumentExtracted(document, createdAt);

  await input.documentRepository.put(document);
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

function buildColumnAggregateFact(input: Readonly<{
  columnKey: string;
  label: string;
  parsedCsv: ParsedCsv;
}>): SeedFactDefinition {
  const aggregateValue = Number(
    input.parsedCsv.records
      .reduce((total, record) => total + readNumericCell(record[input.columnKey]), 0)
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
