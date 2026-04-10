import { type UiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { type SupportedDocumentFamilyId } from "@/features/foundation/domain/document-families";

type DataLabelMessages = UiMessages["dataLabels"];

export function getUiSourceLabel(
  messages: UiMessages,
  source: keyof DataLabelMessages["sources"],
) {
  return messages.dataLabels.sources[source];
}

export function getUiStatusLabel(
  messages: UiMessages,
  status: keyof DataLabelMessages["statuses"],
) {
  return messages.dataLabels.statuses[status];
}

export function getUiDocumentFamilyLabel(
  messages: UiMessages,
  family: SupportedDocumentFamilyId | "all" | undefined,
) {
  if (family === undefined) {
    return messages.dataLabels.generic.document;
  }

  if (family === "all") {
    return messages.dataLabels.documentFamilies.all.label;
  }

  return (
    messages.dataLabels.documentFamilies[family]?.label ??
    messages.dataLabels.generic.document
  );
}

export function getUiDocumentFamilyDescription(
  messages: UiMessages,
  family: SupportedDocumentFamilyId,
) {
  return messages.dataLabels.documentFamilies[family]?.description ?? "";
}
