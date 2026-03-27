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
    saleId: result.saleId,
    invoiceNumber: result.invoiceNumber,
    total: (input as any)?.total,
    paymentMethod: (input as any)?.paymentMethod,
  });

  return result;
};
