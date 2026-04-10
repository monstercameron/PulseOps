import {
  createCanonicalEntity,
  mergeCanonicalEntity,
  type CanonicalEntity,
} from "@/features/entities/domain/canonical-entity";
import { createEntitySeedForFact } from "@/features/entities/domain/entity-linking";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import { type ExtractionContract } from "@/features/extraction/domain/extraction-contract";
import {
  createCanonicalFactRecord,
  type CanonicalFactRecord,
} from "@/features/facts/domain/canonical-fact-record";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";

export type MaterializedExtractionFacts = {
  entities: CanonicalEntity[];
  facts: CanonicalFactRecord[];
  skippedFieldCount: number;
};

type MaterializeExtractionFactsInput = {
  contract: ExtractionContract;
  entityRepository: EntityRepository;
  factRepository: FactRepository;
  now?: () => string;
  orgId: string;
};

export async function materializeExtractionFacts({
  contract,
  entityRepository,
  factRepository,
  now = () => new Date().toISOString(),
  orgId,
}: MaterializeExtractionFactsInput): Promise<MaterializedExtractionFacts> {
  const createdAt = now();
  const materializedEntities = new Map<string, CanonicalEntity>();
  const materializedFacts: CanonicalFactRecord[] = [];
  const factBackedFields = contract.fields.filter(
    (
      field,
    ): field is (typeof contract.fields)[number] & {
      canonicalFactTypeId: NonNullable<(typeof field)["canonicalFactTypeId"]>;
    } => field.canonicalFactTypeId !== undefined,
  );

  for (const field of factBackedFields) {
    const entitySeed = createEntitySeedForFact({
      contract,
      field,
      orgId,
    });
    const cachedEntity = materializedEntities.get(entitySeed.id);
    const persistedEntity =
      cachedEntity ?? (await entityRepository.getById(entitySeed.id));
    const entity =
      persistedEntity === null
        ? createCanonicalEntity({
            aliases: entitySeed.aliases,
            canonicalKey: entitySeed.canonicalKey,
            createdAt,
            displayName: entitySeed.displayName,
            entityType: entitySeed.entityType,
            orgId,
            sourceDocumentId: contract.documentId,
          })
        : mergeCanonicalEntity(persistedEntity, {
            aliases: entitySeed.aliases,
            displayName: entitySeed.displayName,
            sourceDocumentId: contract.documentId,
            updatedAt: createdAt,
          });

    materializedEntities.set(entity.id, entity);
    await entityRepository.put(entity);

    const fact = createCanonicalFactRecord({
      canonicalFactTypeId: field.canonicalFactTypeId,
      citations: field.citations,
      confidenceScore: field.confidenceScore,
      createdAt,
      documentFamily: contract.documentFamily,
      documentId: contract.documentId,
      entityId: entity.id,
      entityType: entity.entityType,
      label: field.label,
      orgId,
      sourceFieldKey: field.key,
      value: field.value,
    });

    materializedFacts.push(fact);
    await factRepository.put(fact);
  }

  return {
    entities: Array.from(materializedEntities.values()),
    facts: materializedFacts,
    skippedFieldCount: contract.fields.length - factBackedFields.length,
  };
}
