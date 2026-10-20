export interface Config {
  port: number;
  deviceKey: string;
  householdId: string;
  ai: { enabled: boolean; modelId: string; region: string };
  novaApi?: { apiKey: string; modelId: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 8787),
    deviceKey: env.REWIND_DEVICE_KEY ?? "dev-device-key",
    householdId: env.REWIND_HOUSEHOLD_ID ?? "demo",
    ai: {
      enabled: env.REWIND_AI !== "off",
      modelId: env.REWIND_MODEL_ID ?? "us.amazon.nova-2-lite-v1:0",
      region: env.AWS_REGION ?? "us-east-1",
    },
    novaApi: env.NOVA_API_KEY ? { apiKey: env.NOVA_API_KEY, modelId: "nova-2-lite-v1" } : undefined,
  };
}
