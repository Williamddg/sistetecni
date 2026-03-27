import { getDb } from '../db';

export const reportDailyClose = (from: string, to: string) => {
  const db = getDb();

  const totalsByMethodRows = db
    .prepare(
      `SELECT payment_method, SUM(total) as total
       FROM sales
       WHERE date BETWEEN ? AND ?
       GROUP BY payment_method`,
    )
    .all(from, to) as Array<{ payment_method: string; total: number }>;

  const totalsByMethod: Record<string, number> = {};
  let totalSales = 0;

  for (const r of totalsByMethodRows) {
    const pm = String(r.payment_method ?? 'OTRO');
    const t = Number(r.total ?? 0);
    totalsByMethod[pm] = (totalsByMethod[pm] ?? 0) + t;
    totalSales += t;
  }

  const prow = db
    .prepare(
      `SELECT SUM(si.line_total - (si.unit_cost * si.qty)) as profit
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.date BETWEEN ? AND ?
         AND si.product_id IS NOT NULL`,
    )
    .get(from, to) as { profit?: number } | undefined;

  const profit = Number(prow?.profit ?? 0);

  return {
    from,
    to,
    totalSales,
    profit,
    totalsByMethod,
  };
};

export const getTodaySummary = (): unknown => {
  const db = getDb();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  return db
    .prepare(
      `SELECT
        (SELECT COALESCE(SUM(total),0) FROM sales WHERE date BETWEEN ? AND ?) as total_sales,
        (SELECT COALESCE(SUM(total),0) FROM sales WHERE date BETWEEN ? AND ? AND payment_method = ?) as cash_sales,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date BETWEEN ? AND ?) as total_expenses,
        (SELECT COALESCE(SUM(si.qty * COALESCE(si.unit_cost, p.purchase_price, 0)),0)
          FROM sale_items si
          JOIN sales s ON s.id = si.sale_id
          LEFT JOIN products p ON p.id = si.product_id
          WHERE s.date BETWEEN ? AND ?) as total_costs`,
    )
    .get(start, end, start, end, 'EFECTIVO', start, end, start, end);
};

export const getLast7DaysSales = (): unknown[] => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  return getDb()
    .prepare('SELECT substr(date,1,10) as day, COALESCE(SUM(total),0) as total FROM sales WHERE date BETWEEN ? AND ? GROUP BY day ORDER BY day')
    .all(from.toISOString(), to.toISOString());
};

export const reportSalesByDay = (from: string, to: string): unknown[] =>
  getDb().prepare('SELECT substr(date,1,10) as day, SUM(total) as total FROM sales WHERE date BETWEEN ? AND ? GROUP BY day ORDER BY day').all(from, to);

export const reportTopProducts = (from: string, to: string): unknown[] =>
  getDb()
    .prepare(
      `SELECT
         COALESCE(
           NULLIF(TRIM(COALESCE(p.name,'')), ''),
           NULLIF(TRIM(COALESCE(p.brand,'') || ' ' || COALESCE(p.model,'')), ''),
           'Producto'
         ) AS name,
         SUM(si.qty) AS qty
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       LEFT JOIN products p ON p.id = si.product_id
       WHERE s.date BETWEEN ? AND ?
         AND si.product_id IS NOT NULL
       GROUP BY si.product_id, name
       ORDER BY qty DESC
       LIMIT 10`,
    )
    .all(from, to);

export const reportSummary = (from: string, to: string): unknown =>
  getDb()
    .prepare(
      `SELECT
        (SELECT COALESCE(SUM(total),0) FROM sales WHERE date BETWEEN ? AND ?) as total_sales,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date BETWEEN ? AND ?) as total_expenses,
        (SELECT COALESCE(SUM(si.qty * COALESCE(si.unit_cost, p.purchase_price, 0)),0)
          FROM sale_items si
          JOIN sales s ON s.id = si.sale_id
          LEFT JOIN products p ON p.id = si.product_id
          WHERE s.date BETWEEN ? AND ?) as total_costs`,
    )
    .get(from, to, from, to, from, to);
