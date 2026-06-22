export type RuntimeEnv = Partial<Record<
  | "NODE_ENV"
  | "BUILT_IN_FORGE_API_URL"
  | "BUILT_IN_FORGE_API_KEY",
  string
>>;

let runtimeEnv: RuntimeEnv = {};

export function setRuntimeEnv(env: RuntimeEnv) {
  runtimeEnv = env;
}

function readEnv(key: keyof RuntimeEnv) {
  return runtimeEnv[key] ?? process.env[key] ?? "";
}

export const ENV = {
  get isProduction() { return readEnv("NODE_ENV") === "production"; },
  get forgeApiUrl() { return readEnv("BUILT_IN_FORGE_API_URL"); },
  get forgeApiKey() { return readEnv("BUILT_IN_FORGE_API_KEY"); },
};
