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
  mongoState: string;
  postgresState: string;
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
