import {
  createParserArtifact,
  type ParserArtifact,
} from "@/features/parsing/domain/parser-artifact";
import {
  buildTableExtractionPlan,
  type TableExtractionPlan,
} from "@/features/parsing/domain/table-extraction";
import { parseCsvText } from "@/features/parsing/lib/csv/parse-csv";
import { parseXlsxBuffer } from "@/features/parsing/lib/xlsx/parse-xlsx";

export type ParsedDocumentResult = {
  parserArtifact: ParserArtifact;
  tableExtractionPlan: TableExtractionPlan;
};

type ParseDocumentInput = {
  body: Buffer;
  createdAt?: string;
  documentId: string;
  fileName: string;
  parserArtifactId: string;
};

export async function parseDocumentWithService(
  input: ParseDocumentInput,
): Promise<ParsedDocumentResult> {
  const parsedDocument = await parseDocumentBody(input.fileName, input.body);
  const parserArtifact = createParserArtifact({
    createdAt: input.createdAt,
    documentId: input.documentId,
    id: input.parserArtifactId,
    parserKind: parsedDocument.parserKind,
    sheets: parsedDocument.sheets,
  });

  return {
    parserArtifact,
    tableExtractionPlan: buildTableExtractionPlan(parserArtifact.sheets),
  };
}

type ParsedDocumentBody = {
  parserKind: "csv" | "xlsx";
  sheets: {
    columnCount: number;
    headers: string[];
    name: string;
    rowCount: number;
  }[];
};

async function parseDocumentBody(
  fileName: string,
  body: Buffer,
): Promise<ParsedDocumentBody> {
  const fileExtension = getSupportedFileExtension(fileName);

  if (fileExtension === "csv") {
    const parsedCsv = parseCsvText(body.toString("utf8"));

    return {
      parserKind: "csv",
      sheets: [
        {
          columnCount: parsedCsv.columnCount,
          headers: parsedCsv.headers,
          name: "Sheet1",
          rowCount: parsedCsv.rowCount,
        },
      ],
    };
  }

  const parsedWorkbook = await parseXlsxBuffer(body);

  return {
    parserKind: "xlsx",
    sheets: parsedWorkbook.sheets,
  };
}

function getSupportedFileExtension(fileName: string): "csv" | "xlsx" {
  const fileExtension = fileName.split(".").pop()?.trim().toLowerCase();

  if (fileExtension === "csv" || fileExtension === "xlsx") {
    return fileExtension;
  }

  throw new Error(
    `Unsupported tabular file extension: ${fileExtension ?? "unknown"}`,
  );
}
