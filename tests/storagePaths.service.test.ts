import fs from 'node:fs';
import path from 'node:path';
import {
  ensureUserDataSubdir,
  getUserDataFilePath,
  getUserDataPath,
} from '../app/electron/services/storagePaths.service';

describe('storagePaths.service', () => {
  test('resolves userData paths consistently and creates subdir recursively', () => {
    const base = getUserDataPath();
    expect(base).toBe('/tmp');

    const cfg = getUserDataFilePath('config.json');
    expect(cfg).toBe(path.join('/tmp', 'config.json'));

    const dir = ensureUserDataSubdir('invoices');
    expect(dir).toBe(path.join('/tmp', 'invoices'));
    expect(fs.existsSync(dir)).toBe(true);
  });
});
