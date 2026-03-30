import type {
  DrawerOpenPayload,
  DrawerOpenResult,
  DrawerPort,
  DrawerPrinter,
} from './posAdapters';

declare global {
  interface Window {
    api: any;
  }
}

const api = window.api ?? {};

export const ipc = {
  ...api,

  cashdrawer: {
    listPorts: async (): Promise<DrawerPort[]> => {
      try {
        return (await api.cashdrawer?.listPorts?.()) ?? [];
      } catch {
        return [];
      }
    },

    listPrinters: async (): Promise<DrawerPrinter[]> => {
      try {
        return (await api.cashdrawer?.listPrinters?.()) ?? [];
      } catch {
        return [];
      }
    },

    open: async (payload: DrawerOpenPayload): Promise<DrawerOpenResult> => {
      try {
        if (!api.cashdrawer?.open) return { ok: false, message: 'Cajón no configurado aún.' };
        return await api.cashdrawer.open(payload);
      } catch (e: any) {
        return { ok: false, message: String(e?.message ?? e) };
      }
    },
  },
};
