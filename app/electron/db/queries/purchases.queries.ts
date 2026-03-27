import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export const listSuppliers = (): unknown[] =>
  getDb()
    .prepare(`SELECT * FROM suppliers WHERE active=1 ORDER BY name`)
    .all();

export const createSupplier = (data: any): string => {
  const id = uuid();
  const now = new Date().toISOString();

  getDb()
    .prepare(`
      INSERT INTO suppliers
      (id,name,contact_name,phone,email,address,notes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `)
    .run(id, data.name, data.contact_name ?? '', data.phone ?? '', data.email ?? '', data.address ?? '', data.notes ?? '', now, now);

  return id;
};

export const createPurchase = (data: any): string => {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO purchases
      (id,supplier_id,user_id,invoice_ref,date,subtotal,total,notes,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(id, data.supplier_id ?? null, data.userId, data.invoice_ref ?? '', now, data.subtotal ?? 0, data.total ?? 0, data.notes ?? '', now);

    for (const item of data.items ?? []) {
      db.prepare(`
        INSERT INTO purchase_items
        (id,purchase_id,product_id,qty,unit_cost,line_total)
        VALUES (?,?,?,?,?,?)
      `).run(uuid(), id, item.product_id, item.qty, item.unit_cost, item.line_total);

      db.prepare(`
        UPDATE products
        SET stock = stock + ?, purchase_price = ?
        WHERE id = ?
      `).run(item.qty, item.unit_cost, item.product_id);
    }
  });

  tx();

  return id;
};
