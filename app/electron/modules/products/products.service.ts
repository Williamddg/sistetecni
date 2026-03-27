import { logAudit } from '../../db/queries';
import {
  archiveProductRepo,
  listPosProductsRepo,
  listProductsRepo,
  updateProductRepo,
  upsertProductRepo,
  getProductByBarcodeRepo,
} from '../../db/products.repo';

export const getProductByBarcodeService = async (payload: any): Promise<any> => {
  const barcode = String((payload as any)?.barcode ?? '').trim();
  if (!barcode) return null;
  return await getProductByBarcodeRepo(barcode);
};

export const listPosProductsService = async (payload: any): Promise<unknown[]> => {
  const search = String((payload as any)?.search ?? '');
  return await listPosProductsRepo(search);
};

export const listProductsService = async (payload: any): Promise<unknown[]> => {
  const search = String((payload as any)?.search ?? '');
  return await listProductsRepo(search);
};

export const saveProductService = async (payload: any): Promise<string> => {
  const product = (payload as any)?.product ?? payload;
  const id = await upsertProductRepo(product);

  const actorId = String((payload as any)?.userId ?? '');
  if (actorId) {
    try {
      logAudit({
        actorId,
        action: 'PRODUCT_SAVE',
        entityType: 'PRODUCT',
        entityId: id,
        metadata: {
          brand: product?.brand,
          model: product?.model,
          name: product?.name,
          barcode: product?.barcode,
        },
      });
    } catch {}
  }

  return id;
};

export const updateProductService = async (payload: any): Promise<{ ok: true; id: string; product: unknown }> => {
  const productPayload = (payload as any)?.product ?? payload;
  const id = String(productPayload?.id ?? '').trim();
  if (!id) throw new Error('Missing product id');

  const product = await updateProductRepo(productPayload);

  const actorId = String((payload as any)?.userId ?? '');
  if (actorId) {
    try {
      logAudit({
        actorId,
        action: 'PRODUCT_UPDATE',
        entityType: 'PRODUCT',
        entityId: id,
        metadata: {
          stock: productPayload?.stock,
          sale_price: productPayload?.sale_price,
          barcode: productPayload?.barcode,
        },
      });
    } catch {}
  }

  return { ok: true, id, product };
};

export const archiveProductService = async (payload: any): Promise<boolean> => {
  const id = String((payload as any)?.id ?? payload).trim();
  if (!id) throw new Error('Missing product id');

  await archiveProductRepo(id);

  const actorId = String((payload as any)?.userId ?? '');
  if (actorId) {
    try {
      logAudit({
        actorId,
        action: 'PRODUCT_DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        metadata: { archived: true },
      });
    } catch {}
  }

  return true;
};
