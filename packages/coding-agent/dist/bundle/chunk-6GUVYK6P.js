import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);
import {
  __require
} from "./chunk-BAWSWWEU.js";

// ../ai/src/env-api-keys.ts
var _existsSync = null;
var _readFileSync = null;
var _homedir = null;
var _join = null;
var dynamicImport = (specifier) => import(specifier);
var NODE_FS_SPECIFIER = "node:fs";
var NODE_OS_SPECIFIER = "node:os";
var NODE_PATH_SPECIFIER = "node:path";
if (typeof process !== "undefined" && (process.versions?.node || process.versions?.bun)) {
  dynamicImport(NODE_FS_SPECIFIER).then((m) => {
    _existsSync = m.existsSync;
    _readFileSync = m.readFileSync;
  });
  dynamicImport(NODE_OS_SPECIFIER).then((m) => {
    _homedir = m.homedir;
  });
  dynamicImport(NODE_PATH_SPECIFIER).then((m) => {
    _join = m.join;
  });
}
var _procEnvCache = null;
function getProcEnv(key) {
  if (typeof process === "undefined" || !process.versions?.bun) return void 0;
  if (Object.keys(process.env).length > 0) return void 0;
  if (_procEnvCache === null) {
    _procEnvCache = /* @__PURE__ */ new Map();
    try {
      const { readFileSync: readProcEnvFile } = __require("node:fs");
      const data = readProcEnvFile("/proc/self/environ", "utf-8");
      for (const entry of data.split("\0")) {
        const idx = entry.indexOf("=");
        if (idx > 0) {
          _procEnvCache.set(entry.slice(0, idx), entry.slice(idx + 1));
        }
      }
    } catch {
    }
  }
  return _procEnvCache.get(key);
}
var cachedVertexAdcCredentialsExists = null;
function hasVertexAdcCredentials() {
  if (cachedVertexAdcCredentialsExists === null) {
    if (!_existsSync || !_homedir || !_join) {
      const isNode = typeof process !== "undefined" && (process.versions?.node || process.versions?.bun);
      if (!isNode) {
        cachedVertexAdcCredentialsExists = false;
      }
      return false;
    }
    const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || getProcEnv("GOOGLE_APPLICATION_CREDENTIALS");
    if (gacPath) {
      cachedVertexAdcCredentialsExists = _existsSync(gacPath);
    } else {
      cachedVertexAdcCredentialsExists = _existsSync(
        _join(_homedir(), ".config", "gcloud", "application_default_credentials.json")
      );
    }
  }
  return cachedVertexAdcCredentialsExists;
}
function getApiKeyEnvVars(provider) {
  if (provider === "github-copilot") {
    return ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"];
  }
  if (provider === "anthropic") {
    return ["ANTHROPIC_OAUTH_TOKEN", "ANTHROPIC_API_KEY"];
  }
  const envMap = {
    openai: "OPENAI_API_KEY",
    "azure-openai-responses": "AZURE_OPENAI_API_KEY",
    "prime-inference": "PRIME_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    google: "GEMINI_API_KEY",
    "google-vertex": "GOOGLE_CLOUD_API_KEY",
    groq: "GROQ_API_KEY",
    cerebras: "CEREBRAS_API_KEY",
    xai: "XAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
    zai: "ZAI_API_KEY",
    mistral: "MISTRAL_API_KEY",
    minimax: "MINIMAX_API_KEY",
    "minimax-cn": "MINIMAX_CN_API_KEY",
    moonshotai: "MOONSHOT_API_KEY",
    "moonshotai-cn": "MOONSHOT_API_KEY",
    huggingface: "HF_TOKEN",
    fireworks: "FIREWORKS_API_KEY",
    opencode: "OPENCODE_API_KEY",
    "opencode-go": "OPENCODE_API_KEY",
    "kimi-coding": "KIMI_API_KEY",
    "cloudflare-workers-ai": "CLOUDFLARE_API_KEY",
    "cloudflare-ai-gateway": "CLOUDFLARE_API_KEY",
    xiaomi: "XIAOMI_API_KEY",
    "xiaomi-token-plan-cn": "XIAOMI_TOKEN_PLAN_CN_API_KEY",
    "xiaomi-token-plan-ams": "XIAOMI_TOKEN_PLAN_AMS_API_KEY",
    "xiaomi-token-plan-sgp": "XIAOMI_TOKEN_PLAN_SGP_API_KEY"
  };
  const envVar = envMap[provider];
  return envVar ? [envVar] : void 0;
}
function findEnvKeys(provider) {
  const envVars = getApiKeyEnvVars(provider);
  if (!envVars) return void 0;
  const found = envVars.filter((envVar) => !!process.env[envVar] || !!getProcEnv(envVar));
  return found.length > 0 ? found : void 0;
}
function getEnvApiKey(provider) {
  const envKeys = findEnvKeys(provider);
  if (envKeys?.[0]) {
    return process.env[envKeys[0]] || getProcEnv(envKeys[0]);
  }
  if (provider === "google-vertex") {
    const hasCredentials = hasVertexAdcCredentials();
    const hasProject = !!(process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || getProcEnv("GOOGLE_CLOUD_PROJECT") || getProcEnv("GCLOUD_PROJECT"));
    const hasLocation = !!(process.env.GOOGLE_CLOUD_LOCATION || getProcEnv("GOOGLE_CLOUD_LOCATION"));
    if (hasCredentials && hasProject && hasLocation) {
      return "<authenticated>";
    }
  }
  if (provider === "amazon-bedrock") {
    if (process.env.AWS_PROFILE || process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI || process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI || process.env.AWS_WEB_IDENTITY_TOKEN_FILE || getProcEnv("AWS_PROFILE") || getProcEnv("AWS_ACCESS_KEY_ID") && getProcEnv("AWS_SECRET_ACCESS_KEY") || getProcEnv("AWS_BEARER_TOKEN_BEDROCK") || getProcEnv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI") || getProcEnv("AWS_CONTAINER_CREDENTIALS_FULL_URI") || getProcEnv("AWS_WEB_IDENTITY_TOKEN_FILE")) {
      return "<authenticated>";
    }
  }
  return void 0;
}
function getPrimeTeamId() {
  const fromEnv = process.env.PRIME_TEAM_ID || getProcEnv("PRIME_TEAM_ID");
  if (fromEnv?.trim()) return fromEnv.trim();
  if (!_existsSync || !_readFileSync || !_homedir || !_join) return void 0;
  const configPath = _join(_homedir(), ".prime", "config.json");
  if (!_existsSync(configPath)) return void 0;
  try {
    const parsed = JSON.parse(_readFileSync(configPath, "utf-8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const teamId = parsed.team_id;
      if (typeof teamId === "string" && teamId.trim()) return teamId.trim();
    }
  } catch {
  }
  return void 0;
}

export {
  findEnvKeys,
  getEnvApiKey,
  getPrimeTeamId
};
