export type SyncQueueItemStatus = "pending" | "processing" | "error" | "synced";

export type SyncEntityType = "client" | "property" | "visit" | "schedule";

export type SyncOperation = "create" | "update";

export type SyncQueueItem = {
  id: string;
  entityType: SyncEntityType;
  entityLocalId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncQueueItemStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
};