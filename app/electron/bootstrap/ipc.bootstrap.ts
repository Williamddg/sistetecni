import { registerAuthIpc } from '../ipc/auth.ipc';
import { registerProductsIpc } from '../ipc/products.ipc';
import { registerSalesIpc } from '../ipc/sales.ipc';
import { registerExpensesIpc } from '../ipc/expenses.ipc';
import { registerReportsIpc } from '../ipc/reports.ipc';
import { registerBackupsIpc } from '../ipc/backups.ipc';
import { registerCashIpc } from '../ipc/cash.ipc';
import { registerUsersIpc } from '../ipc/users.ipc';
import { registerAuditIpc } from '../ipc/audit.ipc';
import { registerMySqlIpc } from '../ipc/mysql.ipc';
import { registerConfigIpc } from '../ipc/config.ipc';
import { registerCashDrawerIpc } from '../ipc/cashdrawer.ipc';
import { registerInstallerIpc } from '../ipc/installer.ipc';
import { registerAutoDetectIpc } from '../ipc/autodetect.ipc';
import { registerSyncAdminIpc } from '../ipc/syncAdmin.ipc';

export const registerEarlyIpcHandlers = (): void => {
  registerAutoDetectIpc();
  registerInstallerIpc();
  registerMySqlIpc();
  registerCashDrawerIpc();
};

export const registerDomainIpcHandlers = (): void => {
  registerAuthIpc();
  registerProductsIpc();
  registerSalesIpc();
  registerExpensesIpc();
  registerReportsIpc();
  registerBackupsIpc();
  registerCashIpc();
  registerUsersIpc();
  registerAuditIpc();
  registerConfigIpc();
  registerSyncAdminIpc();
};
