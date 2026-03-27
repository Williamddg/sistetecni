// SQLite fallback
import { addExpense, listExpenses } from './queries';

// MySQL
import { addExpenseMySql, listExpensesMySql } from './mysql/expenses.mysql';
import { markFallbackOperation, resolveSensitiveOperationPlan } from './fallbackControl';

export const addExpenseRepo = async (payloadOrExpense: any): Promise<string> => {
  // ✅ acepta cualquiera:
  // - addExpenseRepo({ expense: {...}, userId, ... })
  // - addExpenseRepo({ date, concept, amount, ... })
  const expense = (payloadOrExpense as any)?.expense ?? payloadOrExpense;
  const plan = await resolveSensitiveOperationPlan('expenses:add');

  if (plan.mode === 'mysql') {
    return await addExpenseMySql(expense);
  }

  const id = await addExpense(expense);
  markFallbackOperation(plan, {
    schemaVersion: 2,
    input: {
      ...(expense as any),
      id,
    },
    sqliteRef: { expenseId: id },
  });

  return id;
};

export const listExpensesRepo = async (from: string, to: string): Promise<any[]> => {
  const plan = await resolveSensitiveOperationPlan('expenses:add');

  if (plan.mode === 'mysql') {
    const rows = await listExpensesMySql(from, to);
    return Array.isArray(rows) ? rows : [];
  }

  const rows = await listExpenses(from, to);
  return Array.isArray(rows) ? (rows as any[]) : [];
};
