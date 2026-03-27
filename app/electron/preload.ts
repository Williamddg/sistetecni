import { contextBridge } from 'electron';
import { api } from './preload/api';

contextBridge.exposeInMainWorld('api', api);
