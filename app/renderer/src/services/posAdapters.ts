type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string => String(value ?? '');
const num = (value: unknown): number => Number(value ?? 0);

export type PosProduct = {
  id: string;
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  cpu?: string;
  stock?: number | null;
  sale_price?: number;
  unit_cost?: number;
};

export type DrawerPort = { path: string; friendlyName?: string };
export type DrawerPrinter = { name: string };

export type DrawerOpenPayload = {
  mode?: 'printer' | 'serial';
  printerName?: string;
  port?: string;
  baudRate?: number;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  commandHex?: string;
  appendCR?: boolean;
  appendLF?: boolean;
  timeoutMs?: number;
};

export type DrawerOpenResult = {
  ok: boolean;
  message?: string;
  port?: string;
  printerName?: string;
  mode?: string;
};

export type SaleDetailItem = {
  id: string;
  product_id?: string | null;
  name?: string;
  description?: string;
  qty?: number;
  unit_price?: number;
  line_total?: number;
  stock?: number | null;
  unit_cost?: number;
};

export type SuspendedSaleRow = {
  id: string;
  temp_number?: string;
  tempNumber?: string;
  customer_name?: string;
  customerName?: string;
  total?: number;
};

export type RecentSaleRow = {
  id: string;
  invoice_number?: string;
  invoiceNumber?: string;
  customer_name?: string;
  customerName?: string;
  total?: number;
};

export type SaleDetail = {
  id: string;
  invoice_number?: string;
  invoiceNumber?: string;
  date?: string;
  user_name?: string;
  user_email?: string;
  payment_method?: string;
  customer_name?: string;
  customerName?: string;
  customer_id?: string;
  subtotal?: number;
  discount?: number;
  total?: number;
  items?: SaleDetailItem[];
};

export type SuspendedSaleDetail = {
  discount?: number;
  payment_method?: string;
  customer_name?: string;
  customer_id?: string;
  items: SaleDetailItem[];
};

export type ReturnSalePayload = {
  saleId: string;
  userId: string;
  reason: string;
  items: Array<{ sale_item_id: string; qty: number }>;
};

export const toPosProduct = (value: unknown): PosProduct | null => {
  const row = asRecord(value);
  const id = str(row.id).trim();
  if (!id) return null;

  return {
    id,
    name: str(row.name || '').trim() || undefined,
    brand: str(row.brand || '').trim() || undefined,
    model: str(row.model || '').trim() || undefined,
    sku: str(row.sku || '').trim() || undefined,
    barcode: str(row.barcode || '').trim() || undefined,
    cpu: str(row.cpu || '').trim() || undefined,
    stock: row.stock == null ? null : num(row.stock),
    sale_price: num(row.sale_price),
    unit_cost: num(row.unit_cost),
  };
};

export const toPosProducts = (value: unknown): PosProduct[] => {
  return asArray(value)
    .map(toPosProduct)
    .filter((p): p is PosProduct => Boolean(p));
};

export const toDrawerPorts = (value: unknown): DrawerPort[] => {
  return asArray(value).map((item) => {
    const row = asRecord(item);
    return {
      path: str(row.path),
      friendlyName: str(row.friendlyName || '').trim() || undefined,
    };
  }).filter((p) => p.path);
};

export const toDrawerPrinters = (value: unknown): DrawerPrinter[] => {
  return asArray(value).map((item) => {
    const row = asRecord(item);
    return { name: str(row.name).trim() };
  }).filter((p) => p.name);
};

export const toSuspendedRows = (value: unknown): SuspendedSaleRow[] => {
  return asArray(value).map((item) => {
    const row = asRecord(item);
    return {
      id: str(row.id),
      temp_number: str(row.temp_number || '').trim() || undefined,
      tempNumber: str(row.tempNumber || '').trim() || undefined,
      customer_name: str(row.customer_name || '').trim() || undefined,
      customerName: str(row.customerName || '').trim() || undefined,
      total: num(row.total),
    };
  }).filter((r) => r.id);
};

export const toRecentRows = (value: unknown): RecentSaleRow[] => {
  return asArray(value).map((item) => {
    const row = asRecord(item);
    return {
      id: str(row.id),
      invoice_number: str(row.invoice_number || '').trim() || undefined,
      invoiceNumber: str(row.invoiceNumber || '').trim() || undefined,
      customer_name: str(row.customer_name || '').trim() || undefined,
      customerName: str(row.customerName || '').trim() || undefined,
      total: num(row.total),
    };
  }).filter((r) => r.id);
};

const toSaleDetailItem = (value: unknown): SaleDetailItem => {
  const row = asRecord(value);
  return {
    id: str(row.id),
    product_id: row.product_id == null ? null : str(row.product_id),
    name: str(row.name || '').trim() || undefined,
    description: str(row.description || '').trim() || undefined,
    qty: num(row.qty),
    unit_price: num(row.unit_price),
    line_total: num(row.line_total),
    stock: row.stock == null ? null : num(row.stock),
    unit_cost: num(row.unit_cost),
  };
};

export const toSaleDetail = (value: unknown): SaleDetail | null => {
  const row = asRecord(value);
  const id = str(row.id).trim();
  if (!id) return null;

  return {
    id,
    invoice_number: str(row.invoice_number || '').trim() || undefined,
    invoiceNumber: str(row.invoiceNumber || '').trim() || undefined,
    date: str(row.date || '').trim() || undefined,
    user_name: str(row.user_name || '').trim() || undefined,
    user_email: str(row.user_email || '').trim() || undefined,
    payment_method: str(row.payment_method || '').trim() || undefined,
    customer_name: str(row.customer_name || '').trim() || undefined,
    customerName: str(row.customerName || '').trim() || undefined,
    customer_id: str(row.customer_id || '').trim() || undefined,
    subtotal: num(row.subtotal),
    discount: num(row.discount),
    total: num(row.total),
    items: asArray(row.items).map(toSaleDetailItem),
  };
};

export const toSuspendedSaleDetail = (value: unknown): SuspendedSaleDetail | null => {
  const row = asRecord(value);
  const items = asArray(row.items).map(toSaleDetailItem);
  if (items.length === 0) return null;

  return {
    discount: num(row.discount),
    payment_method: str(row.payment_method || '').trim() || undefined,
    customer_name: str(row.customer_name || '').trim() || undefined,
    customer_id: str(row.customer_id || '').trim() || undefined,
    items,
  };
};
