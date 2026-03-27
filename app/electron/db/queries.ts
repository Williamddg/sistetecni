// app/electron/db/queries.ts
// Facade de compatibilidad: mantiene el mismo contrato público mientras
// la implementación interna se organiza por dominios.

export type { Role, AuditLogAction, AuditEntityType } from './queries/types';

export { authUser } from './queries/auth.queries';

export {
  changeUserPassword,
  listUsers,
  listUsersBasic,
  createUser,
  resetUserPassword,
} from './queries/users.queries';

export {
  listProducts,
  listPosProducts,
  upsertProduct,
  updateProduct,
  archiveProduct,
} from './queries/products.queries';

export {
  nextInvoiceNumber,
  createSale,
  createSaleReturn,
  suspendSale,
  listSuspendedSales,
  getSuspendedSale,
  deleteSuspendedSale,
  listRecentSales,
  getSaleDetail,
} from './queries/sales.queries';

export {
  addExpense,
  listExpenses,
} from './queries/expenses.queries';

export {
  getLastCashClosure,
  getOpenSuggestion,
  openCash,
  getOpenCash,
  getCashStatus,
  closeCash,
} from './queries/cash.queries';

export {
  reportDailyClose,
  getTodaySummary,
  getLast7DaysSales,
  reportSalesByDay,
  reportTopProducts,
  reportSummary,
} from './queries/reports.queries';

export {
  logAudit,
  listAuditLogs,
} from './queries/audit.queries';

export {
  listSuppliers,
  createSupplier,
  createPurchase,
} from './queries/purchases.queries';
