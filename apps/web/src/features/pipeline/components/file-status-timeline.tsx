type FileStatusTimelineItem = {
  documentId: string;
  fileName: string;
  receivedAt: string;
  status: "uploaded" | "parsed" | "review" | "completed";
  steps: {
    active: boolean;
    label: string;
  }[];
};

const statusTone = {
  completed: {
    badgeBackground: "#f0fdf4",
    badgeColor: "#15803d",
    borderColor: "#bbf7d0",
  },
  parsed: {
    badgeBackground: "#eff6ff",
    badgeColor: "#1d4ed8",
    borderColor: "#bfdbfe",
  },
  review: {
    badgeBackground: "#fffbeb",
    badgeColor: "#b45309",
    borderColor: "#fde68a",
  },
  uploaded: {
    badgeBackground: "rgba(20,34,53,0.06)",
    badgeColor: "#5c6f82",
    borderColor: "rgba(20,34,53,0.1)",
  },
} as const;

const fileStatusTimelines: FileStatusTimelineItem[] = [
  {
    documentId: "doc_4821",
    fileName: "acme-supply-invoices-apr-08.pdf",
    receivedAt: "14 min ago",
    status: "review",
    steps: [
      { active: true, label: "Uploaded" },
      { active: true, label: "Stored" },
      { active: true, label: "Parsed" },
      { active: false, label: "Needs analyst review" },
      { active: false, label: "Extracted" },
    ],
  },
  {
    documentId: "doc_4822",
    fileName: "service-titan-job-export-0408.xlsx",
    receivedAt: "28 min ago",
    status: "completed",
    steps: [
      { active: true, label: "Uploaded" },
      { active: true, label: "Stored" },
      { active: true, label: "Parsed" },
      { active: true, label: "Classified" },
      { active: true, label: "Facts + marts" },
    ],
  },
  {
    documentId: "doc_4823",
    fileName: "qb-ar-aging.csv",
    receivedAt: "42 min ago",
    status: "parsed",
    steps: [
      { active: true, label: "Uploaded" },
      { active: true, label: "Stored" },
      { active: true, label: "Parsed" },
      { active: false, label: "Classified" },
      { active: false, label: "Decision pack eligible" },
    ],
  },
];

function TimelineStep({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
        style={
          active
            ? {
                background: "#123d2f",
                color: "#f3efe6",
              }
            : {
                background: "rgba(20,34,53,0.06)",
                color: "#5c6f82",
              }
        }
      >
        {active ? "OK" : "..."}
      </span>
      <span
        className="text-[12px] font-medium"
        style={{ color: active ? "#142235" : "#5c6f82" }}
      >
        {label}
      </span>
    </div>
  );
}

export function FileStatusTimeline() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted">
            File status timeline
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Recent files moving from upload to review, extraction, and pack readiness.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-[rgba(20,34,53,0.12)] px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:bg-[rgba(20,34,53,0.04)]"
        >
          View all files
        </button>
      </div>

      <div className="space-y-3">
        {fileStatusTimelines.map((timeline) => {
          const tone = statusTone[timeline.status];

          return (
            <div
              key={timeline.documentId}
              className="rounded-xl border bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.06)]"
              style={{ borderColor: tone.borderColor }}
            >
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {timeline.fileName}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">
                    Document {timeline.documentId} received {timeline.receivedAt}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    background: tone.badgeBackground,
                    color: tone.badgeColor,
                  }}
                >
                  {timeline.status}
                </span>
              </div>

              <div className="flex flex-col gap-3 overflow-x-auto pb-1 md:flex-row md:items-center">
                {timeline.steps.map((step) => (
                  <TimelineStep
                    key={`${timeline.documentId}-${step.label}`}
                    active={step.active}
                    label={step.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
