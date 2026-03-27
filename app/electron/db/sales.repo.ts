import { createSale } from './queries'; // SQLite
import { createSaleMySql } from './mysql/sales.mysql';
import { markFallbackOperation, resolveSensitiveOperationPlan } from './fallbackControl';

export const createSaleRepo = async (input: any): Promise<{ saleId: string; invoiceNumber: string }> => {
  const plan = await resolveSensitiveOperationPlan('sales:create');

  if (plan.mode === 'mysql') {
    return await createSaleMySql(input);
  }

  const result = createSale(input);
  markFallbackOperation(plan, {
    schemaVersion: 2,
    input: {
      ...(input as any),
      id: result.saleId,
    },
    sqliteRef: {
      saleId: result.saleId,
      invoiceNumber: result.invoiceNumber,
    },
  });

  return result;
};
