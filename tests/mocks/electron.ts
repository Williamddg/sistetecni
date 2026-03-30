import { EventEmitter } from 'node:events';

type IpcHandler = (event: unknown, ...args: any[]) => any;

const handlers = new Map<string, IpcHandler>();
const senders = new Map<number, EventEmitter & { id: number }>();

const getSender = (senderId: number): EventEmitter & { id: number } => {
  const existing = senders.get(senderId);
  if (existing) return existing;

  const emitter = new EventEmitter() as EventEmitter & { id: number };
  emitter.id = senderId;
  senders.set(senderId, emitter);
  return emitter;
};

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
    return await h({ sender: getSender(1) }, ...args);
  },
  __invokeAs: async (senderId: number, channel: string, ...args: any[]) => {
    const h = handlers.get(channel);
    if (!h) throw new Error(`NO_HANDLER:${channel}`);
    return await h({ sender: getSender(senderId) }, ...args);
  },
  __destroySender: (senderId: number) => {
    const sender = senders.get(senderId);
    sender?.emit('destroyed');
    senders.delete(senderId);
  },
  __reset: () => {
    handlers.clear();
    senders.clear();
  },
};

export const ipcRenderer = {
  invoke: jest.fn(async (_channel: string, ..._args: any[]) => undefined),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const BrowserWindow = {
  getAllWindows: () => [],
  fromWebContents: () => ({ webContents: { send: jest.fn() } }),
};

export const dialog = {
  showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] })),
  showSaveDialog: jest.fn(async () => ({ canceled: true, filePath: '' })),
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};
