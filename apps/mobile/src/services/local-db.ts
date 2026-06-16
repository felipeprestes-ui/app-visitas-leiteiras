import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import type {
  ClientRecord,
  PropertyRecord,
  ScheduleRecord,
  VisitRecord
} from "@app/types";
import type { SyncQueueItem } from "../features/sync/types";

const database = SQLite.openDatabaseSync("visitas-leiteiras.db");

export async function bootstrapDatabase() {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_local_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      retry_count INTEGER NOT NULL,
      last_error TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

export async function persistSession<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readSession<T>(key: string) {
  const rawValue = await AsyncStorage.getItem(key);
  return rawValue ? (JSON.parse(rawValue) as T) : null;
}

export async function getClients() {
  return readRows<ClientRecord>("clients");
}

export async function getProperties() {
  return readRows<PropertyRecord>("properties");
}

export async function getSchedules() {
  return readRows<ScheduleRecord>("schedules");
}

export async function getVisits() {
  return readRows<VisitRecord>("visits");
}

export async function getSyncQueue() {
  const result = database.getAllSync<{ [key: string]: unknown }>("SELECT * FROM sync_queue ORDER BY created_at ASC");

  return result.map((row) => ({
    id: String(row.id),
    entityLocalId: String(row.entity_local_id),
    entityType: row.entity_type as SyncQueueItem["entityType"],
    operation: row.operation as SyncQueueItem["operation"],
    payload: JSON.parse(String(row.payload)),
    status: row.status as SyncQueueItem["status"],
    retryCount: Number(row.retry_count),
    lastError: row.last_error ? String(row.last_error) : undefined,
    createdAt: String(row.created_at)
  }));
}

export async function insertClient(client: ClientRecord) {
  upsertRecord("clients", client.id, client);
  enqueueSync("client", client.id, "create", client);
}

export async function insertProperty(property: PropertyRecord) {
  upsertRecord("properties", property.id, property);
  enqueueSync("property", property.id, "create", property);
}

export async function insertSchedule(schedule: ScheduleRecord) {
  upsertRecord("schedules", schedule.id, schedule);
  enqueueSync("schedule", schedule.id, "create", schedule);
}

export async function insertVisit(visit: VisitRecord) {
  upsertRecord("visits", visit.id, visit);
  enqueueSync("visit", visit.id, "create", visit);
}

export async function replaceManyClients(clients: ClientRecord[]) {
  replaceRecords("clients", clients);
}

export async function replaceManyProperties(properties: PropertyRecord[]) {
  replaceRecords("properties", properties);
}

export async function replaceManySchedules(schedules: ScheduleRecord[]) {
  replaceRecords("schedules", schedules);
}

export async function replaceManyVisits(visits: VisitRecord[]) {
  replaceRecords("visits", visits);
}

export async function upsertManyClients(clients: ClientRecord[]) {
  upsertMany("clients", clients);
}

export async function upsertManyProperties(properties: PropertyRecord[]) {
  upsertMany("properties", properties);
}

export async function upsertManySchedules(schedules: ScheduleRecord[]) {
  upsertMany("schedules", schedules);
}

export async function upsertManyVisits(visits: VisitRecord[]) {
  upsertMany("visits", visits);
}

export async function updateSyncQueueItemStatus(
  id: string,
  status: SyncQueueItem["status"],
  lastError?: string
) {
  database.runSync(
    "UPDATE sync_queue SET status = ?, last_error = ?, retry_count = retry_count + 1 WHERE id = ?",
    [status, lastError ?? null, id]
  );
}

export async function deleteSyncQueueItems(ids: string[]) {
  for (const id of ids) {
    database.runSync("DELETE FROM sync_queue WHERE id = ?", [id]);
  }
}

function readRows<T>(tableName: "clients" | "properties" | "schedules" | "visits") {
  const rows = database.getAllSync<{ data: string }>(`SELECT data FROM ${tableName}`);
  return rows.map((row) => JSON.parse(row.data) as T);
}

function replaceRecords<T extends { id: string }>(
  tableName: "clients" | "properties" | "schedules" | "visits",
  records: T[]
) {
  database.execSync(`DELETE FROM ${tableName};`);

  for (const record of records) {
    upsertRecord(tableName, record.id, record);
  }
}

function upsertMany<T extends { id: string }>(
  tableName: "clients" | "properties" | "schedules" | "visits",
  records: T[]
) {
  for (const record of records) {
    upsertRecord(tableName, record.id, record);
  }
}

function upsertRecord(
  tableName: "clients" | "properties" | "schedules" | "visits",
  id: string,
  data: unknown
) {
  database.runSync(`INSERT OR REPLACE INTO ${tableName} (id, data) VALUES (?, ?)`, [
    id,
    JSON.stringify(data)
  ]);
}

function enqueueSync(
  entityType: SyncQueueItem["entityType"],
  entityLocalId: string,
  operation: SyncQueueItem["operation"],
  payload: unknown
) {
  const id = `${entityType}-${entityLocalId}`;

  database.runSync(
    "INSERT OR REPLACE INTO sync_queue (id, entity_local_id, entity_type, operation, payload, status, retry_count, last_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      entityLocalId,
      entityType,
      operation,
      JSON.stringify(payload),
      "pending",
      0,
      null,
      new Date().toISOString()
    ]
  );
}