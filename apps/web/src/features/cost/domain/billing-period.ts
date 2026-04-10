export function getBillingPeriodWindow(
  nowIso: string,
  billingAnchorDayOfMonth: number,
): Readonly<{
  endAt: string;
  startAt: string;
}> {
  const nowDate = new Date(nowIso);
  const currentMonthAnchor = new Date(
    Date.UTC(
      nowDate.getUTCFullYear(),
      nowDate.getUTCMonth(),
      billingAnchorDayOfMonth,
      0,
      0,
      0,
      0,
    ),
  );
  const startAt =
    nowDate >= currentMonthAnchor
      ? currentMonthAnchor
      : new Date(
          Date.UTC(
            nowDate.getUTCFullYear(),
            nowDate.getUTCMonth() - 1,
            billingAnchorDayOfMonth,
            0,
            0,
            0,
            0,
          ),
        );
  const endAt = new Date(
    Date.UTC(
      startAt.getUTCFullYear(),
      startAt.getUTCMonth() + 1,
      billingAnchorDayOfMonth,
      0,
      0,
      0,
      0,
    ),
  );

  return {
    endAt: endAt.toISOString(),
    startAt: startAt.toISOString(),
  };
}
