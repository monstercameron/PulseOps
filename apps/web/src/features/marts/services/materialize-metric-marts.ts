import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import {
  createMaterializedMart,
  type MaterializedMart,
} from "@/features/marts/domain/materialized-mart";
import { type MartRepository } from "@/features/marts/repositories/mart-repository";

type MaterializeMetricMartsInput = {
  asOfDate: string;
  factRepository: FactRepository;
  martRepository: MartRepository;
  now?: () => string;
  orgId: string;
};

export async function materializeMetricMarts({
  asOfDate,
  factRepository,
  martRepository,
  now = () => new Date().toISOString(),
  orgId,
}: MaterializeMetricMartsInput): Promise<MaterializedMart[]> {
  const facts = await factRepository.listByOrgId(orgId);
  const createdAt = now();
  const marts = [
    buildOverdueReceivablesMart(facts, orgId, asOfDate, createdAt),
    buildOverdueInvoiceCountMart(facts, orgId, asOfDate, createdAt),
    buildGrossMarginMart(facts, orgId, asOfDate, createdAt),
  ].filter((mart): mart is MaterializedMart => mart !== null);

  for (const mart of marts) {
    await martRepository.put(mart);
  }

  return marts;
}

function buildOverdueReceivablesMart(
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>,
  orgId: string,
  asOfDate: string,
  createdAt: string,
): MaterializedMart | null {
  const overdueFacts = facts.filter(
    (fact) => fact.canonicalFactTypeId === "invoice.amount.outstanding",
  );

  if (overdueFacts.length === 0) {
    return null;
  }

  return createMaterializedMart({
    asOfDate,
    createdAt,
    dimensionValues: {},
    metricId: "overdue_receivables_cents",
    orgId,
    supportingFactIds: overdueFacts.map((fact) => fact.id),
    value: overdueFacts.reduce(
      (sum, fact) => sum + (typeof fact.value === "number" ? fact.value : 0),
      0,
    ),
  });
}

function buildOverdueInvoiceCountMart(
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>,
  orgId: string,
  asOfDate: string,
  createdAt: string,
): MaterializedMart | null {
  const overdueFacts = facts.filter(
    (fact) => fact.canonicalFactTypeId === "invoice.payment_days_late",
  );

  if (overdueFacts.length === 0) {
    return null;
  }

  return createMaterializedMart({
    asOfDate,
    createdAt,
    dimensionValues: {},
    metricId: "overdue_invoice_count",
    orgId,
    supportingFactIds: overdueFacts.map((fact) => fact.id),
    value: overdueFacts.filter(
      (fact) => typeof fact.value === "number" && fact.value > 0,
    ).length,
  });
}

function buildGrossMarginMart(
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>,
  orgId: string,
  asOfDate: string,
  createdAt: string,
): MaterializedMart | null {
  const marginFacts = facts.filter(
    (fact) => fact.canonicalFactTypeId === "job.margin.gross",
  );
  const revenueFacts = new Map(
    facts
      .filter((fact) => fact.canonicalFactTypeId === "job.revenue.actual")
      .map((fact) => [fact.entityId, fact]),
  );
  const supportingFacts = marginFacts.filter((fact) =>
    revenueFacts.has(fact.entityId),
  );

  if (supportingFacts.length === 0) {
    return null;
  }

  const totalMargin = supportingFacts.reduce(
    (sum, fact) => sum + (typeof fact.value === "number" ? fact.value : 0),
    0,
  );
  const totalRevenue = supportingFacts.reduce((sum, fact) => {
    const revenueFact = revenueFacts.get(fact.entityId);

    return (
      sum + (typeof revenueFact?.value === "number" ? revenueFact.value : 0)
    );
  }, 0);

  if (totalRevenue <= 0) {
    return null;
  }

  return createMaterializedMart({
    asOfDate,
    createdAt,
    dimensionValues: {},
    metricId: "gross_margin_bps",
    orgId,
    supportingFactIds: supportingFacts.flatMap((fact) => [
      fact.id,
      revenueFacts.get(fact.entityId)?.id ?? fact.id,
    ]),
    value: Math.round((totalMargin / totalRevenue) * 10_000),
  });
}
