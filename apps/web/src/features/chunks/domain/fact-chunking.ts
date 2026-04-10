import { type CanonicalEntity } from "@/features/entities/domain/canonical-entity";
import { type CanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";

export type FactChunkDraft = {
  canonicalFactTypeIds: CanonicalFactRecord["canonicalFactTypeId"][];
  citations: CanonicalFactRecord["citations"];
  content: string;
  documentId: string;
  entityId: string;
  entityType: CanonicalFactRecord["entityType"];
  orgId: string;
};

type BuildFactChunkDraftsInput = {
  entities: readonly CanonicalEntity[];
  facts: readonly CanonicalFactRecord[];
};

export function buildFactChunkDrafts({
  entities,
  facts,
}: BuildFactChunkDraftsInput): FactChunkDraft[] {
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const factsByEntityId = new Map<string, CanonicalFactRecord[]>();

  for (const fact of facts) {
    const entityFacts = factsByEntityId.get(fact.entityId) ?? [];

    entityFacts.push(fact);
    factsByEntityId.set(fact.entityId, entityFacts);
  }

  return Array.from(factsByEntityId.entries())
    .sort(([leftEntityId], [rightEntityId]) =>
      leftEntityId.localeCompare(rightEntityId),
    )
    .map(([entityId, entityFacts]) => {
      const sortedFacts = [...entityFacts].sort((left, right) => {
        if (left.canonicalFactTypeId !== right.canonicalFactTypeId) {
          return left.canonicalFactTypeId.localeCompare(
            right.canonicalFactTypeId,
          );
        }

        return left.sourceFieldKey.localeCompare(right.sourceFieldKey);
      });
      const entity = entitiesById.get(entityId);
      const contentLines = sortedFacts.map(
        (fact) =>
          `${fact.label ?? humanizeFactTypeId(fact.canonicalFactTypeId)}: ${formatFactValue(fact.value)}`,
      );

      return {
        canonicalFactTypeIds: Array.from(
          new Set(sortedFacts.map((fact) => fact.canonicalFactTypeId)),
        ),
        citations: dedupeCitations(
          sortedFacts.flatMap((fact) => fact.citations),
        ),
        content: [
          `Entity ${entity?.displayName ?? entityId}.`,
          ...contentLines,
        ].join(" "),
        documentId: sortedFacts[0]!.documentId,
        entityId,
        entityType: sortedFacts[0]!.entityType,
        orgId: sortedFacts[0]!.orgId,
      };
    });
}

function humanizeFactTypeId(
  factTypeId: CanonicalFactRecord["canonicalFactTypeId"],
): string {
  return factTypeId.replace(/\./g, " ");
}

function formatFactValue(value: CanonicalFactRecord["value"]): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null) {
    return "null";
  }

  return String(value);
}

function dedupeCitations(citations: CanonicalFactRecord["citations"]) {
  const uniqueCitations = new Map(
    citations.map((citation) => [
      JSON.stringify([
        citation.documentId,
        citation.locatorType,
        citation.locator,
        citation.sourceHash,
      ]),
      citation,
    ]),
  );

  return Array.from(uniqueCitations.values());
}
