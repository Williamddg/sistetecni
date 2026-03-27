import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export const nextInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const pref = `ST-${year}-`;
  const row = getDb()
    .prepare('SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1')
    .get(`${pref}%`) as { invoice_number?: string } | undefined;
  const n = row?.invoice_number ? Number(row.invoice_number.split('-')[2]) + 1 : 1;
  return `${pref}${String(n).padStart(6, '0')}`;
};

export const createSale = (input: any): { saleId: string; invoiceNumber: string } => {
  const db = getDb();
  const saleId = uuid();
  const invoiceNumber = nextInvoiceNumber();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO sales (id,invoice_number,date,user_id,payment_method,subtotal,discount,total,customer_name,customer_id,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      saleId,
      invoiceNumber,
      now,
      input.userId,
      input.paymentMethod,
      input.subtotal,
      input.discount,
      input.total,
      input.customerName ?? '',
      input.customerId ?? '',
      now,
    );

    for (const item of input.items) {
      const isFreeItem = item.product_id == null;
      if (isFreeItem) {
        const description = String(item.description ?? '').trim();
        if (!description) throw new Error('Descripción requerida para ítem libre.');
        const unitCost = Math.max(0, Number(item.unit_cost ?? 0));
        if (item.unit_price < 0 || item.qty < 1 || unitCost < 0) throw new Error('Valores inválidos para ítem libre.');
        db.prepare('INSERT INTO sale_items (id,sale_id,product_id,qty,unit_price,line_total,description,unit_cost) VALUES (?,?,?,?,?,?,?,?)').run(
          uuid(),
          saleId,
          null,
          item.qty,
          item.unit_price,
          item.line_total,
          description,
          unitCost,
        );
        continue;
      }

      const product = db.prepare('SELECT stock, purchase_price FROM products WHERE id=?').get(item.product_id) as
        | { stock: number; purchase_price: number }
        | undefined;
      if (!product || item.qty > product.stock) {
        throw new Error('Stock insuficiente para uno de los productos.');
      }
      db.prepare('INSERT INTO sale_items (id,sale_id,product_id,qty,unit_price,line_total,description,unit_cost) VALUES (?,?,?,?,?,?,?,?)').run(
        uuid(),
        saleId,
        item.product_id,
        item.qty,
        item.unit_price,
        item.line_total,
        String(item.description ?? ''),
        Number(product?.purchase_price ?? 0),
      );
      db.prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?').run(item.qty, now, item.product_id);
    }
  });

  tx();
  return { saleId, invoiceNumber };
};

export const createSaleReturn = (data: any): string => {
  const db = getDb();
  const returnId = uuid();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO sale_returns
      (id,sale_id,user_id,reason,total_returned,created_at)
      VALUES (?,?,?,?,?,?)
    `).run(returnId, data.saleId, data.userId, data.reason ?? '', data.total ?? 0, now);

    for (const item of data.items ?? []) {
      db.prepare(`
        INSERT INTO sale_return_items
        (id,return_id,sale_item_id,product_id,qty,unit_price,line_total,description)
        VALUES (?,?,?,?,?,?,?,?)
      `).run(
        uuid(),
        returnId,
        item.sale_item_id,
        item.product_id,
        item.qty,
        item.unit_price,
        item.line_total,
        item.description ?? '',
      );

      if (item.product_id) {
        db.prepare(`
          UPDATE products
          SET stock = stock + ?
          WHERE id = ?
        `).run(item.qty, item.product_id);
      }
    }
  });

  tx();

  return returnId;
};

export const suspendSale = (data: any): string => {
  const db = getDb();
  const id = uuid();
  const tempNumber = `TMP-${Date.now()}`;
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO suspended_sales
      (id,temp_number,user_id,customer_name,customer_id,subtotal,discount,total,payment_method,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id,
      tempNumber,
      data.userId,
      data.customerName ?? '',
      data.customerId ?? '',
      data.subtotal ?? 0,
      data.discount ?? 0,
      data.total ?? 0,
      data.paymentMethod ?? 'EFECTIVO',
      now,
      now,
    );

    for (const item of data.items ?? []) {
      db.prepare(`
        INSERT INTO suspended_sale_items
        (id,suspended_sale_id,product_id,name,description,qty,unit_price,line_total,stock,unit_cost)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `).run(
        uuid(),
        id,
        item.product_id,
        item.name,
        item.description ?? '',
        item.qty,
        item.unit_price,
        item.line_total,
        item.stock ?? null,
        item.unit_cost ?? 0,
      );
    }
  });

  tx();
  return id;
};

export const listSuspendedSales = (): unknown[] =>
  getDb()
    .prepare(`
      SELECT id,temp_number,customer_name,total,created_at
      FROM suspended_sales
      ORDER BY created_at DESC
    `)
    .all();

export const getSuspendedSale = (id: string): any => {
  const db = getDb();

  const sale = db.prepare(`SELECT * FROM suspended_sales WHERE id = ?`).get(id);

  if (!sale) return null;

  const items = db
    .prepare(`
      SELECT *
      FROM suspended_sale_items
      WHERE suspended_sale_id = ?
    `)
    .all(id);

  return { ...sale, items };
};

export const deleteSuspendedSale = (id: string): void => {
  const db = getDb();

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM suspended_sale_items WHERE suspended_sale_id=?`).run(id);
    db.prepare(`DELETE FROM suspended_sales WHERE id=?`).run(id);
  });

  tx();
};

export const listRecentSales = (limit = 20): unknown[] =>
  getDb()
    .prepare(`
      SELECT id,invoice_number,date,total,payment_method,customer_name
      FROM sales
      ORDER BY date DESC
      LIMIT ?
    `)
    .all(limit);

export const getSaleDetail = (saleId: string): any => {
  const db = getDb();

  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(saleId);

  if (!sale) return null;

  const items = db
    .prepare(`
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
    `)
    .all(saleId);

  return { ...sale, items };
};
