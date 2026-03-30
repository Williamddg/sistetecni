import { ipc } from './ipcClient';
import { getAuthContext } from './session';

type AnyRecord = Record<string, unknown>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => String(v ?? '');
const num = (v: unknown): number => Number(v ?? 0);

export type ProductRow = {
  id: string;
  name?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price?: number;
  sale_price?: number;
  stock?: number;
  min_stock?: number;
  notes?: string;
};

export type ProductUpsertInput = {
  id?: string;
  name: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  notes?: string;
};

const toProductRow = (value: unknown): ProductRow | null => {
  const row = asRecord(value);
  const id = str(row.id).trim();
  if (!id) return null;
  return {
    id,
    name: str(row.name || '').trim() || undefined,
    barcode: str(row.barcode || '').trim() || undefined,
    category: str(row.category || '').trim() || undefined,
    unit: str(row.unit || '').trim() || undefined,
    purchase_price: num(row.purchase_price),
    sale_price: num(row.sale_price),
    stock: num(row.stock),
    min_stock: num(row.min_stock),
    notes: str(row.notes || '').trim() || undefined,
  };
};

export const listProducts = async (q = ''): Promise<ProductRow[]> =>
  asArray(await ipc.products.list({ ...getAuthContext(), search: q }))
    .map(toProductRow)
    .filter((p): p is ProductRow => Boolean(p));

export const listPosProducts = (q = '') =>
  ipc.products.listForPos({ ...getAuthContext(), search: q });

// ✅ USAR byBarcode (canal products:by-barcode) + auth context
export const getProductByBarcode = (barcode: string) =>
  ipc.products.byBarcode({ ...getAuthContext(), barcode });

export const saveProduct = (p: ProductUpsertInput) =>
  ipc.products.save({ ...getAuthContext(), product: p });

export const updateProduct = (p: ProductUpsertInput) => {
  if (import.meta.env.DEV) console.debug('[products:update] payload', p);
  return ipc.products.update({ ...getAuthContext(), product: p });
};

export const archiveProduct = (id: string) =>
  ipc.products.archive({ ...getAuthContext(), id });
