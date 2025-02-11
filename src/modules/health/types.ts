export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

export type MemotyOutput = {
  process: {
    usedRam: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  v8: {
    totalHeapSize: string;
    usedHeapSize: string;
    executableHeapSize: string;
    heapSizeLimit: string;
  };
};

export type HealthOutput = {
  server: string;
  version: string;
  mongo: {
    status: string;
    connection: DatabaseConnection;
  };
  postgres: {
    status: string;
    connection: DatabaseConnection;
  };
  redisState: string;
  network: {
    latency: string;
    connections: number;
  };
  memory: MemotyOutput;
  cpu: {
    healthyLimit: number;
    loadAverage: {
      lastMinute: Load;
      lastFiveMinutes: Load;
      lastFifteenMinutes: Load;
    };
  };
};

export type Load = {
  load: number;
  status: string;
};

export type DatabaseConnection = {
  active: number;
  available: number;
  current: number;
  totalCreated: number;
};
