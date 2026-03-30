import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildBackupFileName,
  createBackupSnapshot,
  ensureDailyBackupSnapshot,
  exportCurrentDatabaseTo,
  pruneBackups,
  restoreCurrentDatabaseFrom,
} from '../app/electron/services/backups.service';

const backupMock = jest.fn<Promise<void>, [string]>();
const getDbPathMock = jest.fn<string, []>();

jest.mock('../app/electron/db/db', () => ({
  getDb: () => ({ backup: backupMock }),
  getDbPath: () => getDbPathMock(),
}));

const ensureUserDataSubdirMock = jest.fn<string, [string]>();
jest.mock('../app/electron/services/storagePaths.service', () => ({
  ensureUserDataSubdir: (dir: string) => ensureUserDataSubdirMock(dir),
}));

describe('backups.service', () => {
  let tmpRoot: string;
  let backupsDir: string;
  let dataDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sistetecni-backups-service-'));
    backupsDir = path.join(tmpRoot, 'backups');
    dataDir = path.join(tmpRoot, 'data');
    dbPath = path.join(dataDir, 'sistetecni-pos.db');
    fs.mkdirSync(backupsDir, { recursive: true });
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dbPath, 'db-content');

    ensureUserDataSubdirMock.mockReset();
    ensureUserDataSubdirMock.mockReturnValue(backupsDir);

    getDbPathMock.mockReset();
    getDbPathMock.mockReturnValue(dbPath);

    backupMock.mockReset();
    backupMock.mockImplementation(async (out) => {
      fs.writeFileSync(out, 'backup-content');
    });
  });

  test('buildBackupFileName keeps expected naming contract', () => {
    const fileName = buildBackupFileName(new Date('2026-03-29T15:06:00.000Z'));
    expect(fileName).toBe('sistetecni-pos-2026-03-29-15-06.db');
  });

  test('createBackupSnapshot creates db backup and keeps only recent files with prune', async () => {
    for (let i = 0; i < 35; i += 1) {
      const p = path.join(backupsDir, `old-${String(i).padStart(2, '0')}.db`);
      fs.writeFileSync(p, String(i));
      const m = new Date(2026, 0, 1, 0, i).getTime();
      fs.utimesSync(p, m / 1000, m / 1000);
    }

    const out = await createBackupSnapshot('manual');

    expect(fs.existsSync(out)).toBe(true);
    expect(backupMock).toHaveBeenCalledTimes(1);

    const remaining = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.db'));
    expect(remaining.length).toBe(30);
  });

  test('ensureDailyBackupSnapshot avoids duplicate same-day backup', async () => {
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(backupsDir, `sistetecni-pos-${today}-08-00.db`), 'existing');

    const result = await ensureDailyBackupSnapshot();

    expect(result).toBeNull();
    expect(backupMock).not.toHaveBeenCalled();
  });

  test('export and restore copy database files through db path helpers', () => {
    const exportDir = path.join(tmpRoot, 'exports');
    fs.mkdirSync(exportDir, { recursive: true });

    const exported = exportCurrentDatabaseTo(exportDir);
    expect(fs.existsSync(exported)).toBe(true);
    expect(fs.readFileSync(exported, 'utf8')).toBe('db-content');

    fs.writeFileSync(exported, 'restored-content');
    restoreCurrentDatabaseFrom(exported);

    expect(fs.readFileSync(dbPath, 'utf8')).toBe('restored-content');
  });

  test('pruneBackups keeps at least one backup when maxBackups is less than one', () => {
    const only = path.join(backupsDir, 'single.db');
    fs.writeFileSync(only, 'x');

    pruneBackups(backupsDir, 0);

    expect(fs.existsSync(only)).toBe(true);
  });
});
