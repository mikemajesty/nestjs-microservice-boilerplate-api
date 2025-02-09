export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

export type MemotyOutput = {
  process: {
    ramUsed: string;
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
  mongoState: string;
  postgresState: string;
  redisState: string;
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
