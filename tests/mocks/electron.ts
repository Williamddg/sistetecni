type IpcHandler = (event: unknown, ...args: any[]) => any;

const handlers = new Map<string, IpcHandler>();

export const app = {
  getPath: () => '/tmp',
  relaunch: jest.fn(),
  exit: jest.fn(),
};

export const ipcMain = {
  handle: (channel: string, handler: IpcHandler) => {
    handlers.set(channel, handler);
  },
  removeHandler: (channel: string) => {
    handlers.delete(channel);
  },
  __invoke: async (channel: string, ...args: any[]) => {
    const h = handlers.get(channel);
    if (!h) throw new Error(`NO_HANDLER:${channel}`);
    return await h({ sender: { id: 1 } }, ...args);
  },
  __invokeAs: async (senderId: number, channel: string, ...args: any[]) => {
    const h = handlers.get(channel);
    if (!h) throw new Error(`NO_HANDLER:${channel}`);
    return await h({ sender: { id: senderId } }, ...args);
  },
  __reset: () => {
    handlers.clear();
  },
};

export const ipcRenderer = {
  invoke: jest.fn(async (_channel: string, ..._args: any[]) => undefined),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const BrowserWindow = {
  getAllWindows: () => [],
};

export const dialog = {
  showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] })),
  showSaveDialog: jest.fn(async () => ({ canceled: true, filePath: '' })),
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};
