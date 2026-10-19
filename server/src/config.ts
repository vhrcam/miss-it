export interface Config {
  port: number;
  deviceKey: string;
  householdId: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 8787),
    deviceKey: env.REWIND_DEVICE_KEY ?? "dev-device-key",
    householdId: env.REWIND_HOUSEHOLD_ID ?? "demo",
  };
}
