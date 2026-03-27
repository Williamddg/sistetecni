import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export const listProducts = (search = ''): unknown[] => {
  const q = `%${search}%`;
  return getDb()
    .prepare('SELECT * FROM products WHERE active = 1 AND (brand LIKE ? OR model LIKE ? OR cpu LIKE ?) ORDER BY created_at DESC')
    .all(q, q, q);
};

export const listPosProducts = (search = ''): unknown[] => {
  const q = `%${search}%`;
  return getDb()
    .prepare(
      'SELECT id,brand,model,cpu,ram_gb,storage,sale_price,stock FROM products WHERE active = 1 AND (brand LIKE ? OR model LIKE ? OR cpu LIKE ?) ORDER BY created_at DESC',
    )
    .all(q, q, q);
};

export const upsertProduct = (payload: any): string => {
  const now = new Date().toISOString();
  const id = payload.id ?? uuid();
  const existing = getDb().prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (existing) {
    updateProduct({ ...payload, id });
  } else {
    getDb()
      .prepare(
        `INSERT INTO products (id,brand,model,cpu,ram_gb,storage,condition,purchase_price,sale_price,stock,notes,active,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        payload.brand,
        payload.model,
        payload.cpu,
        payload.ram_gb,
        payload.storage,
        payload.condition,
        payload.purchase_price,
        payload.sale_price,
        payload.stock,
        payload.notes ?? '',
        1,
        now,
        now,
      );
  }
  return id;
};

export const updateProduct = (payload: any): unknown => {
  if (!payload?.id) throw new Error('Missing product id');

  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `UPDATE products SET brand=?,model=?,cpu=?,ram_gb=?,storage=?,condition=?,purchase_price=?,sale_price=?,stock=?,notes=?,updated_at=? WHERE id=?`,
    )
    .run(
      payload.brand,
      payload.model,
      payload.cpu,
      payload.ram_gb,
      payload.storage,
      payload.condition,
      payload.purchase_price,
      payload.sale_price,
      payload.stock,
      payload.notes ?? '',
      now,
      payload.id,
    );

  if (!result.changes) throw new Error('Product not updated');

  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(payload.id);
};

export const archiveProduct = (id: string): void => {
  getDb().prepare('UPDATE products SET active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
};
