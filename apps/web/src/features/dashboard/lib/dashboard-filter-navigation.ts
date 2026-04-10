import {
  dashboardDefaultFilterValues,
  type DashboardFilterValues,
} from "@/features/dashboard/lib/dashboard-filters";

export function buildDashboardFilterUrl(input: Readonly<{
  nextValues: DashboardFilterValues;
  pathname: string;
  searchParams: string | URLSearchParams;
}>): string {
  const nextSearchParams = new URLSearchParams(input.searchParams.toString());

  (Object.keys(input.nextValues) as Array<keyof DashboardFilterValues>).forEach(
    (key) => {
      const nextValue = input.nextValues[key];
      const defaultValue = dashboardDefaultFilterValues[key];

      if (nextValue === defaultValue) {
        nextSearchParams.delete(key);
        return;
      }

      nextSearchParams.set(key, nextValue);
    },
  );

  const queryString = nextSearchParams.toString();

  return queryString.length > 0
    ? `${input.pathname}?${queryString}`
    : input.pathname;
}

export function applyDashboardFilterControlChange(input: Readonly<{
  controlId: keyof DashboardFilterValues;
  selectedValues: DashboardFilterValues;
  value: string;
}>): DashboardFilterValues {
  switch (input.controlId) {
    case "dateRange":
      return {
        ...input.selectedValues,
        dateRange: input.value as DashboardFilterValues["dateRange"],
      };
    case "documentType":
      return {
        ...input.selectedValues,
        documentType: input.value as DashboardFilterValues["documentType"],
      };
    case "source":
      return {
        ...input.selectedValues,
        source: input.value as DashboardFilterValues["source"],
      };
    case "status":
      return {
        ...input.selectedValues,
        status: input.value as DashboardFilterValues["status"],
      };
  }
}
