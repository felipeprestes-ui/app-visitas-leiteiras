import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, View } from "react-native";
import type {
  AuthTokens,
  ClientRecord,
  PropertyRecord,
  ScheduleRecord,
  UserProfile,
  VisitRecord
} from "@app/types";
import type { MobileSession } from "../features/auth/types";
import { apiRequest } from "../services/api";
import {
  bootstrapDatabase,
  deleteSyncQueueItems,
  getClients,
  getProperties,
  getSchedules,
  getSyncQueue,
  getVisits,
  insertClient,
  insertProperty,
  insertSchedule,
  insertVisit,
  persistSession,
  readSession,
  replaceManyClients,
  replaceManyProperties,
  replaceManySchedules,
  replaceManyVisits,
  upsertManyClients,
  upsertManyProperties,
  upsertManySchedules,
  upsertManyVisits,
  updateSyncQueueItemStatus
} from "../services/local-db";
import type { SyncQueueItem } from "../features/sync/types";
import type { VisitFormValues } from "../features/visits/types";
import { createId } from "../utils/id";

type SyncState = {
  online: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
};

type LocalSummary = {
  clientCount: number;
  propertyCount: number;
  scheduleCount: number;
  visitCount: number;
  pendingSyncCount: number;
};

type CreateClientAndPropertyInput = {
  clientName: string;
  clientType: ClientRecord["clientType"];
  propertyName: string;
  consultantName: string;
  consultantArea: PropertyRecord["consultantArea"];
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
};

type CreateScheduleInput = {
  propertyId: string;
  scheduledAt: string;
  notes?: string;
};

type AppContextValue = {
  bootstrapComplete: boolean;
  loading: boolean;
  session: MobileSession | null;
  authTokens: AuthTokens | null;
  clients: ClientRecord[];
  properties: PropertyRecord[];
  schedules: ScheduleRecord[];
  visits: VisitRecord[];
  syncQueue: SyncQueueItem[];
  syncState: SyncState;
  localSummary: LocalSummary;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  createClientAndProperty: (input: CreateClientAndPropertyInput) => Promise<void>;
  createSchedule: (input: CreateScheduleInput) => Promise<void>;
  createVisit: (input: VisitFormValues) => Promise<void>;
  captureLocation: () => Promise<{ latitude: number; longitude: number } | null>;
};

const AppContext = createContext<AppContextValue | null>(null);
const SESSION_KEY = "app-visitas-leiteiras/session";
const TOKEN_KEY = "app-visitas-leiteiras/tokens";
const SYNC_META_KEY = "app-visitas-leiteiras/sync-meta";

export function AppProvider({ children }: PropsWithChildren) {
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    online: false,
    lastSyncAt: null,
    lastError: null
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setSyncState((current) => ({
        ...current,
        online: Boolean(state.isConnected)
      }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    if (bootstrapComplete && syncState.online && authTokens) {
      void syncNow();
    }
  }, [authTokens, bootstrapComplete, syncState.online]);

  async function initialize() {
    await bootstrapDatabase();

    const [storedSession, storedTokens, syncMeta] = await Promise.all([
      readSession<MobileSession>(SESSION_KEY),
      readSession<AuthTokens>(TOKEN_KEY),
      readSession<{ lastSyncAt: string | null }>(SYNC_META_KEY)
    ]);

    setSession(storedSession);
    setAuthTokens(storedTokens);
    setSyncState((current) => ({
      ...current,
      lastSyncAt: syncMeta?.lastSyncAt ?? null
    }));

    await refreshLocalState();
    setBootstrapComplete(true);
  }

  async function refreshLocalState() {
    const [nextClients, nextProperties, nextSchedules, nextVisits, nextQueue] = await Promise.all([
      getClients(),
      getProperties(),
      getSchedules(),
      getVisits(),
      getSyncQueue()
    ]);

    setClients(nextClients);
    setProperties(nextProperties);
    setSchedules(nextSchedules);
    setVisits(nextVisits);
    setSyncQueue(nextQueue);
  }

  async function signIn(email: string, password: string) {
    setLoading(true);

    try {
      const response = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      const nextSession: MobileSession = {
        userId: response.user.id,
        name: response.user.name,
        role: response.user.role,
        consultantArea: response.user.consultantArea ?? undefined
      };

      const nextTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      };

      setSession(nextSession);
      setAuthTokens(nextTokens);
      await persistSession(SESSION_KEY, nextSession);
      await persistSession(TOKEN_KEY, nextTokens);
      await initialPull(nextTokens.accessToken);
      await refreshLocalState();
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setSession(null);
    setAuthTokens(null);
    await AsyncStorage.multiRemove([SESSION_KEY, TOKEN_KEY]);
    router.replace("/login");
  }

  async function initialPull(accessToken: string) {
    const response = await apiRequest<{
      syncedAt: string;
      clients: ClientRecord[];
      properties: PropertyRecord[];
      schedules: ScheduleRecord[];
      visits: VisitRecord[];
    }>("/sync/pull", await createAuthorizedInit(accessToken));

    await replaceManyClients(response.clients);
    await replaceManyProperties(response.properties);
    await replaceManySchedules(response.schedules);
    await replaceManyVisits(response.visits);
    await persistSession(SYNC_META_KEY, {
      lastSyncAt: response.syncedAt
    });

    setSyncState((current) => ({
      ...current,
      lastSyncAt: response.syncedAt,
      lastError: null
    }));
  }

  async function syncNow() {
    if (!authTokens) {
      return;
    }

    setLoading(true);

    try {
      const pendingItems = await getSyncQueue();

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          await updateSyncQueueItemStatus(item.id, "processing");
        }

        const pushResponse = await apiRequest<{
          syncedAt: string;
          results: Array<{
            localId: string;
            status: "synced";
          }>;
        }>("/sync/push", {
          ...(await createAuthorizedInit()),
          method: "POST",
          body: JSON.stringify({
            items: pendingItems.map((item) => ({
              localId: item.id,
              entityType: item.entityType,
              operation: item.operation,
              record: item.payload
            }))
          })
        });

        await deleteSyncQueueItems(pushResponse.results.map((result) => result.localId));
      }

      const pullResponse = await apiRequest<{
        syncedAt: string;
        clients: ClientRecord[];
        properties: PropertyRecord[];
        schedules: ScheduleRecord[];
        visits: VisitRecord[];
      }>(
        `/sync/pull?since=${encodeURIComponent(syncState.lastSyncAt ?? new Date(0).toISOString())}`,
        await createAuthorizedInit()
      );

      await upsertManyClients(pullResponse.clients);
      await upsertManyProperties(pullResponse.properties);
      await upsertManySchedules(pullResponse.schedules);
      await upsertManyVisits(pullResponse.visits);
      await persistSession(SYNC_META_KEY, {
        lastSyncAt: pullResponse.syncedAt
      });

      setSyncState((current) => ({
        ...current,
        lastSyncAt: pullResponse.syncedAt,
        lastError: null
      }));
      await refreshLocalState();
    } catch (error) {
      const queueItems = await getSyncQueue();
      const processingItems = queueItems.filter((item) => item.status === "processing");

      for (const item of processingItems) {
        await updateSyncQueueItemStatus(
          item.id,
          "error",
          error instanceof Error ? error.message : "Falha ao sincronizar."
        );
      }

      setSyncState((current) => ({
        ...current,
        lastError: error instanceof Error ? error.message : "Falha ao sincronizar."
      }));
      await refreshLocalState();
    } finally {
      setLoading(false);
    }
  }

  async function createClientAndProperty(input: CreateClientAndPropertyInput) {
    const clientId = createId("client");
    const propertyId = createId("property");
    const now = new Date().toISOString();

    const client: ClientRecord = {
      id: clientId,
      name: input.clientName,
      clientType: input.clientType,
      phone: null,
      createdAt: now,
      updatedAt: now
    };

    const property: PropertyRecord = {
      id: propertyId,
      clientId,
      name: input.propertyName,
      consultantName: input.consultantName,
      consultantArea: input.consultantArea,
      latitude: input.latitude,
      longitude: input.longitude,
      city: input.city ?? null,
      state: input.state ?? null,
      address: null,
      createdAt: now,
      updatedAt: now
    };

    await insertClient(client);
    await insertProperty(property);
    await refreshLocalState();
  }

  async function createSchedule(input: CreateScheduleInput) {
    if (!session) {
      return;
    }

    const now = new Date().toISOString();
    const schedule: ScheduleRecord = {
      id: createId("schedule"),
      propertyId: input.propertyId,
      assignedUserId: session.userId,
      createdByUserId: session.userId,
      scheduledAt: input.scheduledAt,
      status: "agendada",
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };

    await insertSchedule(schedule);
    await refreshLocalState();
  }

  async function createVisit(input: VisitFormValues) {
    if (!session) {
      return;
    }

    const now = new Date().toISOString();
    const visit: VisitRecord = {
      id: createId("visit"),
      propertyId: input.propertyId,
      technicianUserId: session.userId,
      herdSize: input.herdSize,
      clientType: input.clientType,
      serviceType: input.serviceType,
      animalCount: input.animalCount ?? null,
      milkAverageLitersPerDay: input.milkAverageLitersPerDay,
      lactatingAnimals: input.lactatingAnimals,
      dealClosed: input.dealClosed,
      notes: input.notes ?? null,
      visitedAt: now,
      createdAt: now,
      updatedAt: now
    };

    await insertVisit(visit);
    await refreshLocalState();
  }

  async function captureLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }

  async function createAuthorizedInit(accessTokenOverride?: string) {
    let accessToken = accessTokenOverride ?? authTokens?.accessToken;

    if (!accessToken && authTokens?.refreshToken) {
      accessToken = await refreshAccessToken();
    }

    if (!accessToken) {
      throw new Error("401:Sessao expirada.");
    }

    return {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }

  async function refreshAccessToken() {
    if (!authTokens?.refreshToken) {
      throw new Error("401:Refresh token ausente.");
    }

    const response = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: UserProfile;
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: authTokens.refreshToken
      })
    });

    const nextTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    };

    setAuthTokens(nextTokens);
    await persistSession(TOKEN_KEY, nextTokens);
    return nextTokens.accessToken;
  }

  const localSummary = useMemo<LocalSummary>(
    () => ({
      clientCount: clients.length,
      propertyCount: properties.length,
      scheduleCount: schedules.length,
      visitCount: visits.length,
      pendingSyncCount: syncQueue.filter((item) => item.status !== "synced").length
    }),
    [clients.length, properties.length, schedules.length, syncQueue, visits.length]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      bootstrapComplete,
      loading,
      session,
      authTokens,
      clients,
      properties,
      schedules,
      visits,
      syncQueue,
      syncState,
      localSummary,
      signIn,
      signOut,
      syncNow,
      createClientAndProperty,
      createSchedule,
      createVisit,
      captureLocation
    }),
    [
      authTokens,
      bootstrapComplete,
      clients,
      loading,
      localSummary,
      properties,
      schedules,
      session,
      syncQueue,
      syncState,
      visits
    ]
  );

  if (!bootstrapComplete) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}