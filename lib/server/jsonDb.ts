import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");

type DatabaseShape = {
  users: Array<Record<string, unknown>>;
  sleepLogs: Array<Record<string, unknown>>;
  hydrationLogs: Array<Record<string, unknown>>;
  moodLogs: Array<Record<string, unknown>>;
  weeklyReports: Array<Record<string, unknown>>;
  scanHistory: Array<Record<string, unknown>>;
};

const DEFAULT_DB: DatabaseShape = {
  users: [],
  sleepLogs: [],
  hydrationLogs: [],
  moodLogs: [],
  weeklyReports: [],
  scanHistory: [],
};

let writeChain: Promise<void> = Promise.resolve();

function dbFile(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readCollection<T = Record<string, unknown>>(collection: keyof DatabaseShape): Promise<T[]> {
  await ensureDataDir();
  const file = dbFile(collection);

  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await fs.writeFile(file, JSON.stringify(DEFAULT_DB[collection], null, 2), "utf8");
    return [];
  }
}

export async function writeCollection<T = Record<string, unknown>>(collection: keyof DatabaseShape, value: T[]) {
  await ensureDataDir();
  const file = dbFile(collection);

  writeChain = writeChain.then(async () => {
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  });

  await writeChain;
}

export async function appendCollection<T extends Record<string, unknown>>(collection: keyof DatabaseShape, item: T): Promise<T> {
  const current = await readCollection<T>(collection);
  current.unshift(item);
  await writeCollection(collection, current);
  return item;
}
