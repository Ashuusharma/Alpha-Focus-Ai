import { promises as fs } from "fs";
import path from "path";

type AuditEvent = {
  action: string;
  userId: string;
  ok: boolean;
  route: string;
  detail?: string;
  at?: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const AUDIT_FILE = path.join(DATA_DIR, "audit.log");

export async function writeAuditLog(event: AuditEvent) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const line = JSON.stringify({
    ...event,
    at: event.at || new Date().toISOString(),
  });
  await fs.appendFile(AUDIT_FILE, `${line}\n`, "utf8");
}
