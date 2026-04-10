import {
  CallToActionBanner,
  MarketingHero,
  PricingCard,
  ProblemCard,
  QuestionCard,
  TestimonialCard,
  WorkflowStepCard,
} from "@/features/catalog/components/marketing-catalog-blocks";
import {
  CatalogCard,
  CatalogSection,
  CatalogTable,
  ConfidenceMeter,
  StatusBadge,
} from "@/features/catalog/components/catalog-primitives";
import {
  DialogFrame,
  FieldGroup,
  PreferencePanel,
  SegmentedControl,
  SettingsActionRow,
  TeamMemberRow,
  TextField,
  ToggleRow,
} from "@/features/catalog/components/settings-catalog-blocks";
import {
  ActivityFeedItem,
  CitationList,
  ConversationBubble,
  DecisionQueueCard,
  FilterChip,
  MetricTile,
  PackListItem,
  RecommendationCard,
  SignalCard,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import {
  getCatalogContent,
  getCatalogTextDirection,
  resolveCatalogLocale,
  type CatalogInventoryRow,
  type CatalogRecordRow,
} from "@/features/catalog/constants/catalog-content";

type ComponentCatalogPageProps = Readonly<{
  locale?: string;
}>;

export function ComponentCatalogPage({ locale }: ComponentCatalogPageProps) {
  const resolvedLocale = resolveCatalogLocale(locale);
  const textDirection = getCatalogTextDirection(resolvedLocale);
  const content = getCatalogContent(resolvedLocale);

  const inventoryColumns = [
    {
      header: content.inventory.table.componentHeader,
      key: "component",
      render: (row: CatalogInventoryRow) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="mt-1 text-xs text-muted">{row.family}</div>
        </div>
      ),
    },
    {
      header: content.inventory.table.sourceHeader,
      key: "sources",
      render: (row: CatalogInventoryRow) => <CitationList items={row.sourcePages} />,
    },
    {
      header: content.inventory.table.intentHeader,
      key: "notes",
      render: (row: CatalogInventoryRow) => <span className="text-muted">{row.notes}</span>,
    },
  ] as const;

  const recordColumns = [
    {
      header: content.data.table.documentHeader,
      key: "document",
      render: (row: CatalogRecordRow) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="mt-1 text-xs text-muted">{row.source}</div>
        </div>
      ),
    },
    {
      header: content.data.table.classHeader,
      key: "type",
      render: (row: CatalogRecordRow) => (
        <StatusBadge label={row.typeLabel} tone={row.typeTone} />
      ),
    },
    {
      header: content.data.table.confidenceHeader,
      key: "confidence",
      render: (row: CatalogRecordRow) =>
        row.confidence === null ? (
          <span className="text-muted">-</span>
        ) : (
          <ConfidenceMeter locale={resolvedLocale} value={row.confidence} />
        ),
    },
    {
      header: content.data.table.statusHeader,
      key: "status",
      render: (row: CatalogRecordRow) => (
        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
      ),
    },
  ] as const;

  return (
    <div
      className="flex min-h-full flex-col bg-background"
      dir={textDirection}
      lang={resolvedLocale}
    >
      <WorkspaceHeader
        actions={content.header.actions}
        breadcrumbs={content.header.breadcrumbs}
        description={content.header.description}
        title={content.header.title}
      />

      <div className="space-y-12 px-6 py-6">
        <CatalogCard className="overflow-hidden border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(234,244,249,0.94)_100%)] px-7 py-7">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <StatusBadge label={content.pageSummary.badgeLabel} tone="accent" />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {content.pageSummary.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
                {content.pageSummary.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.pageSummary.metrics.map((metric) => (
                <MetricTile
                  key={metric.label}
                  detail={metric.detail}
                  label={metric.label}
                  tone={metric.tone}
                  trend={metric.trend}
                  value={metric.value}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            {content.pageSummary.sectionLinks.map((link) => (
              <a
                key={link.href}
                className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-[rgba(20,34,53,0.18)] hover:text-foreground"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </CatalogCard>

        <CatalogSection
          description={content.inventory.section.description}
          eyebrow={content.inventory.section.eyebrow}
          id="inventory"
          title={content.inventory.section.title}
        >
          <CatalogCard className="overflow-hidden">
            <CatalogTable
              ariaLabel={content.inventory.table.ariaLabel}
              columns={inventoryColumns}
              rows={content.inventory.rows}
            />
          </CatalogCard>
        </CatalogSection>

        <CatalogSection
          description={content.marketing.section.description}
          eyebrow={content.marketing.section.eyebrow}
          id="marketing"
          title={content.marketing.section.title}
        >
          <div className="space-y-6">
            <MarketingHero
              actions={content.marketing.hero.actions}
              description={content.marketing.hero.description}
              eyebrow={content.marketing.hero.eyebrow}
              footerNote={content.marketing.hero.footerNote}
              stats={content.marketing.hero.stats}
              title={
                <>
                  {content.marketing.hero.titleLines[0]}
                  <br />
                  {content.marketing.hero.titleLines[1]}
                </>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {content.marketing.problemCards.map((card) => (
                <ProblemCard
                  key={card.title}
                  description={card.description}
                  icon={card.icon}
                  title={card.title}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {content.marketing.workflowSteps.map((step) => (
                <WorkflowStepCard
                  key={step.step}
                  description={step.description}
                  step={step.step}
                  title={step.title}
                />
              ))}
            </div>

            <CatalogCard className="bg-[#0d1b2a] px-7 py-7" tone="shell">
              <div className="max-w-3xl">
                <StatusBadge label={content.marketing.questions.badgeLabel} tone="accent" />
                <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {content.marketing.questions.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#85a0b8]">
                  {content.marketing.questions.description}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {content.marketing.questions.items.map((item) => (
                  <QuestionCard
                    key={item.title}
                    description={item.description}
                    icon={item.icon}
                    title={item.title}
                  />
                ))}
              </div>
            </CatalogCard>

            <div className="grid gap-4 xl:grid-cols-3">
              {content.marketing.pricingCards.map((card) => (
                <PricingCard
                  key={card.name}
                  ctaLabel={card.ctaLabel}
                  description={card.description}
                  featured={card.featured}
                  featuredLabel={card.featuredLabel}
                  name={card.name}
                  points={card.points}
                  price={card.price}
                  priceSuffix={card.priceSuffix}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {content.marketing.testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.name}
                  company={testimonial.company}
                  initials={testimonial.initials}
                  name={testimonial.name}
                  quote={testimonial.quote}
                />
              ))}
            </div>

            <CallToActionBanner
              description={content.marketing.cta.description}
              primaryAction={content.marketing.cta.primaryAction}
              secondaryAction={content.marketing.cta.secondaryAction}
              title={content.marketing.cta.title}
            />
          </div>
        </CatalogSection>

        <CatalogSection
          description={content.workspace.section.description}
          eyebrow={content.workspace.section.eyebrow}
          id="workspace"
          title={content.workspace.section.title}
        >
          <div className="space-y-6">
            <CatalogCard className="px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {content.workspace.filterKit.eyebrow}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {content.workspace.filterKit.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.workspace.filterKit.chips.map((chip, index) => (
                    <FilterChip key={chip} active={index === 0} label={chip} />
                  ))}
                </div>
              </div>
            </CatalogCard>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {content.workspace.metrics.map((metric) => (
                <MetricTile
                  key={metric.label}
                  detail={metric.detail}
                  label={metric.label}
                  tone={metric.tone}
                  trend={metric.trend}
                  value={metric.value}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <CatalogCard className="p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {content.workspace.activity.title}
                  </h3>
                  <span className="text-xs text-muted">
                    {content.workspace.activity.badgeLabel}
                  </span>
                </div>
                <div className="mt-2">
                  {content.workspace.activity.items.map((item) => (
                    <ActivityFeedItem
                      key={item.title}
                      action={item.action}
                      detail={item.detail}
                      label={item.label}
                      time={item.time}
                      title={item.title}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </CatalogCard>

              <CatalogCard className="p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {content.workspace.queue.title}
                  </h3>
                  <StatusBadge label={content.workspace.queue.badgeLabel} tone="danger" />
                </div>
                <div className="mt-4 space-y-3">
                  {content.workspace.queue.items.map((item) => (
                    <DecisionQueueCard
                      key={item.title}
                      actions={item.actions}
                      context={item.context}
                      priority={item.priority}
                      priorityLabel={item.priorityLabel}
                      title={item.title}
                      typeLabel={item.typeLabel}
                    />
                  ))}
                </div>
              </CatalogCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {content.workspace.signals.map((signal) => (
                <SignalCard
                  key={signal.label}
                  detail={signal.detail}
                  label={signal.label}
                  tone={signal.tone}
                  value={signal.value}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <CatalogCard className="p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {content.workspace.packs.title}
                  </h3>
                  <StatusBadge label={content.workspace.packs.badgeLabel} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {content.workspace.packs.items.map((item) => (
                    <PackListItem
                      key={item.title}
                      accent={item.accent}
                      meta={item.meta}
                      periodLabel={item.periodLabel}
                      status={item.status}
                      statusLabel={item.statusLabel}
                      title={item.title}
                    />
                  ))}
                </div>
              </CatalogCard>

              <div className="space-y-4">
                {content.workspace.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.title}
                    actions={recommendation.actions}
                    citations={recommendation.citations}
                    confidence={recommendation.confidence}
                    locale={resolvedLocale}
                    priority={recommendation.priority}
                    priorityLabel={recommendation.priorityLabel}
                    summary={recommendation.summary}
                    title={recommendation.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </CatalogSection>

        <CatalogSection
          description={content.data.section.description}
          eyebrow={content.data.section.eyebrow}
          id="data"
          title={content.data.section.title}
        >
          <div className="space-y-6">
            <CatalogCard className="overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {content.data.table.title}
                </h3>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {content.data.table.description}
                </p>
              </div>
              <CatalogTable
                ariaLabel={content.data.table.ariaLabel}
                columns={recordColumns}
                rowClassName={(row) =>
                  row.id === content.data.records[0]?.id ? "bg-accent/6" : undefined
                }
                rows={content.data.records}
              />
            </CatalogCard>

            <CatalogCard className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {content.data.ask.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.data.ask.filters.map((chip, index) => (
                    <FilterChip key={chip} active={index === 0} label={chip} />
                  ))}
                </div>
              </div>

              <ConversationBubble
                avatarLabel={content.data.ask.userAvatarLabel}
                role="user"
              >
                {content.data.ask.userQuestion}
              </ConversationBubble>

              <ConversationBubble
                avatarLabel={content.data.ask.assistantAvatarLabel}
                footer={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {content.data.ask.assistantLeadLabel}
                    </span>
                    <CitationList items={content.data.ask.citations} />
                  </div>
                }
                role="assistant"
              >
                <div className="space-y-3">
                  <p>
                    {content.data.ask.assistantMessage}
                    <strong> {content.data.ask.totalOutstanding}</strong>.
                  </p>
                  <div className="space-y-2 rounded-2xl border border-border bg-[rgba(20,34,53,0.02)] p-4">
                    {content.data.ask.overdueItems.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <StatusBadge label={item.label} tone={item.tone} />
                      </div>
                    ))}
                  </div>
                </div>
              </ConversationBubble>
            </CatalogCard>
          </div>
        </CatalogSection>

        <CatalogSection
          description={content.settings.section.description}
          eyebrow={content.settings.section.eyebrow}
          id="controls"
          title={content.settings.section.title}
        >
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <PreferencePanel
              description={content.settings.panel.description}
              title={content.settings.panel.title}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FieldGroup
                  hint={content.settings.panel.organizationField.hint}
                  label={content.settings.panel.organizationField.label}
                >
                  <TextField value={content.settings.panel.organizationField.value} />
                </FieldGroup>
                <FieldGroup label={content.settings.panel.verticalField.label}>
                  <TextField value={content.settings.panel.verticalField.value} />
                </FieldGroup>
              </div>

              <FieldGroup label={content.settings.panel.themeField.label}>
                <SegmentedControl
                  options={content.settings.panel.themeField.options.map((option, index) => ({
                    active: index === 1,
                    label: option,
                  }))}
                />
              </FieldGroup>

              <div className="rounded-2xl border border-border bg-[rgba(20,34,53,0.02)] px-5 py-2">
                {content.settings.panel.toggles.map((toggle) => (
                  <ToggleRow
                    key={toggle.title}
                    description={toggle.description}
                    enabled={toggle.enabled}
                    title={toggle.title}
                  />
                ))}
              </div>

              <CatalogCard className="border border-border bg-[rgba(20,34,53,0.02)] p-5 shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {content.settings.panel.team.title}
                    </h4>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {content.settings.panel.team.description}
                    </p>
                  </div>
                  <StatusBadge label={content.settings.panel.team.badgeLabel} tone="info" />
                </div>
                <div className="mt-4">
                  {content.settings.panel.team.members.map((member) => (
                    <TeamMemberRow
                      accessSummary={member.accessSummary}
                      key={member.email}
                      email={member.email}
                      name={member.name}
                      role={member.role}
                      status={member.status}
                      statusLabel={member.statusLabel}
                    />
                  ))}
                </div>
              </CatalogCard>

              <SettingsActionRow
                primaryLabel={content.settings.panel.actions.primaryLabel}
                secondaryLabel={content.settings.panel.actions.secondaryLabel}
              />
            </PreferencePanel>

            <DialogFrame
              description={content.settings.dialog.description}
              stepLabel={content.settings.dialog.stepLabel}
              title={content.settings.dialog.title}
            >
              <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                <div className="flex h-[110px] items-center justify-center rounded-2xl border border-border bg-[rgba(20,34,53,0.03)] text-xs font-semibold text-muted">
                  {content.settings.dialog.qrLabel}
                </div>
                <div className="space-y-4">
                  <FieldGroup label={content.settings.dialog.manualCodeLabel}>
                    <TextField value={content.settings.dialog.manualCodeValue} />
                  </FieldGroup>
                  <FieldGroup
                    hint={content.settings.dialog.verificationCodeHint}
                    label={content.settings.dialog.verificationCodeLabel}
                  >
                    <TextField value={content.settings.dialog.verificationCodeValue} />
                  </FieldGroup>
                </div>
              </div>
              <CatalogCard className="border border-border bg-[rgba(20,34,53,0.02)] p-4 shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {content.settings.dialog.recoveryCodesLabel}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-foreground">
                  {content.settings.dialog.recoveryCodes.map((code) => (
                    <span key={code}>{code}</span>
                  ))}
                </div>
              </CatalogCard>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
                  type="button"
                >
                  {content.settings.dialog.actions.cancel}
                </button>
                <button
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950"
                  type="button"
                >
                  {content.settings.dialog.actions.continue}
                </button>
              </div>
            </DialogFrame>
          </div>
        </CatalogSection>
      </div>
    </div>
  );
}
