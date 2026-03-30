type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {};
};

export const unpackArrayPayload = (value: unknown): AnyRecord[] => {
  if (Array.isArray(value)) return value as AnyRecord[];

  const obj = asRecord(value);
  const keys = ['rows', 'data', 'result', 'items', 'payload', 'value'] as const;

  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as AnyRecord[];
  }

  const ok = asRecord(obj.ok);
  if (Array.isArray(ok.data)) return ok.data as AnyRecord[];
  if (Array.isArray(ok.rows)) return ok.rows as AnyRecord[];

  return [];
};

export const unpackObjectPayload = (value: unknown): AnyRecord => {
  const obj = asRecord(value);
  for (const key of ['data', 'row', 'result'] as const) {
    const nested = asRecord(obj[key]);
    if (Object.keys(nested).length > 0) return nested;
  }
  return obj;
};

const num = (v: unknown): number => Number(v ?? 0);
const str = (v: unknown): string => String(v ?? '');

export type SalesByDayPoint = { label: string; total: number };
export type TopProductPoint = { name: string; qty: number };

export type ReportSummary = {
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCosts: number;
  totalExpenses: number;
  utility: number;
};

export type TodayDashboardSummary = {
  totalSales: number;
  cashSales: number;
  totalExpenses: number;
  totalCosts: number;
  totalReturns: number;
  netSales: number;
};

export type CashStatusSummary = {
  expectedCash: number;
  cashSales: number;
  expenses: number;
  cashReturns: number;
};

export type DailyCloseSummary = {
  totalSales: number;
  totalReturns: number;
  netSales: number;
  profit: number;
  totalExpenses: number;
  net: number;
  totalsByMethod: Record<string, number>;
};

export const toSalesByDayPoints = (value: unknown): SalesByDayPoint[] => {
  return unpackArrayPayload(value).map((row) => ({
    label: str(row.day ?? row.date ?? row.label).trim(),
    total: num(row.total ?? row.total_sales),
  }));
};

export const toTopProductPoints = (value: unknown): TopProductPoint[] => {
  return unpackArrayPayload(value).map((row) => ({
    name: str(row.name).trim(),
    qty: num(row.qty),
  }));
};

export const toReportSummary = (value: unknown): ReportSummary => {
  const row = unpackObjectPayload(value);
  const totalSales = num(row.total_sales ?? row.total);
  const totalReturns = num(row.total_returns ?? row.returns);
  const netSales = num(row.net_sales ?? (totalSales - totalReturns));
  const totalCosts = num(row.total_costs ?? row.costs);
  const totalExpenses = num(row.total_expenses ?? row.expenses);

  return {
    totalSales,
    totalReturns,
    netSales,
    totalCosts,
    totalExpenses,
    utility: netSales - totalCosts - totalExpenses,
  };
};

export const toTodayDashboardSummary = (value: unknown): TodayDashboardSummary => {
  const row = unpackObjectPayload(value);
  const totalSales = num(row.total_sales ?? row.total);
  const totalReturns = num(row.total_returns ?? row.returns);

  return {
    totalSales,
    cashSales: num(row.cash_sales ?? row.cash),
    totalExpenses: num(row.total_expenses ?? row.expenses),
    totalCosts: num(row.total_costs ?? row.costs),
    totalReturns,
    netSales: num(row.net_sales ?? (totalSales - totalReturns)),
  };
};

export const toCashStatusSummary = (value: unknown): CashStatusSummary => {
  const row = unpackObjectPayload(value);
  return {
    expectedCash: num(row.expectedCash),
    cashSales: num(row.cashSales),
    expenses: num(row.expenses),
    cashReturns: num(row.cashReturns),
  };
};

export const toDailyCloseSummary = (value: unknown): DailyCloseSummary => {
  const row = unpackObjectPayload(value);
  const totalSales = num(row.totalSales ?? row.total_sales);
  const totalReturns = num(row.totalReturns ?? row.total_returns);
  const netSales = num(row.netSales ?? row.net_sales ?? (totalSales - totalReturns));
  const totalExpenses = num(row.totalExpenses ?? row.total_expenses);
  const profit = num(row.profit ?? row.utility);

  const totalsByMethodRaw = asRecord(row.totalsByMethod ?? row.totals_by_method);
  const totalsByMethod = Object.fromEntries(
    Object.entries(totalsByMethodRaw).map(([k, v]) => [String(k), num(v)]),
  );

  return {
    totalSales,
    totalReturns,
    netSales,
    profit,
    totalExpenses,
    net: num(row.net ?? (netSales - totalExpenses)),
    totalsByMethod,
  };
};
