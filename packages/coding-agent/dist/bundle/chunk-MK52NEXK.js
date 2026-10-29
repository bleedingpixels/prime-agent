import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);

// ../ai/src/models.generated.ts
var MODELS = {
  "amazon-bedrock": {
    "amazon.nova-2-lite-v1:0": {
      id: "amazon.nova-2-lite-v1:0",
      name: "Nova 2 Lite",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.33,
        output: 2.75,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "amazon.nova-lite-v1:0": {
      id: "amazon.nova-lite-v1:0",
      name: "Nova Lite",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.06,
        output: 0.24,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 8192
    },
    "amazon.nova-micro-v1:0": {
      id: "amazon.nova-micro-v1:0",
      name: "Nova Micro",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.035,
        output: 0.14,
        cacheRead: 875e-5,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "amazon.nova-pro-v1:0": {
      id: "amazon.nova-pro-v1:0",
      name: "Nova Pro",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.8,
        output: 3.2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 8192
    },
    "anthropic.claude-fable-5": {
      id: "anthropic.claude-fable-5",
      name: "Claude Fable 5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic.claude-opus-4-1-20250805-v1:0": {
      id: "anthropic.claude-opus-4-1-20250805-v1:0",
      name: "Claude Opus 4.1",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "anthropic.claude-opus-4-5-20251101-v1:0": {
      id: "anthropic.claude-opus-4-5-20251101-v1:0",
      name: "Claude Opus 4.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic.claude-opus-4-6-v1": {
      id: "anthropic.claude-opus-4-6-v1",
      name: "Claude Opus 4.6",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic.claude-opus-4-7": {
      id: "anthropic.claude-opus-4-7",
      name: "Claude Opus 4.7",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic.claude-opus-4-8": {
      id: "anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic.claude-opus-5": {
      id: "anthropic.claude-opus-5",
      name: "Claude Opus 5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic.claude-sonnet-4-6": {
      id: "anthropic.claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "anthropic.claude-sonnet-5": {
      id: "anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "au.anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "au.anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5 (AU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "au.anthropic.claude-opus-4-6-v1": {
      id: "au.anthropic.claude-opus-4-6-v1",
      name: "AU Anthropic Claude Opus 4.6",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 16.5,
        output: 82.5,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "au.anthropic.claude-opus-4-8": {
      id: "au.anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8 (AU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "au.anthropic.claude-opus-5": {
      id: "au.anthropic.claude-opus-5",
      name: "Claude Opus 5 (AU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "au.anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "au.anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5 (AU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "au.anthropic.claude-sonnet-4-6": {
      id: "au.anthropic.claude-sonnet-4-6",
      name: "AU Anthropic Claude Sonnet 4.6",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3.3,
        output: 16.5,
        cacheRead: 0.33,
        cacheWrite: 4.125
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "au.anthropic.claude-sonnet-5": {
      id: "au.anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5 (AU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-southeast-2.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "deepseek.r1-v1:0": {
      id: "deepseek.r1-v1:0",
      name: "DeepSeek-R1",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.35,
        output: 5.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32768
    },
    "deepseek.v3-v1:0": {
      id: "deepseek.v3-v1:0",
      name: "DeepSeek-V3.1",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.58,
        output: 1.68,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 81920
    },
    "deepseek.v3.2": {
      id: "deepseek.v3.2",
      name: "DeepSeek-V3.2",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.62,
        output: 1.85,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 81920
    },
    "eu.anthropic.claude-fable-5": {
      id: "eu.anthropic.claude-fable-5",
      name: "Claude Fable 5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 11,
        output: 55,
        cacheRead: 1.1,
        cacheWrite: 13.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "eu.anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 5.5,
        cacheRead: 0.11,
        cacheWrite: 1.375
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "eu.anthropic.claude-opus-4-5-20251101-v1:0": {
      id: "eu.anthropic.claude-opus-4-5-20251101-v1:0",
      name: "Claude Opus 4.5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 27.5,
        cacheRead: 0.55,
        cacheWrite: 6.875
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "eu.anthropic.claude-opus-4-6-v1": {
      id: "eu.anthropic.claude-opus-4-6-v1",
      name: "Claude Opus 4.6 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 27.5,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "eu.anthropic.claude-opus-4-7": {
      id: "eu.anthropic.claude-opus-4-7",
      name: "Claude Opus 4.7 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 27.5,
        cacheRead: 0.55,
        cacheWrite: 6.875
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "eu.anthropic.claude-opus-4-8": {
      id: "eu.anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 27.5,
        cacheRead: 0.55,
        cacheWrite: 6.875
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "eu.anthropic.claude-opus-5": {
      id: "eu.anthropic.claude-opus-5",
      name: "Claude Opus 5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 27.5,
        cacheRead: 0.55,
        cacheWrite: 6.875
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "eu.anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3.3,
        output: 16.5,
        cacheRead: 0.33,
        cacheWrite: 4.125
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "eu.anthropic.claude-sonnet-4-6": {
      id: "eu.anthropic.claude-sonnet-4-6",
      name: "Claude Sonnet 4.6 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3.3,
        output: 16.5,
        cacheRead: 0.33,
        cacheWrite: 4.125
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "eu.anthropic.claude-sonnet-5": {
      id: "eu.anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5 (EU)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.2,
        output: 11,
        cacheRead: 0.22,
        cacheWrite: 2.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-fable-5": {
      id: "global.anthropic.claude-fable-5",
      name: "Claude Fable 5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "global.anthropic.claude-opus-4-5-20251101-v1:0": {
      id: "global.anthropic.claude-opus-4-5-20251101-v1:0",
      name: "Claude Opus 4.5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "global.anthropic.claude-opus-4-6-v1": {
      id: "global.anthropic.claude-opus-4-6-v1",
      name: "Claude Opus 4.6 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-opus-4-7": {
      id: "global.anthropic.claude-opus-4-7",
      name: "Claude Opus 4.7 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-opus-4-8": {
      id: "global.anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-opus-5": {
      id: "global.anthropic.claude-opus-5",
      name: "Claude Opus 5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "global.anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "global.anthropic.claude-sonnet-4-6": {
      id: "global.anthropic.claude-sonnet-4-6",
      name: "Claude Sonnet 4.6 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "global.anthropic.claude-sonnet-5": {
      id: "global.anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5 (Global)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "google.gemma-3-27b-it": {
      id: "google.gemma-3-27b-it",
      name: "Google Gemma 3 27B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.12,
        output: 0.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 8192
    },
    "google.gemma-3-4b-it": {
      id: "google.gemma-3-4b-it",
      name: "Gemma 3 4B IT",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.04,
        output: 0.08,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "jp.anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "jp.anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "jp.anthropic.claude-opus-4-7": {
      id: "jp.anthropic.claude-opus-4-7",
      name: "Claude Opus 4.7 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "jp.anthropic.claude-opus-4-8": {
      id: "jp.anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "jp.anthropic.claude-opus-5": {
      id: "jp.anthropic.claude-opus-5",
      name: "Claude Opus 5 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "jp.anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "jp.anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "jp.anthropic.claude-sonnet-4-6": {
      id: "jp.anthropic.claude-sonnet-4-6",
      name: "Claude Sonnet 4.6 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "jp.anthropic.claude-sonnet-5": {
      id: "jp.anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5 (JP)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.ap-northeast-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "meta.llama3-1-70b-instruct-v1:0": {
      id: "meta.llama3-1-70b-instruct-v1:0",
      name: "Llama 3.1 70B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.72,
        output: 0.72,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "meta.llama3-1-8b-instruct-v1:0": {
      id: "meta.llama3-1-8b-instruct-v1:0",
      name: "Llama 3.1 8B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.22,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "meta.llama3-3-70b-instruct-v1:0": {
      id: "meta.llama3-3-70b-instruct-v1:0",
      name: "Llama 3.3 70B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.72,
        output: 0.72,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "meta.llama4-maverick-17b-instruct-v1:0": {
      id: "meta.llama4-maverick-17b-instruct-v1:0",
      name: "Llama 4 Maverick 17B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.24,
        output: 0.97,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 16384
    },
    "meta.llama4-scout-17b-instruct-v1:0": {
      id: "meta.llama4-scout-17b-instruct-v1:0",
      name: "Llama 4 Scout 17B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.17,
        output: 0.66,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 35e5,
      maxTokens: 16384
    },
    "minimax.minimax-m2": {
      id: "minimax.minimax-m2",
      name: "MiniMax M2",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204608,
      maxTokens: 128e3
    },
    "minimax.minimax-m2.1": {
      id: "minimax.minimax-m2.1",
      name: "MiniMax M2.1",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax.minimax-m2.5": {
      id: "minimax.minimax-m2.5",
      name: "MiniMax M2.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 196608,
      maxTokens: 98304
    },
    "mistral.devstral-2-123b": {
      id: "mistral.devstral-2-123b",
      name: "Devstral 2 123B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8192
    },
    "mistral.magistral-small-2509": {
      id: "mistral.magistral-small-2509",
      name: "Magistral Small 1.2",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e4
    },
    "mistral.ministral-3-14b-instruct": {
      id: "mistral.ministral-3-14b-instruct",
      name: "Ministral 14B 3.0",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 0.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "mistral.ministral-3-3b-instruct": {
      id: "mistral.ministral-3-3b-instruct",
      name: "Ministral 3 3B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8192
    },
    "mistral.ministral-3-8b-instruct": {
      id: "mistral.ministral-3-8b-instruct",
      name: "Ministral 3 8B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "mistral.mistral-large-3-675b-instruct": {
      id: "mistral.mistral-large-3-675b-instruct",
      name: "Mistral Large 3",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8192
    },
    "mistral.pixtral-large-2502-v1:0": {
      id: "mistral.pixtral-large-2502-v1:0",
      name: "Pixtral Large (25.02)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "mistral.voxtral-mini-3b-2507": {
      id: "mistral.voxtral-mini-3b-2507",
      name: "Voxtral Mini 3B 2507",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.04,
        output: 0.04,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "mistral.voxtral-small-24b-2507": {
      id: "mistral.voxtral-small-24b-2507",
      name: "Voxtral Small 24B 2507",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.35,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 8192
    },
    "moonshot.kimi-k2-thinking": {
      id: "moonshot.kimi-k2-thinking",
      name: "Kimi K2 Thinking",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262143,
      maxTokens: 16e3
    },
    "moonshotai.kimi-k2.5": {
      id: "moonshotai.kimi-k2.5",
      name: "Kimi K2.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262143,
      maxTokens: 16e3
    },
    "nvidia.nemotron-nano-12b-v2": {
      id: "nvidia.nemotron-nano-12b-v2",
      name: "NVIDIA Nemotron Nano 12B v2 VL BF16",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "nvidia.nemotron-nano-3-30b": {
      id: "nvidia.nemotron-nano-3-30b",
      name: "NVIDIA Nemotron Nano 3 30B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "nvidia.nemotron-nano-9b-v2": {
      id: "nvidia.nemotron-nano-9b-v2",
      name: "NVIDIA Nemotron Nano 9B v2",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.23,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "nvidia.nemotron-super-3-120b": {
      id: "nvidia.nemotron-super-3-120b",
      name: "NVIDIA Nemotron 3 Super 120B A12B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.65,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "openai.gpt-5.4": {
      id: "openai.gpt-5.4",
      name: "GPT-5.4",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.75,
        output: 16.5,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "openai.gpt-5.5": {
      id: "openai.gpt-5.5",
      name: "GPT-5.5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 33,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "openai.gpt-5.6-luna": {
      id: "openai.gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.22,
        output: 1.32,
        cacheRead: 0.022,
        cacheWrite: 0.275
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai.gpt-5.6-sol": {
      id: "openai.gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5.5,
        output: 33,
        cacheRead: 0.55,
        cacheWrite: 6.875
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai.gpt-5.6-terra": {
      id: "openai.gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.2,
        output: 13.2,
        cacheRead: 0.22,
        cacheWrite: 2.75
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai.gpt-oss-120b": {
      id: "openai.gpt-oss-120b",
      name: "gpt-oss-120b",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai.gpt-oss-120b-1:0": {
      id: "openai.gpt-oss-120b-1:0",
      name: "gpt-oss-120b",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai.gpt-oss-20b": {
      id: "openai.gpt-oss-20b",
      name: "gpt-oss-20b",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai.gpt-oss-20b-1:0": {
      id: "openai.gpt-oss-20b-1:0",
      name: "gpt-oss-20b",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai.gpt-oss-safeguard-120b": {
      id: "openai.gpt-oss-safeguard-120b",
      name: "GPT OSS Safeguard 120B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai.gpt-oss-safeguard-20b": {
      id: "openai.gpt-oss-safeguard-20b",
      name: "GPT OSS Safeguard 20B",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "qwen.qwen3-235b-a22b-2507-v1:0": {
      id: "qwen.qwen3-235b-a22b-2507-v1:0",
      name: "Qwen3 235B A22B 2507",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.88,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "qwen.qwen3-32b-v1:0": {
      id: "qwen.qwen3-32b-v1:0",
      name: "Qwen3 32B (dense)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 16384,
      maxTokens: 16384
    },
    "qwen.qwen3-coder-30b-a3b-v1:0": {
      id: "qwen.qwen3-coder-30b-a3b-v1:0",
      name: "Qwen3 Coder 30B A3B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "qwen.qwen3-coder-480b-a35b-v1:0": {
      id: "qwen.qwen3-coder-480b-a35b-v1:0",
      name: "Qwen3 Coder 480B A35B Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 1.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "qwen.qwen3-coder-next": {
      id: "qwen.qwen3-coder-next",
      name: "Qwen3 Coder Next",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 1.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "qwen.qwen3-next-80b-a3b": {
      id: "qwen.qwen3-next-80b-a3b",
      name: "Qwen/Qwen3-Next-80B-A3B-Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 1.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "qwen.qwen3-vl-235b-a22b": {
      id: "qwen.qwen3-vl-235b-a22b",
      name: "Qwen/Qwen3-VL-235B-A22B-Instruct",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "us.anthropic.claude-fable-5": {
      id: "us.anthropic.claude-fable-5",
      name: "Claude Fable 5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.anthropic.claude-haiku-4-5-20251001-v1:0": {
      id: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
      name: "Claude Haiku 4.5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "us.anthropic.claude-opus-4-1-20250805-v1:0": {
      id: "us.anthropic.claude-opus-4-1-20250805-v1:0",
      name: "Claude Opus 4.1 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "us.anthropic.claude-opus-4-5-20251101-v1:0": {
      id: "us.anthropic.claude-opus-4-5-20251101-v1:0",
      name: "Claude Opus 4.5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "us.anthropic.claude-opus-4-6-v1": {
      id: "us.anthropic.claude-opus-4-6-v1",
      name: "Claude Opus 4.6 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.anthropic.claude-opus-4-7": {
      id: "us.anthropic.claude-opus-4-7",
      name: "Claude Opus 4.7 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.anthropic.claude-opus-4-8": {
      id: "us.anthropic.claude-opus-4-8",
      name: "Claude Opus 4.8 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.anthropic.claude-opus-5": {
      id: "us.anthropic.claude-opus-5",
      name: "Claude Opus 5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.anthropic.claude-sonnet-4-5-20250929-v1:0": {
      id: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
      name: "Claude Sonnet 4.5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "us.anthropic.claude-sonnet-4-6": {
      id: "us.anthropic.claude-sonnet-4-6",
      name: "Claude Sonnet 4.6 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "us.anthropic.claude-sonnet-5": {
      id: "us.anthropic.claude-sonnet-5",
      name: "Claude Sonnet 5 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "us.deepseek.r1-v1:0": {
      id: "us.deepseek.r1-v1:0",
      name: "DeepSeek-R1 (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.35,
        output: 5.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32768
    },
    "us.meta.llama4-maverick-17b-instruct-v1:0": {
      id: "us.meta.llama4-maverick-17b-instruct-v1:0",
      name: "Llama 4 Maverick 17B Instruct (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.24,
        output: 0.97,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 16384
    },
    "us.meta.llama4-scout-17b-instruct-v1:0": {
      id: "us.meta.llama4-scout-17b-instruct-v1:0",
      name: "Llama 4 Scout 17B Instruct (US)",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.17,
        output: 0.66,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 35e5,
      maxTokens: 16384
    },
    "writer.palmyra-x4-v1:0": {
      id: "writer.palmyra-x4-v1:0",
      name: "Palmyra X4",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 122880,
      maxTokens: 8192
    },
    "writer.palmyra-x5-v1:0": {
      id: "writer.palmyra-x5-v1:0",
      name: "Palmyra X5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 104e4,
      maxTokens: 8192
    },
    "xai.grok-4.3": {
      id: "xai.grok-4.3",
      name: "Grok 4.3",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "zai.glm-4.7": {
      id: "zai.glm-4.7",
      name: "GLM-4.7",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "zai.glm-4.7-flash": {
      id: "zai.glm-4.7-flash",
      name: "GLM-4.7-Flash",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 131072
    },
    "zai.glm-5": {
      id: "zai.glm-5",
      name: "GLM-5",
      api: "bedrock-converse-stream",
      provider: "amazon-bedrock",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 101376
    }
  },
  "anthropic": {
    "claude-fable-5": {
      id: "claude-fable-5",
      name: "Claude Fable 5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-haiku-4-5": {
      id: "claude-haiku-4-5",
      name: "Claude Haiku 4.5 (latest)",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-haiku-4-5-20251001": {
      id: "claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-5": {
      id: "claude-opus-4-5",
      name: "Claude Opus 4.5 (latest)",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-5-20251101": {
      id: "claude-opus-4-5-20251101",
      name: "Claude Opus 4.5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-6": {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-7": {
      id: "claude-opus-4-7",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-8": {
      id: "claude-opus-4-8",
      name: "Claude Opus 4.8",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-5": {
      id: "claude-opus-5",
      name: "Claude Opus 5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-sonnet-4-5": {
      id: "claude-sonnet-4-5",
      name: "Claude Sonnet 4.5 (latest)",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "claude-sonnet-4-5-20250929": {
      id: "claude-sonnet-4-5-20250929",
      name: "Claude Sonnet 4.5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "claude-sonnet-4-6": {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-sonnet-5": {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "anthropic-messages",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    }
  },
  "azure-openai-responses": {
    "gpt-4": {
      id: "gpt-4",
      name: "GPT-4",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 30,
        output: 60,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8192,
      maxTokens: 8192
    },
    "gpt-4-turbo": {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "gpt-4.1": {
      id: "gpt-4.1",
      name: "GPT-4.1",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4.1-mini": {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.6,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4.1-nano": {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 nano",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4o": {
      id: "gpt-4o",
      name: "GPT-4o",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-2024-05-13": {
      id: "gpt-4o-2024-05-13",
      name: "GPT-4o (2024-05-13)",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "gpt-4o-2024-08-06": {
      id: "gpt-4o-2024-08-06",
      name: "GPT-4o (2024-08-06)",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-2024-11-20": {
      id: "gpt-4o-2024-11-20",
      name: "GPT-4o (2024-11-20)",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-mini": {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5": {
      id: "gpt-5",
      name: "GPT-5",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-chat-latest": {
      id: "gpt-5-chat-latest",
      name: "GPT-5 Chat Latest",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5-mini": {
      id: "gpt-5-mini",
      name: "GPT-5 Mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-nano": {
      id: "gpt-5-nano",
      name: "GPT-5 Nano",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.05,
        output: 0.4,
        cacheRead: 5e-3,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-pro": {
      id: "gpt-5-pro",
      name: "GPT-5 Pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 120,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 272e3
    },
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex": {
      id: "gpt-5.1-codex",
      name: "GPT-5.1 Codex",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 5,
        cacheRead: 0.125,
        cacheWrite: 1.25
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-max": {
      id: "gpt-5.1-codex-max",
      name: "GPT-5.1 Codex Max",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2-chat-latest": {
      id: "gpt-5.2-chat-latest",
      name: "GPT-5.2 Chat",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5.2-pro": {
      id: "gpt-5.2-pro",
      name: "GPT-5.2 Pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 21,
        output: 168,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-chat-latest": {
      id: "gpt-5.3-chat-latest",
      name: "GPT-5.3 Chat (latest)",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: false,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-codex-spark": {
      id: "gpt-5.3-codex-spark",
      name: "GPT-5.3 Codex Spark",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.4-mini": {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-nano": {
      id: "gpt-5.4-nano",
      name: "GPT-5.4 nano",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-pro": {
      id: "gpt-5.4-pro",
      name: "GPT-5.4 Pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.5-pro": {
      id: "gpt-5.5-pro",
      name: "GPT-5.5 Pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6": {
      id: "gpt-5.6",
      name: "GPT-5.6",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-realtime-2.1": {
      id: "gpt-realtime-2.1",
      name: "GPT-Realtime-2.1",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 4,
        output: 24,
        cacheRead: 0.4,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "o1": {
      id: "o1",
      name: "o1",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 60,
        cacheRead: 7.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o1-pro": {
      id: "o1-pro",
      name: "o1-pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 150,
        output: 600,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3": {
      id: "o3",
      name: "o3",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-mini": {
      id: "o3-mini",
      name: "o3-mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-pro": {
      id: "o3-pro",
      name: "o3-pro",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 20,
        output: 80,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o4-mini": {
      id: "o4-mini",
      name: "o4-mini",
      api: "azure-openai-responses",
      provider: "azure-openai-responses",
      baseUrl: "",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    }
  },
  "cerebras": {
    "gemma-4-31b": {
      id: "gemma-4-31b",
      name: "Gemma 4 31B IT",
      api: "openai-completions",
      provider: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.99,
        output: 1.49,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 40960
    },
    "gpt-oss-120b": {
      id: "gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "openai-completions",
      provider: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.35,
        output: 0.75,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 40960
    },
    "zai-glm-4.7": {
      id: "zai-glm-4.7",
      name: "Z.AI GLM-4.7",
      api: "openai-completions",
      provider: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.25,
        output: 2.75,
        cacheRead: 2.25,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 40960
    }
  },
  "cloudflare-ai-gateway": {
    "claude-3-5-haiku": {
      id: "claude-3-5-haiku",
      name: "Claude Haiku 3.5 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.8,
        output: 4,
        cacheRead: 0.08,
        cacheWrite: 1
      },
      contextWindow: 2e5,
      maxTokens: 8192
    },
    "claude-3-haiku": {
      id: "claude-3-haiku",
      name: "Claude Haiku 3",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.25,
        cacheRead: 0.03,
        cacheWrite: 0.3
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "claude-3-opus": {
      id: "claude-3-opus",
      name: "Claude Opus 3",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "claude-3-sonnet": {
      id: "claude-3-sonnet",
      name: "Claude Sonnet 3",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0.3
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "claude-3.5-haiku": {
      id: "claude-3.5-haiku",
      name: "Claude Haiku 3.5 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.8,
        output: 4,
        cacheRead: 0.08,
        cacheWrite: 1
      },
      contextWindow: 2e5,
      maxTokens: 8192
    },
    "claude-3.5-sonnet": {
      id: "claude-3.5-sonnet",
      name: "Claude Sonnet 3.5 v2",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 8192
    },
    "claude-fable-5": {
      id: "claude-fable-5",
      name: "Claude Fable 5",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-haiku-4-5": {
      id: "claude-haiku-4-5",
      name: "Claude Haiku 4.5 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4": {
      id: "claude-opus-4",
      name: "Claude Opus 4 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-opus-4-1": {
      id: "claude-opus-4-1",
      name: "Claude Opus 4.1 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-opus-4-5": {
      id: "claude-opus-4-5",
      name: "Claude Opus 4.5 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-6": {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-7": {
      id: "claude-opus-4-7",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-8": {
      id: "claude-opus-4-8",
      name: "Claude Opus 4.8",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-5": {
      id: "claude-opus-5",
      name: "Claude Opus 5",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-sonnet-4": {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-sonnet-4-5": {
      id: "claude-sonnet-4-5",
      name: "Claude Sonnet 4.5 (latest)",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-sonnet-4-6": {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "claude-sonnet-5": {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "anthropic-messages",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "gpt-4": {
      id: "gpt-4",
      name: "GPT-4",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 30,
        output: 60,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8192,
      maxTokens: 8192
    },
    "gpt-4-turbo": {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "gpt-4o": {
      id: "gpt-4o",
      name: "GPT-4o",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-mini": {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.08,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex": {
      id: "gpt-5.1-codex",
      name: "GPT-5.1 Codex",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2-codex": {
      id: "gpt-5.2-codex",
      name: "GPT-5.2 Codex",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "o1": {
      id: "o1",
      name: "o1",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 60,
        cacheRead: 7.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3": {
      id: "o3",
      name: "o3",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-mini": {
      id: "o3-mini",
      name: "o3-mini",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-pro": {
      id: "o3-pro",
      name: "o3-pro",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 20,
        output: 80,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o4-mini": {
      id: "o4-mini",
      name: "o4-mini",
      api: "openai-responses",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.28,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "workers-ai/@cf/moonshotai/kimi-k2.5": {
      id: "workers-ai/@cf/moonshotai/kimi-k2.5",
      name: "Kimi K2.5",
      api: "openai-completions",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "workers-ai/@cf/moonshotai/kimi-k2.6": {
      id: "workers-ai/@cf/moonshotai/kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "workers-ai/@cf/nvidia/nemotron-3-120b-a12b": {
      id: "workers-ai/@cf/nvidia/nemotron-3-120b-a12b",
      name: "Nemotron 3 Super 120B",
      api: "openai-completions",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "workers-ai/@cf/zai-org/glm-4.7-flash": {
      id: "workers-ai/@cf/zai-org/glm-4.7-flash",
      name: "GLM-4.7-Flash",
      api: "openai-completions",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "workers-ai/@cf/zai-org/glm-5.2": {
      id: "workers-ai/@cf/zai-org/glm-5.2",
      name: "Glm 5.2",
      api: "openai-completions",
      provider: "cloudflare-ai-gateway",
      baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    }
  },
  "cloudflare-workers-ai": {
    "@cf/google/gemma-4-26b-a4b-it": {
      id: "@cf/google/gemma-4-26b-a4b-it",
      name: "Gemma 4 26B A4B IT",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 16384
    },
    "@cf/ibm-granite/granite-4.0-h-micro": {
      id: "@cf/ibm-granite/granite-4.0-h-micro",
      name: "Granite 4.0 H Micro",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.017,
        output: 0.112,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131e3,
      maxTokens: 131e3
    },
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
      id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      name: "Llama 3.3 70B Instruct fp8 Fast",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.293,
        output: 2.253,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 24e3,
      maxTokens: 24e3
    },
    "@cf/meta/llama-4-scout-17b-16e-instruct": {
      id: "@cf/meta/llama-4-scout-17b-16e-instruct",
      name: "Llama 4 Scout 17B 16E Instruct",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.27,
        output: 0.85,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131e3,
      maxTokens: 16384
    },
    "@cf/mistralai/mistral-small-3.1-24b-instruct": {
      id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
      name: "Mistral Small 3.1 24B Instruct",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.351,
        output: 0.555,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "@cf/moonshotai/kimi-k2.6": {
      id: "@cf/moonshotai/kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 256e3
    },
    "@cf/moonshotai/kimi-k2.7-code": {
      id: "@cf/moonshotai/kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "@cf/nvidia/nemotron-3-120b-a12b": {
      id: "@cf/nvidia/nemotron-3-120b-a12b",
      name: "Nemotron 3 Super 120B",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "@cf/openai/gpt-oss-120b": {
      id: "@cf/openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.35,
        output: 0.75,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "@cf/openai/gpt-oss-20b": {
      id: "@cf/openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "@cf/qwen/qwen3-30b-a3b-fp8": {
      id: "@cf/qwen/qwen3-30b-a3b-fp8",
      name: "Qwen3 30B A3b fp8",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.0509,
        output: 0.335,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32768,
      maxTokens: 32768
    },
    "@cf/zai-org/glm-4.7-flash": {
      id: "@cf/zai-org/glm-4.7-flash",
      name: "GLM-4.7-Flash",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.0605,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "@cf/zai-org/glm-5.2": {
      id: "@cf/zai-org/glm-5.2",
      name: "Glm 5.2",
      api: "openai-completions",
      provider: "cloudflare-workers-ai",
      baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
      compat: { "sendSessionAffinityHeaders": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 256e3
    }
  },
  "deepseek": {
    "deepseek-v4-flash": {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      api: "openai-completions",
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "deepseek-v4-pro": {
      id: "deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      api: "openai-completions",
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 3625e-6,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    }
  },
  "fireworks": {
    "accounts/fireworks/models/deepseek-v4-flash": {
      id: "accounts/fireworks/models/deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0.028,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "accounts/fireworks/models/deepseek-v4-flash-0731": {
      id: "accounts/fireworks/models/deepseek-v4-flash-0731",
      name: "DeepSeek V4 Flash 0731",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0.028,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "accounts/fireworks/models/deepseek-v4-pro": {
      id: "accounts/fireworks/models/deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.74,
        output: 3.48,
        cacheRead: 0.145,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "accounts/fireworks/models/glm-5p2": {
      id: "accounts/fireworks/models/glm-5p2",
      name: "GLM 5.2",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.14,
        cacheWrite: 0
      },
      contextWindow: 1048575,
      maxTokens: 131072
    },
    "accounts/fireworks/models/gpt-oss-120b": {
      id: "accounts/fireworks/models/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "accounts/fireworks/models/gpt-oss-20b": {
      id: "accounts/fireworks/models/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.3,
        cacheRead: 0.035,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "accounts/fireworks/models/kimi-k2p6": {
      id: "accounts/fireworks/models/kimi-k2p6",
      name: "Kimi K2.6",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "accounts/fireworks/models/kimi-k2p7-code": {
      id: "accounts/fireworks/models/kimi-k2p7-code",
      name: "Kimi K2.7 Code",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "accounts/fireworks/models/kimi-k3": {
      id: "accounts/fireworks/models/kimi-k3",
      name: "Kimi K3",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "accounts/fireworks/models/minimax-m2p7": {
      id: "accounts/fireworks/models/minimax-m2p7",
      name: "MiniMax-M2.7",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 196608,
      maxTokens: 196608
    },
    "accounts/fireworks/models/minimax-m3": {
      id: "accounts/fireworks/models/minimax-m3",
      name: "MiniMax-M3",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 512e3,
      maxTokens: 512e3
    },
    "accounts/fireworks/models/qwen3p7-plus": {
      id: "accounts/fireworks/models/qwen3p7-plus",
      name: "Qwen 3.7 Plus",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.6,
        cacheRead: 0.08,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "accounts/fireworks/routers/glm-5p2-fast": {
      id: "accounts/fireworks/routers/glm-5p2-fast",
      name: "GLM 5.2 Fast",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.1,
        output: 6.6,
        cacheRead: 0.21,
        cacheWrite: 0
      },
      contextWindow: 1048575,
      maxTokens: 131072
    },
    "accounts/fireworks/routers/kimi-k2p6-fast": {
      id: "accounts/fireworks/routers/kimi-k2p6-fast",
      name: "Kimi K2.6 Fast",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "accounts/fireworks/routers/kimi-k2p6-turbo": {
      id: "accounts/fireworks/routers/kimi-k2p6-turbo",
      name: "Kimi K2.6 Turbo",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "accounts/fireworks/routers/kimi-k2p7-code-fast": {
      id: "accounts/fireworks/routers/kimi-k2p7-code-fast",
      name: "Kimi K2.7 Code Fast",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.9,
        output: 8,
        cacheRead: 0.38,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "accounts/fireworks/routers/kimi-k3-fast": {
      id: "accounts/fireworks/routers/kimi-k3-fast",
      name: "Kimi K3 Fast",
      api: "anthropic-messages",
      provider: "fireworks",
      baseUrl: "https://api.fireworks.ai/inference",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 4.5,
        output: 22.5,
        cacheRead: 0.45,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "github-copilot": {
    "claude-fable-5": {
      id: "claude-fable-5",
      name: "Claude Fable 5",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-haiku-4.5": {
      id: "claude-haiku-4.5",
      name: "Claude Haiku 4.5 (latest)",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsEagerToolInputStreaming": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4.5": {
      id: "claude-opus-4.5",
      name: "Claude Opus 4.5 (latest)",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-opus-4.6": {
      id: "claude-opus-4.6",
      name: "Claude Opus 4.6",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 32e3
    },
    "claude-opus-4.7": {
      id: "claude-opus-4.7",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-opus-4.8": {
      id: "claude-opus-4.8",
      name: "Claude Opus 4.8",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-5": {
      id: "claude-opus-5",
      name: "Claude Opus 5",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "claude-sonnet-4": {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4 (latest)",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsEagerToolInputStreaming": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 216e3,
      maxTokens: 16e3
    },
    "claude-sonnet-4.5": {
      id: "claude-sonnet-4.5",
      name: "Claude Sonnet 4.5 (latest)",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsEagerToolInputStreaming": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-sonnet-4.6": {
      id: "claude-sonnet-4.6",
      name: "Claude Sonnet 4.6",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 32e3
    },
    "claude-sonnet-5": {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "anthropic-messages",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "gemini-3.1-pro-preview": {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "gemini-3.5-flash": {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "gemini-3.6-flash": {
      id: "gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "gpt-4.1": {
      id: "gpt-4.1",
      name: "GPT-4.1",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5-mini": {
      id: "gpt-5-mini",
      name: "GPT-5 Mini",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 264e3,
      maxTokens: 64e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2-codex": {
      id: "gpt-5.2-codex",
      name: "GPT-5.2 Codex",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.4-mini": {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 mini",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-nano": {
      id: "gpt-5.4-nano",
      name: "GPT-5.4 nano",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "openai-responses",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "grok-4.5": {
      id: "grok-4.5",
      name: "Grok 4.5",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 128e3
    },
    "kimi-k2.7-code": {
      id: "kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "kimi-k3": {
      id: "kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mai-code-1-flash-picker": {
      id: "mai-code-1-flash-picker",
      name: "MAI-Code-1-Flash",
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl: "https://api.individual.githubcopilot.com",
      headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" },
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 128e3
    }
  },
  "google": {
    "gemini-2.5-flash": {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-flash-lite": {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash-Lite",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-pro": {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3-flash-preview": {
      id: "gemini-3-flash-preview",
      name: "Gemini 3 Flash Preview",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.05,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-flash-lite": {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-flash-lite-preview": {
      id: "gemini-3.1-flash-lite-preview",
      name: "Gemini 3.1 Flash Lite Preview",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-pro-preview": {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-pro-preview-customtools": {
      id: "gemini-3.1-pro-preview-customtools",
      name: "Gemini 3.1 Pro Preview Custom Tools",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.5-flash": {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.5-flash-lite": {
      id: "gemini-3.5-flash-lite",
      name: "Gemini 3.5 Flash Lite",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.6-flash": {
      id: "gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-flash-latest": {
      id: "gemini-flash-latest",
      name: "Gemini Flash Latest",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-flash-lite-latest": {
      id: "gemini-flash-lite-latest",
      name: "Gemini Flash-Lite Latest",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-robotics-er-1.6-preview": {
      id: "gemini-robotics-er-1.6-preview",
      name: "Gemini Robotics-ER 1.6 Preview",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "gemma-4-26b-a4b-it": {
      id: "gemma-4-26b-a4b-it",
      name: "Gemma 4 26B A4B IT",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": "MINIMAL", "low": null, "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "gemma-4-31b-it": {
      id: "gemma-4-31b-it",
      name: "Gemma 4 31B IT",
      api: "google-generative-ai",
      provider: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": "MINIMAL", "low": null, "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    }
  },
  "google-vertex": {
    "gemini-1.5-flash": {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0.01875,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 8192
    },
    "gemini-1.5-flash-8b": {
      id: "gemini-1.5-flash-8b",
      name: "Gemini 1.5 Flash-8B (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.0375,
        output: 0.15,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 8192
    },
    "gemini-1.5-pro": {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 5,
        cacheRead: 0.3125,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 8192
    },
    "gemini-2.0-flash": {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.0375,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 8192
    },
    "gemini-2.0-flash-lite": {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0.01875,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-flash": {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-flash-lite": {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-flash-lite-preview-09-2025": {
      id: "gemini-2.5-flash-lite-preview-09-2025",
      name: "Gemini 2.5 Flash Lite Preview 09-25 (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-2.5-pro": {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3-flash-preview": {
      id: "gemini-3-flash-preview",
      name: "Gemini 3 Flash Preview (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.05,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3-pro-preview": {
      id: "gemini-3-pro-preview",
      name: "Gemini 3 Pro Preview (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "gemini-3.1-pro-preview": {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-pro-preview-customtools": {
      id: "gemini-3.1-pro-preview-customtools",
      name: "Gemini 3.1 Pro Preview Custom Tools (Vertex)",
      api: "google-vertex",
      provider: "google-vertex",
      baseUrl: "https://{location}-aiplatform.googleapis.com",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    }
  },
  "groq": {
    "llama-3.1-8b-instant": {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.05,
        output: 0.08,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "llama-3.3-70b-versatile": {
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.59,
        output: 0.79,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "openai/gpt-oss-120b": {
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "openai/gpt-oss-20b": {
      id: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0.0375,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "openai/gpt-oss-safeguard-20b": {
      id: "openai/gpt-oss-safeguard-20b",
      name: "Safety GPT OSS 20B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "qwen/qwen3.6-27b": {
      id: "qwen/qwen3.6-27b",
      name: "Qwen3.6 27B",
      api: "openai-completions",
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    }
  },
  "huggingface": {
    "MiniMaxAI/MiniMax-M2": {
      id: "MiniMaxAI/MiniMax-M2",
      name: "MiniMax-M2",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 128e3
    },
    "MiniMaxAI/MiniMax-M2.1": {
      id: "MiniMaxAI/MiniMax-M2.1",
      name: "MiniMax-M2.1",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "MiniMaxAI/MiniMax-M2.5": {
      id: "MiniMaxAI/MiniMax-M2.5",
      name: "MiniMax-M2.5",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "MiniMaxAI/MiniMax-M2.7": {
      id: "MiniMaxAI/MiniMax-M2.7",
      name: "MiniMax-M2.7",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "MiniMaxAI/MiniMax-M3": {
      id: "MiniMaxAI/MiniMax-M3",
      name: "MiniMax-M3",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 524288,
      maxTokens: 128e3
    },
    "Qwen/Qwen3-235B-A22B": {
      id: "Qwen/Qwen3-235B-A22B",
      name: "Qwen3 235B-A22B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 0.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 40960,
      maxTokens: 16384
    },
    "Qwen/Qwen3-235B-A22B-Instruct-2507": {
      id: "Qwen/Qwen3-235B-A22B-Instruct-2507",
      name: "Qwen3 235B-A22B Instruct 2507",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.855,
        output: 2.565,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "Qwen/Qwen3-235B-A22B-Thinking-2507": {
      id: "Qwen/Qwen3-235B-A22B-Thinking-2507",
      name: "Qwen3-235B-A22B-Thinking-2507",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "Qwen/Qwen3-32B": {
      id: "Qwen/Qwen3-32B",
      name: "Qwen3 32B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.29,
        output: 0.59,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "Qwen/Qwen3-Coder-30B-A3B-Instruct": {
      id: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
      name: "Qwen3-Coder 30B-A3B Instruct",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.26,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3-Coder-480B-A35B-Instruct": {
      id: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      name: "Qwen3-Coder-480B-A35B-Instruct",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 66536
    },
    "Qwen/Qwen3-Coder-Next": {
      id: "Qwen/Qwen3-Coder-Next",
      name: "Qwen3-Coder-Next",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3-Next-80B-A3B-Instruct": {
      id: "Qwen/Qwen3-Next-80B-A3B-Instruct",
      name: "Qwen3-Next-80B-A3B-Instruct",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 66536
    },
    "Qwen/Qwen3-Next-80B-A3B-Thinking": {
      id: "Qwen/Qwen3-Next-80B-A3B-Thinking",
      name: "Qwen3-Next-80B-A3B-Thinking",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "Qwen/Qwen3.5-122B-A10B": {
      id: "Qwen/Qwen3.5-122B-A10B",
      name: "Qwen3.5 122B-A10B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 3.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3.5-27B": {
      id: "Qwen/Qwen3.5-27B",
      name: "Qwen3.5 27B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3.5-35B-A3B": {
      id: "Qwen/Qwen3.5-35B-A3B",
      name: "Qwen3.5 35B-A3B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3.5-397B-A17B": {
      id: "Qwen/Qwen3.5-397B-A17B",
      name: "Qwen3.5-397B-A17B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "Qwen/Qwen3.5-9B": {
      id: "Qwen/Qwen3.5-9B",
      name: "Qwen3.5 9B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.17,
        output: 0.25,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3.6-27B": {
      id: "Qwen/Qwen3.6-27B",
      name: "Qwen3.6 27B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.47,
        output: 3.19,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "Qwen/Qwen3.6-35B-A3B": {
      id: "Qwen/Qwen3.6-35B-A3B",
      name: "Qwen3.6 35B-A3B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.95,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "XiaomiMiMo/MiMo-V2-Flash": {
      id: "XiaomiMiMo/MiMo-V2-Flash",
      name: "MiMo-V2-Flash",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "XiaomiMiMo/MiMo-V2.5": {
      id: "XiaomiMiMo/MiMo-V2.5",
      name: "MiMo-V2.5",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "XiaomiMiMo/MiMo-V2.5-Pro": {
      id: "XiaomiMiMo/MiMo-V2.5-Pro",
      name: "MiMo-V2.5-Pro",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "deepseek-ai/DeepSeek-R1": {
      id: "deepseek-ai/DeepSeek-R1",
      name: "DeepSeek-R1",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.7,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 64e3,
      maxTokens: 32768
    },
    "deepseek-ai/DeepSeek-R1-0528": {
      id: "deepseek-ai/DeepSeek-R1-0528",
      name: "DeepSeek-R1-0528",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 3,
        output: 5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 163840
    },
    "deepseek-ai/DeepSeek-V3": {
      id: "deepseek-ai/DeepSeek-V3",
      name: "DeepSeek-V3",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 1.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 64e3,
      maxTokens: 8192
    },
    "deepseek-ai/DeepSeek-V3.1": {
      id: "deepseek-ai/DeepSeek-V3.1",
      name: "DeepSeek-V3.1",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 8192
    },
    "deepseek-ai/DeepSeek-V3.2": {
      id: "deepseek-ai/DeepSeek-V3.2",
      name: "DeepSeek-V3.2",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.28,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek-ai/DeepSeek-V4-Flash": {
      id: "deepseek-ai/DeepSeek-V4-Flash",
      name: "DeepSeek V4 Flash",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 384e3
    },
    "deepseek-ai/DeepSeek-V4-Flash-0731": {
      id: "deepseek-ai/DeepSeek-V4-Flash-0731",
      name: "DeepSeek V4 Flash 0731",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 384e3
    },
    "deepseek-ai/DeepSeek-V4-Pro": {
      id: "deepseek-ai/DeepSeek-V4-Pro",
      name: "DeepSeek V4 Pro",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 3625e-6,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 393216
    },
    "google/gemma-4-26B-A4B-it": {
      id: "google/gemma-4-26B-A4B-it",
      name: "Gemma 4 26B A4B IT",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.13,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "google/gemma-4-31B-it": {
      id: "google/gemma-4-31B-it",
      name: "Gemma 4 31B IT",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "meta-llama/Llama-3.3-70B-Instruct": {
      id: "meta-llama/Llama-3.3-70B-Instruct",
      name: "Llama-3.3-70B-Instruct",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.59,
        output: 0.79,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "moonshotai/Kimi-K2-Instruct": {
      id: "moonshotai/Kimi-K2-Instruct",
      name: "Kimi-K2-Instruct",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "moonshotai/Kimi-K2-Instruct-0905": {
      id: "moonshotai/Kimi-K2-Instruct-0905",
      name: "Kimi-K2-Instruct-0905",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "moonshotai/Kimi-K2-Thinking": {
      id: "moonshotai/Kimi-K2-Thinking",
      name: "Kimi-K2-Thinking",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/Kimi-K2.5": {
      id: "moonshotai/Kimi-K2.5",
      name: "Kimi-K2.5",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/Kimi-K2.6": {
      id: "moonshotai/Kimi-K2.6",
      name: "Kimi-K2.6",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/Kimi-K2.7-Code": {
      id: "moonshotai/Kimi-K2.7-Code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/Kimi-K3": {
      id: "moonshotai/Kimi-K3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "openai/gpt-oss-120b": {
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.69,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "openai/gpt-oss-20b": {
      id: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "stepfun-ai/Step-3.5-Flash": {
      id: "stepfun-ai/Step-3.5-Flash",
      name: "Step 3.5 Flash",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 256e3
    },
    "stepfun-ai/Step-3.7-Flash": {
      id: "stepfun-ai/Step-3.7-Flash",
      name: "Step 3.7 Flash",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 256e3
    },
    "tencent/Hy3": {
      id: "tencent/Hy3",
      name: "Hy3",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.58,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 64e3
    },
    "thinkingmachines/Inkling": {
      id: "thinkingmachines/Inkling",
      name: "Inkling",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 4.05,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "thinkingmachines/Inkling-Small": {
      id: "thinkingmachines/Inkling-Small",
      name: "Inkling Small",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 524288,
      maxTokens: 1048576
    },
    "zai-org/GLM-4.5": {
      id: "zai-org/GLM-4.5",
      name: "GLM-4.5",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "zai-org/GLM-4.5-Air": {
      id: "zai-org/GLM-4.5-Air",
      name: "GLM-4.5-Air",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.13,
        output: 0.85,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "zai-org/GLM-4.5V": {
      id: "zai-org/GLM-4.5V",
      name: "GLM-4.5V",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 1.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 65536,
      maxTokens: 16384
    },
    "zai-org/GLM-4.6": {
      id: "zai-org/GLM-4.6",
      name: "GLM-4.6",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.55,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "zai-org/GLM-4.7": {
      id: "zai-org/GLM-4.7",
      name: "GLM-4.7",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "zai-org/GLM-4.7-Flash": {
      id: "zai-org/GLM-4.7-Flash",
      name: "GLM-4.7-Flash",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 128e3
    },
    "zai-org/GLM-5": {
      id: "zai-org/GLM-5",
      name: "GLM-5",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3.2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 131072
    },
    "zai-org/GLM-5.1": {
      id: "zai-org/GLM-5.1",
      name: "GLM-5.1",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3.2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 131072
    },
    "zai-org/GLM-5.2": {
      id: "zai-org/GLM-5.2",
      name: "GLM-5.2",
      api: "openai-completions",
      provider: "huggingface",
      baseUrl: "https://router.huggingface.co/v1",
      compat: { "supportsDeveloperRole": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    }
  },
  "kimi-coding": {
    "k3": {
      id: "k3",
      name: "Kimi K3",
      api: "anthropic-messages",
      provider: "kimi-coding",
      baseUrl: "https://api.kimi.com/coding",
      headers: { "User-Agent": "KimiCLI/1.5" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "k3-256k": {
      id: "k3-256k",
      name: "Kimi K3-256K",
      api: "anthropic-messages",
      provider: "kimi-coding",
      baseUrl: "https://api.kimi.com/coding",
      headers: { "User-Agent": "KimiCLI/1.5" },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "kimi-for-coding": {
      id: "kimi-for-coding",
      name: "Kimi K2.7 Code",
      api: "anthropic-messages",
      provider: "kimi-coding",
      baseUrl: "https://api.kimi.com/coding",
      headers: { "User-Agent": "KimiCLI/1.5" },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "kimi-for-coding-highspeed": {
      id: "kimi-for-coding-highspeed",
      name: "Kimi For Coding HighSpeed",
      api: "anthropic-messages",
      provider: "kimi-coding",
      baseUrl: "https://api.kimi.com/coding",
      headers: { "User-Agent": "KimiCLI/1.5" },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    }
  },
  "minimax": {
    "MiniMax-M2.7": {
      id: "MiniMax-M2.7",
      name: "MiniMax-M2.7",
      api: "anthropic-messages",
      provider: "minimax",
      baseUrl: "https://api.minimax.io/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "MiniMax-M2.7-highspeed": {
      id: "MiniMax-M2.7-highspeed",
      name: "MiniMax-M2.7-highspeed",
      api: "anthropic-messages",
      provider: "minimax",
      baseUrl: "https://api.minimax.io/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    }
  },
  "minimax-cn": {
    "MiniMax-M2.7": {
      id: "MiniMax-M2.7",
      name: "MiniMax-M2.7",
      api: "anthropic-messages",
      provider: "minimax-cn",
      baseUrl: "https://api.minimaxi.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "MiniMax-M2.7-highspeed": {
      id: "MiniMax-M2.7-highspeed",
      name: "MiniMax-M2.7-highspeed",
      api: "anthropic-messages",
      provider: "minimax-cn",
      baseUrl: "https://api.minimaxi.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    }
  },
  "mistral": {
    "codestral-latest": {
      id: "codestral-latest",
      name: "Codestral (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 0.9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 4096
    },
    "devstral-2512": {
      id: "devstral-2512",
      name: "Devstral 2",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "devstral-latest": {
      id: "devstral-latest",
      name: "Devstral 2",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "devstral-medium-2507": {
      id: "devstral-medium-2507",
      name: "Devstral Medium",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "devstral-medium-latest": {
      id: "devstral-medium-latest",
      name: "Devstral 2 (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "devstral-small-2505": {
      id: "devstral-small-2505",
      name: "Devstral Small 2505",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "devstral-small-2507": {
      id: "devstral-small-2507",
      name: "Devstral Small",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "labs-devstral-small-2512": {
      id: "labs-devstral-small-2512",
      name: "Devstral Small 2",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "magistral-medium-latest": {
      id: "magistral-medium-latest",
      name: "Magistral Medium (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2,
        output: 5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "magistral-small": {
      id: "magistral-small",
      name: "Magistral Small",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "ministral-3b-latest": {
      id: "ministral-3b-latest",
      name: "Ministral 3B (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.04,
        output: 0.04,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "ministral-8b-latest": {
      id: "ministral-8b-latest",
      name: "Ministral 8B (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "mistral-large-2411": {
      id: "mistral-large-2411",
      name: "Mistral Large 2.1",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "mistral-large-2512": {
      id: "mistral-large-2512",
      name: "Mistral Large 3",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-large-latest": {
      id: "mistral-large-latest",
      name: "Mistral Large (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-medium-2505": {
      id: "mistral-medium-2505",
      name: "Mistral Medium 3",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "mistral-medium-2508": {
      id: "mistral-medium-2508",
      name: "Mistral Medium 3.1",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-medium-2604": {
      id: "mistral-medium-2604",
      name: "Mistral Medium 3.5",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-medium-3.5": {
      id: "mistral-medium-3.5",
      name: "Mistral Medium 3.5",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-medium-latest": {
      id: "mistral-medium-latest",
      name: "Mistral Medium (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "mistral-nemo": {
      id: "mistral-nemo",
      name: "Mistral Nemo",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "mistral-small-2506": {
      id: "mistral-small-2506",
      name: "Mistral Small 3.2",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "mistral-small-2603": {
      id: "mistral-small-2603",
      name: "Mistral Small 4",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral-small-latest": {
      id: "mistral-small-latest",
      name: "Mistral Small (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "open-mistral-7b": {
      id: "open-mistral-7b",
      name: "Mistral 7B",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.25,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8e3,
      maxTokens: 8e3
    },
    "open-mistral-nemo": {
      id: "open-mistral-nemo",
      name: "Open Mistral Nemo",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "open-mixtral-8x22b": {
      id: "open-mixtral-8x22b",
      name: "Mixtral 8x22B",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 64e3,
      maxTokens: 64e3
    },
    "open-mixtral-8x7b": {
      id: "open-mixtral-8x7b",
      name: "Mixtral 8x7B",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.7,
        output: 0.7,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 32e3
    },
    "pixtral-12b": {
      id: "pixtral-12b",
      name: "Pixtral 12B",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "pixtral-large-latest": {
      id: "pixtral-large-latest",
      name: "Pixtral Large (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "voxtral-small-latest": {
      id: "voxtral-small-latest",
      name: "Voxtral Small (latest)",
      api: "mistral-conversations",
      provider: "mistral",
      baseUrl: "https://api.mistral.ai",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 32e3
    }
  },
  "moonshotai": {
    "kimi-k2-0711-preview": {
      id: "kimi-k2-0711-preview",
      name: "Kimi K2 0711",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "kimi-k2-0905-preview": {
      id: "kimi-k2-0905-preview",
      name: "Kimi K2 0905",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-thinking": {
      id: "kimi-k2-thinking",
      name: "Kimi K2 Thinking",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-thinking-turbo": {
      id: "kimi-k2-thinking-turbo",
      name: "Kimi K2 Thinking Turbo",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.15,
        output: 8,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-turbo-preview": {
      id: "kimi-k2-turbo-preview",
      name: "Kimi K2 Turbo",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2.4,
        output: 10,
        cacheRead: 0.6,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.5": {
      id: "kimi-k2.5",
      name: "Kimi K2.5",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.6": {
      id: "kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.7-code": {
      id: "kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.7-code-highspeed": {
      id: "kimi-k2.7-code-highspeed",
      name: "Kimi K2.7 Code HighSpeed",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.9,
        output: 8,
        cacheRead: 0.38,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k3": {
      id: "kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "moonshotai",
      baseUrl: "https://api.moonshot.ai/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "moonshotai-cn": {
    "kimi-k2-0711-preview": {
      id: "kimi-k2-0711-preview",
      name: "Kimi K2 0711",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "kimi-k2-0905-preview": {
      id: "kimi-k2-0905-preview",
      name: "Kimi K2 0905",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-thinking": {
      id: "kimi-k2-thinking",
      name: "Kimi K2 Thinking",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-thinking-turbo": {
      id: "kimi-k2-thinking-turbo",
      name: "Kimi K2 Thinking Turbo",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.15,
        output: 8,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2-turbo-preview": {
      id: "kimi-k2-turbo-preview",
      name: "Kimi K2 Turbo",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2.4,
        output: 10,
        cacheRead: 0.6,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.5": {
      id: "kimi-k2.5",
      name: "Kimi K2.5",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.6": {
      id: "kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.7-code": {
      id: "kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k2.7-code-highspeed": {
      id: "kimi-k2.7-code-highspeed",
      name: "Kimi K2.7 Code HighSpeed",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.9,
        output: 8,
        cacheRead: 0.38,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k3": {
      id: "kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "moonshotai-cn",
      baseUrl: "https://api.moonshot.cn/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "openai": {
    "gpt-4": {
      id: "gpt-4",
      name: "GPT-4",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 30,
        output: 60,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8192,
      maxTokens: 8192
    },
    "gpt-4-turbo": {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "gpt-4.1": {
      id: "gpt-4.1",
      name: "GPT-4.1",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4.1-mini": {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.6,
        cacheRead: 0.1,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4.1-nano": {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 nano",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "gpt-4o": {
      id: "gpt-4o",
      name: "GPT-4o",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-2024-05-13": {
      id: "gpt-4o-2024-05-13",
      name: "GPT-4o (2024-05-13)",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "gpt-4o-2024-08-06": {
      id: "gpt-4o-2024-08-06",
      name: "GPT-4o (2024-08-06)",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-2024-11-20": {
      id: "gpt-4o-2024-11-20",
      name: "GPT-4o (2024-11-20)",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-4o-mini": {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5": {
      id: "gpt-5",
      name: "GPT-5",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-chat-latest": {
      id: "gpt-5-chat-latest",
      name: "GPT-5 Chat Latest",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5-mini": {
      id: "gpt-5-mini",
      name: "GPT-5 Mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-nano": {
      id: "gpt-5-nano",
      name: "GPT-5 Nano",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.05,
        output: 0.4,
        cacheRead: 5e-3,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-pro": {
      id: "gpt-5-pro",
      name: "GPT-5 Pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 120,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 272e3
    },
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none" },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex": {
      id: "gpt-5.1-codex",
      name: "GPT-5.1 Codex",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 5,
        cacheRead: 0.125,
        cacheWrite: 1.25
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-max": {
      id: "gpt-5.1-codex-max",
      name: "GPT-5.1 Codex Max",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2-chat-latest": {
      id: "gpt-5.2-chat-latest",
      name: "GPT-5.2 Chat",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5.2-pro": {
      id: "gpt-5.2-pro",
      name: "GPT-5.2 Pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 21,
        output: 168,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-chat-latest": {
      id: "gpt-5.3-chat-latest",
      name: "GPT-5.3 Chat (latest)",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: false,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-codex-spark": {
      id: "gpt-5.3-codex-spark",
      name: "GPT-5.3 Codex Spark",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.4-mini": {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-nano": {
      id: "gpt-5.4-nano",
      name: "GPT-5.4 nano",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-pro": {
      id: "gpt-5.4-pro",
      name: "GPT-5.4 Pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.5-pro": {
      id: "gpt-5.5-pro",
      name: "GPT-5.5 Pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6": {
      id: "gpt-5.6",
      name: "GPT-5.6",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      thinkingLevelMap: { "off": "none", "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-realtime-2.1": {
      id: "gpt-realtime-2.1",
      name: "GPT-Realtime-2.1",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 4,
        output: 24,
        cacheRead: 0.4,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "o1": {
      id: "o1",
      name: "o1",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 60,
        cacheRead: 7.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o1-pro": {
      id: "o1-pro",
      name: "o1-pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 150,
        output: 600,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3": {
      id: "o3",
      name: "o3",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-mini": {
      id: "o3-mini",
      name: "o3-mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o3-pro": {
      id: "o3-pro",
      name: "o3-pro",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 20,
        output: 80,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "o4-mini": {
      id: "o4-mini",
      name: "o4-mini",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    }
  },
  "openai-codex": {
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-max": {
      id: "gpt-5.1-codex-max",
      name: "GPT-5.1 Codex Max",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-mini": {
      id: "gpt-5.1-codex-mini",
      name: "GPT-5.1 Codex Mini",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "minimal": "medium", "low": "medium", "medium": "medium", "high": "high" },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.2-codex": {
      id: "gpt-5.2-codex",
      name: "GPT-5.2 Codex",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.3-codex-spark": {
      id: "gpt-5.3-codex-spark",
      name: "GPT-5.3 Codex Spark",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.4-mini": {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 Mini",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": "low" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "openai-codex-responses",
      provider: "openai-codex",
      baseUrl: "https://chatgpt.com/backend-api",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 3.125
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    }
  },
  "opencode": {
    "big-pickle": {
      id: "big-pickle",
      name: "Big Pickle",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "claude-fable-5": {
      id: "claude-fable-5",
      name: "Claude Fable 5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-haiku-4-5": {
      id: "claude-haiku-4-5",
      name: "Claude Haiku 4.5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-5": {
      id: "claude-opus-4-5",
      name: "Claude Opus 4.5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-opus-4-6": {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-7": {
      id: "claude-opus-4-7",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-4-8": {
      id: "claude-opus-4-8",
      name: "Claude Opus 4.8",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-opus-5": {
      id: "claude-opus-5",
      name: "Claude Opus 5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "claude-sonnet-4": {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-sonnet-4-5": {
      id: "claude-sonnet-4-5",
      name: "Claude Sonnet 4.5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "claude-sonnet-4-6": {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "claude-sonnet-5": {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "deepseek-v4-flash": {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0.028,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "deepseek-v4-flash-free": {
      id: "deepseek-v4-flash-free",
      name: "DeepSeek V4 Flash Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 128e3
    },
    "deepseek-v4-pro": {
      id: "deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 1.74,
        output: 3.84,
        cacheRead: 0.145,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "gemini-3-flash": {
      id: "gemini-3-flash",
      name: "Gemini 3 Flash",
      api: "google-generative-ai",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.05,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.1-pro": {
      id: "gemini-3.1-pro",
      name: "Gemini 3.1 Pro Preview",
      api: "google-generative-ai",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": "LOW", "medium": null, "high": "HIGH" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.5-flash": {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      api: "google-generative-ai",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.5-flash-lite": {
      id: "gemini-3.5-flash-lite",
      name: "Gemini 3.5 Flash Lite",
      api: "google-generative-ai",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "gemini-3.6-flash": {
      id: "gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      api: "google-generative-ai",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "glm-5": {
      id: "glm-5",
      name: "GLM-5",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3.2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "glm-5.1": {
      id: "glm-5.1",
      name: "GLM-5.1",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "glm-5.2": {
      id: "glm-5.2",
      name: "GLM-5.2",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "gpt-5": {
      id: "gpt-5",
      name: "GPT-5",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.07,
        output: 8.5,
        cacheRead: 0.107,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-codex": {
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.07,
        output: 8.5,
        cacheRead: 0.107,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5-nano": {
      id: "gpt-5-nano",
      name: "GPT-5 Nano",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.05,
        output: 0.4,
        cacheRead: 5e-3,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1": {
      id: "gpt-5.1",
      name: "GPT-5.1",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.07,
        output: 8.5,
        cacheRead: 0.107,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex": {
      id: "gpt-5.1-codex",
      name: "GPT-5.1 Codex",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.07,
        output: 8.5,
        cacheRead: 0.107,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-max": {
      id: "gpt-5.1-codex-max",
      name: "GPT-5.1 Codex Max",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.1-codex-mini": {
      id: "gpt-5.1-codex-mini",
      name: "GPT-5.1 Codex Mini",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null },
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.025,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2": {
      id: "gpt-5.2",
      name: "GPT-5.2",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.2-codex": {
      id: "gpt-5.2-codex",
      name: "GPT-5.2 Codex",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.3-codex": {
      id: "gpt-5.3-codex",
      name: "GPT-5.3 Codex",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4": {
      id: "gpt-5.4",
      name: "GPT-5.4",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 272e3,
      maxTokens: 128e3
    },
    "gpt-5.4-mini": {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 Mini",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-nano": {
      id: "gpt-5.4-nano",
      name: "GPT-5.4 Nano",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "gpt-5.4-pro": {
      id: "gpt-5.4-pro",
      name: "GPT-5.4 Pro",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 30,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.5": {
      id: "gpt-5.5",
      name: "GPT-5.5",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.5-pro": {
      id: "gpt-5.5-pro",
      name: "GPT-5.5 Pro",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 30,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-sol": {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "gpt-5.6-terra": {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 3.125
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "grok-4.5": {
      id: "grok-4.5",
      name: "Grok 4.5",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 5e5
    },
    "grok-build-0.1": {
      id: "grok-build-0.1",
      name: "Grok Build 0.1",
      api: "openai-responses",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "hy3-free": {
      id: "hy3-free",
      name: "Hy3 Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 19e4,
      maxTokens: 64e3
    },
    "kimi-k2.5": {
      id: "kimi-k2.5",
      name: "Kimi K2.5",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.08,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "kimi-k2.6": {
      id: "kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "kimi-k2.7-code": {
      id: "kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k3": {
      id: "kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "laguna-s-2.1-free": {
      id: "laguna-s-2.1-free",
      name: "Laguna S 2.1 Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "ling-3.0-tiny-free": {
      id: "ling-3.0-tiny-free",
      name: "Ling-3.0-tiny Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "longcat-2.0-free": {
      id: "longcat-2.0-free",
      name: "LongCat-2.0 Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "mimo-v2.5-free": {
      id: "mimo-v2.5-free",
      name: "MiMo V2.5 Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "minimax-m2.5": {
      id: "minimax-m2.5",
      name: "MiniMax-M2.5",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax-m2.7": {
      id: "minimax-m2.7",
      name: "MiniMax-M2.7",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax-m3": {
      id: "minimax-m3",
      name: "MiniMax-M3",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 512e3,
      maxTokens: 128e3
    },
    "nemotron-3-ultra-free": {
      id: "nemotron-3-ultra-free",
      name: "Nemotron 3 Ultra Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "nemotron-3.5-lightning-free": {
      id: "nemotron-3.5-lightning-free",
      name: "Nemotron 3.5 Lightning Free",
      api: "openai-completions",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen3.5-plus": {
      id: "qwen3.5-plus",
      name: "Qwen3.5 Plus",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0.25
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen3.6-plus": {
      id: "qwen3.6-plus",
      name: "Qwen3.6 Plus",
      api: "anthropic-messages",
      provider: "opencode",
      baseUrl: "https://opencode.ai/zen",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.05,
        cacheWrite: 0.625
      },
      contextWindow: 262144,
      maxTokens: 65536
    }
  },
  "opencode-go": {
    "deepseek-v4-flash": {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash (2x usage)",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.14,
        cacheRead: 14e-4,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "deepseek-v4-pro": {
      id: "deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 3625e-6,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "glm-5.1": {
      id: "glm-5.1",
      name: "GLM-5.1",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 32768
    },
    "glm-5.2": {
      id: "glm-5.2",
      name: "GLM-5.2",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "gpt-5.6-luna": {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna (2x usage)",
      api: "openai-responses",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.6,
        cacheRead: 0.01,
        cacheWrite: 0.125
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "grok-4.5": {
      id: "grok-4.5",
      name: "Grok 4.5",
      api: "openai-responses",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 5e5
    },
    "hy3": {
      id: "hy3",
      name: "Hy3",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.58,
        cacheRead: 0.035,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 64e3
    },
    "kimi-k2.6": {
      id: "kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "kimi-k2.7-code": {
      id: "kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "kimi-k3": {
      id: "kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5": {
      id: "mimo-v2.5",
      name: "MiMo V2.5",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "mimo-v2.5-pro": {
      id: "mimo-v2.5-pro",
      name: "MiMo V2.5 Pro",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 3625e-6,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 128e3
    },
    "minimax-m2.7": {
      id: "minimax-m2.7",
      name: "MiniMax-M2.7",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax-m3": {
      id: "minimax-m3",
      name: "MiniMax-M3",
      api: "anthropic-messages",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "qwen3.6-plus": {
      id: "qwen3.6-plus",
      name: "Qwen3.6 Plus",
      api: "openai-completions",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go/v1",
      compat: { "thinkingFormat": "qwen" },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.05,
        cacheWrite: 0.625
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen3.7-max": {
      id: "qwen3.7-max",
      name: "Qwen3.7 Max",
      api: "anthropic-messages",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 7.5,
        cacheRead: 0.5,
        cacheWrite: 3.125
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen3.7-plus": {
      id: "qwen3.7-plus",
      name: "Qwen3.7 Plus",
      api: "anthropic-messages",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.6,
        cacheRead: 0.04,
        cacheWrite: 0.5
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen3.8-max": {
      id: "qwen3.8-max",
      name: "Qwen3.8 Max",
      api: "anthropic-messages",
      provider: "opencode-go",
      baseUrl: "https://opencode.ai/zen/go",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.25,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 131072
    }
  },
  "openrouter": {
    "ai21/jamba-large-1.7": {
      id: "ai21/jamba-large-1.7",
      name: "AI21: Jamba Large 1.7",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 4096
    },
    "aion-labs/aion-2.0": {
      id: "aion-labs/aion-2.0",
      name: "AionLabs: Aion-2.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.7999999999999999,
        output: 1.5999999999999999,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "aion-labs/aion-3.0": {
      id: "aion-labs/aion-3.0",
      name: "AionLabs: Aion-3.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 3,
        output: 6,
        cacheRead: 0.75,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "aion-labs/aion-3.0-mini": {
      id: "aion-labs/aion-3.0-mini",
      name: "AionLabs: Aion-3.0-Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.7,
        output: 1.4,
        cacheRead: 0.18,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "amazon/nova-2-lite-v1": {
      id: "amazon/nova-2-lite-v1",
      name: "Amazon: Nova 2 Lite",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65535
    },
    "amazon/nova-lite-v1": {
      id: "amazon/nova-lite-v1",
      name: "Amazon: Nova Lite 1.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.06,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 5120
    },
    "amazon/nova-micro-v1": {
      id: "amazon/nova-micro-v1",
      name: "Amazon: Nova Micro 1.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.035,
        output: 0.14,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 5120
    },
    "amazon/nova-premier-v1": {
      id: "amazon/nova-premier-v1",
      name: "Amazon: Nova Premier 1.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 12.5,
        cacheRead: 0.625,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 32e3
    },
    "amazon/nova-pro-v1": {
      id: "amazon/nova-pro-v1",
      name: "Amazon: Nova Pro 1.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.7999999999999999,
        output: 3.1999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 5120
    },
    "anthropic/claude-3-haiku": {
      id: "anthropic/claude-3-haiku",
      name: "Anthropic: Claude 3 Haiku",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.25,
        cacheRead: 0.03,
        cacheWrite: 0.3
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "anthropic/claude-fable-5": {
      id: "anthropic/claude-fable-5",
      name: "Anthropic: Claude Fable 5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-haiku-4.5": {
      id: "anthropic/claude-haiku-4.5",
      name: "Anthropic: Claude Haiku 4.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.09999999999999999,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-opus-4": {
      id: "anthropic/claude-opus-4",
      name: "Anthropic: Claude Opus 4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "anthropic/claude-opus-4.1": {
      id: "anthropic/claude-opus-4.1",
      name: "Anthropic: Claude Opus 4.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "anthropic/claude-opus-4.5": {
      id: "anthropic/claude-opus-4.5",
      name: "Anthropic: Claude Opus 4.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-opus-4.6": {
      id: "anthropic/claude-opus-4.6",
      name: "Anthropic: Claude Opus 4.6",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.7": {
      id: "anthropic/claude-opus-4.7",
      name: "Anthropic: Claude Opus 4.7",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.7-fast": {
      id: "anthropic/claude-opus-4.7-fast",
      name: "Anthropic: Claude Opus 4.7 (Fast)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 150,
        cacheRead: 3,
        cacheWrite: 37.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.8": {
      id: "anthropic/claude-opus-4.8",
      name: "Anthropic: Claude Opus 4.8",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.8-fast": {
      id: "anthropic/claude-opus-4.8-fast",
      name: "Anthropic: Claude Opus 4.8 (Fast)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-5": {
      id: "anthropic/claude-opus-5",
      name: "Claude Opus 5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-5-fast": {
      id: "anthropic/claude-opus-5-fast",
      name: "Claude Opus 5 (Fast)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-sonnet-4": {
      id: "anthropic/claude-sonnet-4",
      name: "Anthropic: Claude Sonnet 4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "anthropic/claude-sonnet-4.5": {
      id: "anthropic/claude-sonnet-4.5",
      name: "Anthropic: Claude Sonnet 4.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "anthropic/claude-sonnet-4.6": {
      id: "anthropic/claude-sonnet-4.6",
      name: "Anthropic: Claude Sonnet 4.6",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-sonnet-5": {
      id: "anthropic/claude-sonnet-5",
      name: "Anthropic: Claude Sonnet 5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.19999999999999998,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "arcee-ai/trinity-large-thinking": {
      id: "arcee-ai/trinity-large-thinking",
      name: "Arcee AI: Trinity Large Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.85,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "arcee-ai/virtuoso-large": {
      id: "arcee-ai/virtuoso-large",
      name: "Arcee AI: Virtuoso Large",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.75,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 64e3
    },
    "auto": {
      id: "auto",
      name: "Auto",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 3e4
    },
    "bytedance-seed/seed-1.6": {
      id: "bytedance-seed/seed-1.6",
      name: "ByteDance Seed: Seed 1.6",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "bytedance-seed/seed-1.6-flash": {
      id: "bytedance-seed/seed-1.6-flash",
      name: "ByteDance Seed: Seed 1.6 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "bytedance-seed/seed-2.0-code": {
      id: "bytedance-seed/seed-2.0-code",
      name: "ByteDance Seed: Seed-2.0-Code",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "bytedance-seed/seed-2.0-lite": {
      id: "bytedance-seed/seed-2.0-lite",
      name: "ByteDance Seed: Seed-2.0-Lite",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "bytedance-seed/seed-2.0-mini": {
      id: "bytedance-seed/seed-2.0-mini",
      name: "ByteDance Seed: Seed-2.0-Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "cohere/command-r-08-2024": {
      id: "cohere/command-r-08-2024",
      name: "Cohere: Command R (08-2024)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "cohere/command-r-plus-08-2024": {
      id: "cohere/command-r-plus-08-2024",
      name: "Cohere: Command R+ (08-2024)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "cohere/north-mini-code:free": {
      id: "cohere/north-mini-code:free",
      name: "Cohere: North Mini Code (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 64e3
    },
    "deepseek/deepseek-chat": {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek: DeepSeek V3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.2574,
        output: 1.0287,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 16e3
    },
    "deepseek/deepseek-chat-v3-0324": {
      id: "deepseek/deepseek-chat-v3-0324",
      name: "DeepSeek: DeepSeek V3 0324",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 1.12,
        cacheRead: 0.135,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek/deepseek-chat-v3.1": {
      id: "deepseek/deepseek-chat-v3.1",
      name: "DeepSeek: DeepSeek V3.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.95,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 32768
    },
    "deepseek/deepseek-r1": {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek: R1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.7,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 16e3
    },
    "deepseek/deepseek-r1-0528": {
      id: "deepseek/deepseek-r1-0528",
      name: "DeepSeek: R1 0528",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 2.1500000000000004,
        cacheRead: 0.35,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 32768
    },
    "deepseek/deepseek-v3.1-terminus": {
      id: "deepseek/deepseek-v3.1-terminus",
      name: "DeepSeek: DeepSeek V3.1 Terminus",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 1,
        cacheRead: 0.135,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 32768
    },
    "deepseek/deepseek-v3.2": {
      id: "deepseek/deepseek-v3.2",
      name: "DeepSeek: DeepSeek V3.2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.26899999999999996,
        output: 0.39999999999999997,
        cacheRead: 0.13449999999999998,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek/deepseek-v3.2-exp": {
      id: "deepseek/deepseek-v3.2-exp",
      name: "DeepSeek: DeepSeek V3.2 Exp",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 0.41,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek/deepseek-v4-flash": {
      id: "deepseek/deepseek-v4-flash",
      name: "DeepSeek: DeepSeek V4 Flash 0423",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0.028,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 393216
    },
    "deepseek/deepseek-v4-flash-0731": {
      id: "deepseek/deepseek-v4-flash-0731",
      name: "DeepSeek: DeepSeek V4 Flash 0731",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.08,
        output: 0.18,
        cacheRead: 0.016,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 384e3
    },
    "deepseek/deepseek-v4-pro": {
      id: "deepseek/deepseek-v4-pro",
      name: "DeepSeek: DeepSeek V4 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.63168,
        output: 1.26336,
        cacheRead: 0.053298,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 393216
    },
    "google/gemini-2.5-flash": {
      id: "google/gemini-2.5-flash",
      name: "Google: Gemini 2.5 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65535
    },
    "google/gemini-2.5-flash-lite": {
      id: "google/gemini-2.5-flash-lite",
      name: "Google: Gemini 2.5 Flash Lite",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 0.01,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65535
    },
    "google/gemini-2.5-pro": {
      id: "google/gemini-2.5-pro",
      name: "Google: Gemini 2.5 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-2.5-pro-preview": {
      id: "google/gemini-2.5-pro-preview",
      name: "Google: Gemini 2.5 Pro Preview 06-05",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-2.5-pro-preview-05-06": {
      id: "google/gemini-2.5-pro-preview-05-06",
      name: "Google: Gemini 2.5 Pro Preview 05-06",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65535
    },
    "google/gemini-3-flash-preview": {
      id: "google/gemini-3-flash-preview",
      name: "Google: Gemini 3 Flash Preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3-pro-image": {
      id: "google/gemini-3-pro-image",
      name: "Google: Nano Banana Pro (Gemini 3 Pro Image)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "google/gemini-3.1-flash-lite": {
      id: "google/gemini-3.1-flash-lite",
      name: "Google: Gemini 3.1 Flash Lite",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.1-flash-lite-preview": {
      id: "google/gemini-3.1-flash-lite-preview",
      name: "Google: Gemini 3.1 Flash Lite Preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.1-pro-preview": {
      id: "google/gemini-3.1-pro-preview",
      name: "Google: Gemini 3.1 Pro Preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.1-pro-preview-customtools": {
      id: "google/gemini-3.1-pro-preview-customtools",
      name: "Google: Gemini 3.1 Pro Preview Custom Tools",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.5-flash": {
      id: "google/gemini-3.5-flash",
      name: "Google: Gemini 3.5 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.5-flash-lite": {
      id: "google/gemini-3.5-flash-lite",
      name: "Google: Gemini 3.5 Flash Lite",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.6-flash": {
      id: "google/gemini-3.6-flash",
      name: "Google: Gemini 3.6 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemma-3-12b-it": {
      id: "google/gemma-3-12b-it",
      name: "Google: Gemma 3 12B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.049999999999999996,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "google/gemma-3-27b-it": {
      id: "google/gemma-3-27b-it",
      name: "Google: Gemma 3 27B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.08,
        output: 0.44999999999999996,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "google/gemma-4-26b-a4b-it": {
      id: "google/gemma-4-26b-a4b-it",
      name: "Google: Gemma 4 26B A4B ",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.12,
        output: 0.39999999999999997,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "google/gemma-4-26b-a4b-it:free": {
      id: "google/gemma-4-26b-a4b-it:free",
      name: "Google: Gemma 4 26B A4B  (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "google/gemma-4-31b-it": {
      id: "google/gemma-4-31b-it",
      name: "Google: Gemma 4 31B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.33999999999999997,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "google/gemma-4-31b-it:free": {
      id: "google/gemma-4-31b-it:free",
      name: "Google: Gemma 4 31B (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "ibm-granite/granite-4.1-8b": {
      id: "ibm-granite/granite-4.1-8b",
      name: "IBM: Granite 4.1 8B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.049999999999999996,
        output: 0.09999999999999999,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "inception/mercury-2": {
      id: "inception/mercury-2",
      name: "Inception: Mercury 2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.75,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 5e4
    },
    "inclusionai/ling-2.6-1t": {
      id: "inclusionai/ling-2.6-1t",
      name: "inclusionAI: Ling-2.6-1T",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.625,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "inclusionai/ling-2.6-flash": {
      id: "inclusionai/ling-2.6-flash",
      name: "inclusionAI: Ling-2.6-flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.01,
        output: 0.03,
        cacheRead: 2e-3,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "inclusionai/ling-3.0-flash": {
      id: "inclusionai/ling-3.0-flash",
      name: "Ling-3.0-flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.020999999999999998,
        output: 0.063,
        cacheRead: 0.004200000000000001,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "inclusionai/ling-3.0-tiny:free": {
      id: "inclusionai/ling-3.0-tiny:free",
      name: "inclusionAI: Ling 3.0 Tiny (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "inclusionai/ring-2.6-1t": {
      id: "inclusionai/ring-2.6-1t",
      name: "inclusionAI: Ring-2.6-1T",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.625,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "kwaipilot/kat-coder-air-v2.5": {
      id: "kwaipilot/kat-coder-air-v2.5",
      name: "Kwaipilot: KAT-Coder-Air V2.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8e4
    },
    "kwaipilot/kat-coder-pro-v2": {
      id: "kwaipilot/kat-coder-pro-v2",
      name: "Kwaipilot: KAT-Coder-Pro V2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 8e4
    },
    "kwaipilot/kat-coder-pro-v2.5": {
      id: "kwaipilot/kat-coder-pro-v2.5",
      name: "Kwaipilot: KAT-Coder-Pro V2.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.74,
        output: 2.96,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8e4
    },
    "meituan/longcat-2.0": {
      id: "meituan/longcat-2.0",
      name: "Meituan: LongCat 2.0",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 6e-3,
        cacheWrite: 0
      },
      contextWindow: 1048756,
      maxTokens: 262144
    },
    "meta-llama/llama-3.1-70b-instruct": {
      id: "meta-llama/llama-3.1-70b-instruct",
      name: "Meta: Llama 3.1 70B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.39999999999999997,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "meta-llama/llama-3.1-8b-instruct": {
      id: "meta-llama/llama-3.1-8b-instruct",
      name: "Meta: Llama 3.1 8B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.049999999999999996,
        output: 0.08,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "meta-llama/llama-3.3-70b-instruct": {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Meta: Llama 3.3 70B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.32,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "meta-llama/llama-4-maverick": {
      id: "meta-llama/llama-4-maverick",
      name: "Meta: Llama 4 Maverick",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.696,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 4096
    },
    "meta-llama/llama-4-scout": {
      id: "meta-llama/llama-4-scout",
      name: "Meta: Llama 4 Scout",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1310720,
      maxTokens: 16384
    },
    "meta/muse-glimmer-30b": {
      id: "meta/muse-glimmer-30b",
      name: "Meta: Muse Glimmer 30B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.35,
        output: 1.5,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "meta/muse-spark-1.1": {
      id: "meta/muse-spark-1.1",
      name: "Meta: Muse Spark 1.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 4.25,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 4096
    },
    "meta/muse-spark-1.2": {
      id: "meta/muse-spark-1.2",
      name: "Meta: Muse Spark 1.2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 4.25,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 4096
    },
    "minimax/minimax-m1": {
      id: "minimax/minimax-m1",
      name: "MiniMax: MiniMax M1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.55,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 4e4
    },
    "minimax/minimax-m2": {
      id: "minimax/minimax-m2",
      name: "MiniMax: MiniMax M2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.255,
        output: 1.02,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m2.1": {
      id: "minimax/minimax-m2.1",
      name: "MiniMax: MiniMax M2.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m2.5": {
      id: "minimax/minimax-m2.5",
      name: "MiniMax: MiniMax M2.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.8999999999999999,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 196608
    },
    "minimax/minimax-m2.7": {
      id: "minimax/minimax-m2.7",
      name: "MiniMax: MiniMax M2.7",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m3": {
      id: "minimax/minimax-m3",
      name: "MiniMax: MiniMax M3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 512e3
    },
    "mistralai/codestral-2508": {
      id: "mistralai/codestral-2508",
      name: "Mistral: Codestral 2508",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 0.8999999999999999,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 4096
    },
    "mistralai/ministral-14b-2512": {
      id: "mistralai/ministral-14b-2512",
      name: "Mistral: Ministral 3 14B 2512",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.19999999999999998,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "mistralai/ministral-3b-2512": {
      id: "mistralai/ministral-3b-2512",
      name: "Mistral: Ministral 3 3B 2512",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.09999999999999999,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "mistralai/ministral-8b-2512": {
      id: "mistralai/ministral-8b-2512",
      name: "Mistral: Ministral 3 8B 2512",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "mistralai/mistral-large": {
      id: "mistralai/mistral-large",
      name: "Mistral Large",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "mistralai/mistral-large-2407": {
      id: "mistralai/mistral-large-2407",
      name: "Mistral Large 2407",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "mistralai/mistral-large-2512": {
      id: "mistralai/mistral-large-2512",
      name: "Mistral: Mistral Large 3 2512",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "mistralai/mistral-medium-3": {
      id: "mistralai/mistral-medium-3",
      name: "Mistral: Mistral Medium 3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 2,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "mistralai/mistral-medium-3-5": {
      id: "mistralai/mistral-medium-3-5",
      name: "Mistral: Mistral Medium 3.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "mistralai/mistral-medium-3.1": {
      id: "mistralai/mistral-medium-3.1",
      name: "Mistral: Mistral Medium 3.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 2,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 4096
    },
    "mistralai/mistral-nemo": {
      id: "mistralai/mistral-nemo",
      name: "Mistral: Mistral Nemo",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.019000000000000003,
        output: 0.03,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "mistralai/mistral-saba": {
      id: "mistralai/mistral-saba",
      name: "Mistral: Saba",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.19999999999999998,
        output: 0.6,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 32768,
      maxTokens: 4096
    },
    "mistralai/mistral-small-2603": {
      id: "mistralai/mistral-small-2603",
      name: "Mistral: Mistral Small 4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "mistralai/mistral-small-3.2-24b-instruct": {
      id: "mistralai/mistral-small-3.2-24b-instruct",
      name: "Mistral: Mistral Small 3.2 24B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09375,
        output: 0.25,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 16384
    },
    "mistralai/mixtral-8x22b-instruct": {
      id: "mistralai/mixtral-8x22b-instruct",
      name: "Mistral: Mixtral 8x22B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 65536,
      maxTokens: 4096
    },
    "mistralai/voxtral-small-24b-2507": {
      id: "mistralai/voxtral-small-24b-2507",
      name: "Mistral: Voxtral Small 24B 2507",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.3,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 4096
    },
    "moonshotai/kimi-k2": {
      id: "moonshotai/kimi-k2",
      name: "MoonshotAI: Kimi K2 0711",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5700000000000001,
        output: 2.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 100352
    },
    "moonshotai/kimi-k2-0905": {
      id: "moonshotai/kimi-k2-0905",
      name: "MoonshotAI: Kimi K2 0905",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 100352
    },
    "moonshotai/kimi-k2-thinking": {
      id: "moonshotai/kimi-k2-thinking",
      name: "MoonshotAI: Kimi K2 Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 100352
    },
    "moonshotai/kimi-k2.5": {
      id: "moonshotai/kimi-k2.5",
      name: "MoonshotAI: Kimi K2.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.41,
        output: 2.06,
        cacheRead: 0.07,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "moonshotai/kimi-k2.6": {
      id: "moonshotai/kimi-k2.6",
      name: "MoonshotAI: Kimi K2.6",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5795,
        output: 2.44,
        cacheRead: 0.0976,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/kimi-k2.7-code": {
      id: "moonshotai/kimi-k2.7-code",
      name: "MoonshotAI: Kimi K2.7 Code",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.7,
        output: 3.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/kimi-k3": {
      id: "moonshotai/kimi-k3",
      name: "MoonshotAI: Kimi K3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "nex-agi/nex-n2-mini": {
      id: "nex-agi/nex-n2-mini",
      name: "Nex AGI: Nex-N2-Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.024999999999999998,
        output: 0.09999999999999999,
        cacheRead: 25e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "nex-agi/nex-n2-pro": {
      id: "nex-agi/nex-n2-pro",
      name: "Nex AGI: Nex-N2-Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "nvidia/nemotron-3-nano-30b-a3b": {
      id: "nvidia/nemotron-3-nano-30b-a3b",
      name: "NVIDIA: Nemotron 3 Nano 30B A3B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.049999999999999996,
        output: 0.19999999999999998,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 228e3
    },
    "nvidia/nemotron-3-nano-30b-a3b:free": {
      id: "nvidia/nemotron-3-nano-30b-a3b:free",
      name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 4096
    },
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
      id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      name: "NVIDIA: Nemotron 3 Nano Omni (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 65536
    },
    "nvidia/nemotron-3-super-120b-a12b": {
      id: "nvidia/nemotron-3-super-120b-a12b",
      name: "NVIDIA: Nemotron 3 Super",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.08499999999999999,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 16384
    },
    "nvidia/nemotron-3-super-120b-a12b:free": {
      id: "nvidia/nemotron-3-super-120b-a12b:free",
      name: "NVIDIA: Nemotron 3 Super (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "nvidia/nemotron-3-ultra-550b-a55b": {
      id: "nvidia/nemotron-3-ultra-550b-a55b",
      name: "NVIDIA: Nemotron 3 Ultra",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 3.5999999999999996,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 512288,
      maxTokens: 4096
    },
    "nvidia/nemotron-3-ultra-550b-a55b:free": {
      id: "nvidia/nemotron-3-ultra-550b-a55b:free",
      name: "NVIDIA: Nemotron 3 Ultra (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "nvidia/nemotron-3.5-lightning:free": {
      id: "nvidia/nemotron-3.5-lightning:free",
      name: "NVIDIA: Nemotron 3.5 Lightning (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "nvidia/nemotron-nano-12b-v2-vl:free": {
      id: "nvidia/nemotron-nano-12b-v2-vl:free",
      name: "NVIDIA: Nemotron Nano 12B 2 VL (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "nvidia/nemotron-nano-9b-v2:free": {
      id: "nvidia/nemotron-nano-9b-v2:free",
      name: "NVIDIA: Nemotron Nano 9B V2 (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "openai/gpt-3.5-turbo": {
      id: "openai/gpt-3.5-turbo",
      name: "OpenAI: GPT-3.5 Turbo",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 16385,
      maxTokens: 4096
    },
    "openai/gpt-3.5-turbo-0613": {
      id: "openai/gpt-3.5-turbo-0613",
      name: "OpenAI: GPT-3.5 Turbo (older v0613)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4095,
      maxTokens: 4096
    },
    "openai/gpt-3.5-turbo-16k": {
      id: "openai/gpt-3.5-turbo-16k",
      name: "OpenAI: GPT-3.5 Turbo 16k",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 3,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 16385,
      maxTokens: 4096
    },
    "openai/gpt-4": {
      id: "openai/gpt-4",
      name: "OpenAI: GPT-4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 30,
        output: 60,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8191,
      maxTokens: 4096
    },
    "openai/gpt-4-turbo": {
      id: "openai/gpt-4-turbo",
      name: "OpenAI: GPT-4 Turbo",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "openai/gpt-4-turbo-preview": {
      id: "openai/gpt-4-turbo-preview",
      name: "OpenAI: GPT-4 Turbo Preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "openai/gpt-4.1": {
      id: "openai/gpt-4.1",
      name: "OpenAI: GPT-4.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-mini": {
      id: "openai/gpt-4.1-mini",
      name: "OpenAI: GPT-4.1 Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 1.5999999999999999,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-nano": {
      id: "openai/gpt-4.1-nano",
      name: "OpenAI: GPT-4.1 Nano",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4o": {
      id: "openai/gpt-4o",
      name: "OpenAI: GPT-4o",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-2024-05-13": {
      id: "openai/gpt-4o-2024-05-13",
      name: "OpenAI: GPT-4o (2024-05-13)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "openai/gpt-4o-2024-08-06": {
      id: "openai/gpt-4o-2024-08-06",
      name: "OpenAI: GPT-4o (2024-08-06)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-2024-11-20": {
      id: "openai/gpt-4o-2024-11-20",
      name: "OpenAI: GPT-4o (2024-11-20)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-mini": {
      id: "openai/gpt-4o-mini",
      name: "OpenAI: GPT-4o-mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-mini-2024-07-18": {
      id: "openai/gpt-4o-mini-2024-07-18",
      name: "OpenAI: GPT-4o-mini (2024-07-18)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-5": {
      id: "openai/gpt-5",
      name: "OpenAI: GPT-5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-mini": {
      id: "openai/gpt-5-mini",
      name: "OpenAI: GPT-5 Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-nano": {
      id: "openai/gpt-5-nano",
      name: "OpenAI: GPT-5 Nano",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.049999999999999996,
        output: 0.39999999999999997,
        cacheRead: 5e-3,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-pro": {
      id: "openai/gpt-5-pro",
      name: "OpenAI: GPT-5 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 120,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1": {
      id: "openai/gpt-5.1",
      name: "OpenAI: GPT-5.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-codex": {
      id: "openai/gpt-5.1-codex",
      name: "OpenAI: GPT-5.1-Codex",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-codex-max": {
      id: "openai/gpt-5.1-codex-max",
      name: "OpenAI: GPT-5.1-Codex-Max",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-codex-mini": {
      id: "openai/gpt-5.1-codex-mini",
      name: "OpenAI: GPT-5.1-Codex-Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2": {
      id: "openai/gpt-5.2",
      name: "OpenAI: GPT-5.2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2-chat": {
      id: "openai/gpt-5.2-chat",
      name: "OpenAI: GPT-5.2 Chat",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "openai/gpt-5.2-codex": {
      id: "openai/gpt-5.2-codex",
      name: "OpenAI: GPT-5.2-Codex",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2-pro": {
      id: "openai/gpt-5.2-pro",
      name: "OpenAI: GPT-5.2 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 21,
        output: 168,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.3-codex": {
      id: "openai/gpt-5.3-codex",
      name: "OpenAI: GPT-5.3-Codex",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4": {
      id: "openai/gpt-5.4",
      name: "OpenAI: GPT-5.4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-mini": {
      id: "openai/gpt-5.4-mini",
      name: "OpenAI: GPT-5.4 Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-nano": {
      id: "openai/gpt-5.4-nano",
      name: "OpenAI: GPT-5.4 Nano",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-pro": {
      id: "openai/gpt-5.4-pro",
      name: "OpenAI: GPT-5.4 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.5": {
      id: "openai/gpt-5.5",
      name: "OpenAI: GPT-5.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.5-pro": {
      id: "openai/gpt-5.5-pro",
      name: "OpenAI: GPT-5.5 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-luna": {
      id: "openai/gpt-5.6-luna",
      name: "OpenAI: GPT-5.6 Luna",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.6,
        cacheRead: 0.01,
        cacheWrite: 0.125
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-luna-pro": {
      id: "openai/gpt-5.6-luna-pro",
      name: "OpenAI: GPT-5.6 Luna Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.6,
        cacheRead: 0.01,
        cacheWrite: 0.125
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-sol": {
      id: "openai/gpt-5.6-sol",
      name: "OpenAI: GPT-5.6 Sol",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-sol-pro": {
      id: "openai/gpt-5.6-sol-pro",
      name: "OpenAI: GPT-5.6 Sol Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-terra": {
      id: "openai/gpt-5.6-terra",
      name: "OpenAI: GPT-5.6 Terra",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0.09999999999999999,
        cacheWrite: 1.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-terra-pro": {
      id: "openai/gpt-5.6-terra-pro",
      name: "OpenAI: GPT-5.6 Terra Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0.09999999999999999,
        cacheWrite: 1.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-audio": {
      id: "openai/gpt-audio",
      name: "OpenAI: GPT Audio",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-audio-mini": {
      id: "openai/gpt-audio-mini",
      name: "OpenAI: GPT Audio Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-chat-latest": {
      id: "openai/gpt-chat-latest",
      name: "OpenAI: GPT Chat Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-oss-120b": {
      id: "openai/gpt-oss-120b",
      name: "OpenAI: gpt-oss-120b",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.037,
        output: 0.16999999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "openai/gpt-oss-20b": {
      id: "openai/gpt-oss-20b",
      name: "OpenAI: gpt-oss-20b",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.03,
        output: 0.13,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "openai/gpt-oss-20b:free": {
      id: "openai/gpt-oss-20b:free",
      name: "OpenAI: gpt-oss-20b (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "openai/gpt-oss-safeguard-20b": {
      id: "openai/gpt-oss-safeguard-20b",
      name: "OpenAI: gpt-oss-safeguard-20b",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0.0375,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "openai/o1": {
      id: "openai/o1",
      name: "OpenAI: o1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 60,
        cacheRead: 7.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3": {
      id: "openai/o3",
      name: "OpenAI: o3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-mini": {
      id: "openai/o3-mini",
      name: "OpenAI: o3 Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-mini-high": {
      id: "openai/o3-mini-high",
      name: "OpenAI: o3 Mini High",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-pro": {
      id: "openai/o3-pro",
      name: "OpenAI: o3 Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 20,
        output: 80,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o4-mini": {
      id: "openai/o4-mini",
      name: "OpenAI: o4 Mini",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o4-mini-high": {
      id: "openai/o4-mini-high",
      name: "OpenAI: o4 Mini High",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openrouter/auto": {
      id: "openrouter/auto",
      name: "Auto Router",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 4096
    },
    "openrouter/auto-beta": {
      id: "openrouter/auto-beta",
      name: "Auto Router (Beta)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 4096
    },
    "openrouter/free": {
      id: "openrouter/free",
      name: "Free Models Router",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "poolside/laguna-s-2.1": {
      id: "poolside/laguna-s-2.1",
      name: "Poolside: Laguna S 2.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.09,
        output: 0.18,
        cacheRead: 9e-3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "poolside/laguna-s-2.1:free": {
      id: "poolside/laguna-s-2.1:free",
      name: "Poolside: Laguna S 2.1 (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "poolside/laguna-xs-2.1": {
      id: "poolside/laguna-xs-2.1",
      name: "Poolside: Laguna XS 2.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.12,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "poolside/laguna-xs-2.1:free": {
      id: "poolside/laguna-xs-2.1:free",
      name: "Poolside: Laguna XS 2.1 (free)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen-2.5-72b-instruct": {
      id: "qwen/qwen-2.5-72b-instruct",
      name: "Qwen2.5 72B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.36,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32768,
      maxTokens: 16384
    },
    "qwen/qwen-2.5-7b-instruct": {
      id: "qwen/qwen-2.5-7b-instruct",
      name: "Qwen: Qwen2.5 7B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.19999999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32768,
      maxTokens: 32768
    },
    "qwen/qwen-plus": {
      id: "qwen/qwen-plus",
      name: "Qwen: Qwen-Plus",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.26,
        output: 0.78,
        cacheRead: 0.052000000000000005,
        cacheWrite: 0.325
      },
      contextWindow: 1e6,
      maxTokens: 32768
    },
    "qwen/qwen-plus-2025-07-28": {
      id: "qwen/qwen-plus-2025-07-28",
      name: "Qwen: Qwen Plus 0728",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.26,
        output: 0.78,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 32768
    },
    "qwen/qwen-plus-2025-07-28:thinking": {
      id: "qwen/qwen-plus-2025-07-28:thinking",
      name: "Qwen: Qwen Plus 0728 (thinking)",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.39999999999999997,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0.5
      },
      contextWindow: 1e6,
      maxTokens: 32768
    },
    "qwen/qwen3-14b": {
      id: "qwen/qwen3-14b",
      name: "Qwen: Qwen3 14B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.12,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "qwen/qwen3-235b-a22b": {
      id: "qwen/qwen3-235b-a22b",
      name: "Qwen: Qwen3 235B A22B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.45499999999999996,
        output: 1.8199999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 8192
    },
    "qwen/qwen3-235b-a22b-2507": {
      id: "qwen/qwen3-235b-a22b-2507",
      name: "Qwen: Qwen3 235B A22B Instruct 2507",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.09,
        output: 0.55,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "qwen/qwen3-235b-a22b-thinking-2507": {
      id: "qwen/qwen3-235b-a22b-thinking-2507",
      name: "Qwen: Qwen3 235B A22B Thinking 2507",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.22999999999999998,
        output: 2.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "qwen/qwen3-30b-a3b": {
      id: "qwen/qwen3-30b-a3b",
      name: "Qwen: Qwen3 30B A3B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.12,
        output: 0.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "qwen/qwen3-30b-a3b-instruct-2507": {
      id: "qwen/qwen3-30b-a3b-instruct-2507",
      name: "Qwen: Qwen3 30B A3B Instruct 2507",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.04815,
        output: 0.19305,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32e3
    },
    "qwen/qwen3-30b-a3b-thinking-2507": {
      id: "qwen/qwen3-30b-a3b-thinking-2507",
      name: "Qwen: Qwen3 30B A3B Thinking 2507",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.19999999999999998,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 81920,
      maxTokens: 32768
    },
    "qwen/qwen3-32b": {
      id: "qwen/qwen3-32b",
      name: "Qwen: Qwen3 32B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.08,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "qwen/qwen3-8b": {
      id: "qwen/qwen3-8b",
      name: "Qwen: Qwen3 8B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.117,
        output: 0.45499999999999996,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 8192
    },
    "qwen/qwen3-coder": {
      id: "qwen/qwen3-coder",
      name: "Qwen: Qwen3 Coder 480B A35B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3-coder-30b-a3b-instruct": {
      id: "qwen/qwen3-coder-30b-a3b-instruct",
      name: "Qwen: Qwen3 Coder 30B A3B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3-coder-flash": {
      id: "qwen/qwen3-coder-flash",
      name: "Qwen: Qwen3 Coder Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.195,
        output: 0.975,
        cacheRead: 0.039,
        cacheWrite: 0.24375
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3-coder-next": {
      id: "qwen/qwen3-coder-next",
      name: "Qwen: Qwen3 Coder Next",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.12,
        output: 0.7999999999999999,
        cacheRead: 0.07,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3-coder-plus": {
      id: "qwen/qwen3-coder-plus",
      name: "Qwen: Qwen3 Coder Plus",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.65,
        output: 3.25,
        cacheRead: 0.13,
        cacheWrite: 0.8125
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3-max": {
      id: "qwen/qwen3-max",
      name: "Qwen: Qwen3 Max",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.78,
        output: 3.9,
        cacheRead: 0.156,
        cacheWrite: 0.975
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3-max-thinking": {
      id: "qwen/qwen3-max-thinking",
      name: "Qwen: Qwen3 Max Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.78,
        output: 3.9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3-next-80b-a3b-instruct": {
      id: "qwen/qwen3-next-80b-a3b-instruct",
      name: "Qwen: Qwen3 Next 80B A3B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.09,
        output: 1.1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "qwen/qwen3-next-80b-a3b-thinking": {
      id: "qwen/qwen3-next-80b-a3b-thinking",
      name: "Qwen: Qwen3 Next 80B A3B Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3-vl-235b-a22b-instruct": {
      id: "qwen/qwen3-vl-235b-a22b-instruct",
      name: "Qwen: Qwen3 VL 235B A22B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.21,
        output: 1.9,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-235b-a22b-thinking": {
      id: "qwen/qwen3-vl-235b-a22b-thinking",
      name: "Qwen: Qwen3 VL 235B A22B Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-30b-a3b-instruct": {
      id: "qwen/qwen3-vl-30b-a3b-instruct",
      name: "Qwen: Qwen3 VL 30B A3B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "qwen/qwen3-vl-30b-a3b-thinking": {
      id: "qwen/qwen3-vl-30b-a3b-thinking",
      name: "Qwen: Qwen3 VL 30B A3B Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-32b-instruct": {
      id: "qwen/qwen3-vl-32b-instruct",
      name: "Qwen: Qwen3 VL 32B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.10400000000000001,
        output: 0.41600000000000004,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-8b-instruct": {
      id: "qwen/qwen3-vl-8b-instruct",
      name: "Qwen: Qwen3 VL 8B Instruct",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.117,
        output: 0.45499999999999996,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-8b-thinking": {
      id: "qwen/qwen3-vl-8b-thinking",
      name: "Qwen: Qwen3 VL 8B Thinking",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.18,
        output: 2.0999999999999996,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "qwen/qwen3.5-122b-a10b": {
      id: "qwen/qwen3.5-122b-a10b",
      name: "Qwen: Qwen3.5-122B-A10B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.29,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 81920
    },
    "qwen/qwen3.5-27b": {
      id: "qwen/qwen3.5-27b",
      name: "Qwen: Qwen3.5-27B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.195,
        output: 1.56,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3.5-35b-a3b": {
      id: "qwen/qwen3.5-35b-a3b",
      name: "Qwen: Qwen3.5-35B-A3B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.5-397b-a17b": {
      id: "qwen/qwen3.5-397b-a17b",
      name: "Qwen: Qwen3.5 397B A17B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3.5999999999999996,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.5-9b": {
      id: "qwen/qwen3.5-9b",
      name: "Qwen: Qwen3.5-9B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.5-flash-02-23": {
      id: "qwen/qwen3.5-flash-02-23",
      name: "Qwen: Qwen3.5-Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.065,
        output: 0.26,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.5-plus-02-15": {
      id: "qwen/qwen3.5-plus-02-15",
      name: "Qwen: Qwen3.5 Plus 2026-02-15",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.26,
        output: 1.56,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.5-plus-20260420": {
      id: "qwen/qwen3.5-plus-20260420",
      name: "Qwen: Qwen3.5 Plus 2026-04-20",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.7999999999999998,
        cacheRead: 0,
        cacheWrite: 0.375
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.6-27b": {
      id: "qwen/qwen3.6-27b",
      name: "Qwen: Qwen3.6 27B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.5999999999999996,
        cacheRead: 0.12,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.6-35b-a3b": {
      id: "qwen/qwen3.6-35b-a3b",
      name: "Qwen: Qwen3.6 35B A3B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 1,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.6-flash": {
      id: "qwen/qwen3.6-flash",
      name: "Qwen: Qwen3.6 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1875,
        output: 1.125,
        cacheRead: 0,
        cacheWrite: 0.234375
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.6-max-preview": {
      id: "qwen/qwen3.6-max-preview",
      name: "Qwen: Qwen3.6 Max Preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.0270000000000001,
        output: 6.162,
        cacheRead: 0,
        cacheWrite: 1.28375
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3.6-plus": {
      id: "qwen/qwen3.6-plus",
      name: "Qwen: Qwen3.6 Plus",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.325,
        output: 1.95,
        cacheRead: 0,
        cacheWrite: 0.40625
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.7-flash": {
      id: "qwen/qwen3.7-flash",
      name: "Qwen: Qwen3.7 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.03,
        output: 0.13,
        cacheRead: 6e-3,
        cacheWrite: 0.038000000000000006
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.7-max": {
      id: "qwen/qwen3.7-max",
      name: "Qwen: Qwen3.7 Max",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.475,
        output: 4.425,
        cacheRead: 0.295,
        cacheWrite: 1.84375
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "qwen/qwen3.7-plus": {
      id: "qwen/qwen3.7-plus",
      name: "Qwen: Qwen3.7 Plus",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.32,
        output: 1.28,
        cacheRead: 0.064,
        cacheWrite: 0.39999999999999997
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "qwen/qwen3.8-max": {
      id: "qwen/qwen3.8-max",
      name: "Qwen: Qwen3.8 Max",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.25,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "rekaai/reka-edge": {
      id: "rekaai/reka-edge",
      name: "Reka Edge",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.09999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 16384,
      maxTokens: 16384
    },
    "relace/relace-search": {
      id: "relace/relace-search",
      name: "Relace: Relace Search",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 128e3
    },
    "sakana/fugu-ultra": {
      id: "sakana/fugu-ultra",
      name: "Sakana: Fugu Ultra",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "sakana/sakana-namazu": {
      id: "sakana/sakana-namazu",
      name: "Sakana: Sakana Namazu",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "sao10k/l3.1-euryale-70b": {
      id: "sao10k/l3.1-euryale-70b",
      name: "Sao10K: Llama 3.1 Euryale 70B v2.2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.85,
        output: 0.85,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "stepfun/step-3.5-flash": {
      id: "stepfun/step-3.5-flash",
      name: "StepFun: Step 3.5 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "stepfun/step-3.7-flash": {
      id: "stepfun/step-3.7-flash",
      name: "StepFun: Step 3.7 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 1.15,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 256e3
    },
    "tencent/hy3": {
      id: "tencent/hy3",
      name: "Tencent: Hy3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.13199999999999998,
        output: 0.5279999999999999,
        cacheRead: 0.032999999999999995,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 128e3
    },
    "tencent/hy3-preview": {
      id: "tencent/hy3-preview",
      name: "Tencent: Hy3 preview",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.063,
        output: 0.21,
        cacheRead: 0.020999999999999998,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096
    },
    "thedrummer/unslopnemo-12b": {
      id: "thedrummer/unslopnemo-12b",
      name: "TheDrummer: UnslopNemo 12B",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.39999999999999997,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1024e3,
      maxTokens: 1024e3
    },
    "thinkingmachines/inkling": {
      id: "thinkingmachines/inkling",
      name: "Thinking Machines: Inkling",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4.05,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 262144
    },
    "thinkingmachines/inkling-small": {
      id: "thinkingmachines/inkling-small",
      name: "Thinking Machines: Inkling Small",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.44999999999999996,
        output: 1.2,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 524288,
      maxTokens: 262144
    },
    "upstage/solar-pro-3": {
      id: "upstage/solar-pro-3",
      name: "Upstage: Solar Pro 3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "upstage/solar-pro4": {
      id: "upstage/solar-pro4",
      name: "Upstage: Solar Pro 4",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.03,
        output: 0.12,
        cacheRead: 6e-3,
        cacheWrite: 0
      },
      contextWindow: 524288,
      maxTokens: 131072
    },
    "x-ai/grok-4.20": {
      id: "x-ai/grok-4.20",
      name: "SpaceXAI: Grok 4.20",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 4096
    },
    "x-ai/grok-4.3": {
      id: "x-ai/grok-4.3",
      name: "SpaceXAI: Grok 4.3",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 4096
    },
    "x-ai/grok-4.5": {
      id: "x-ai/grok-4.5",
      name: "SpaceXAI: Grok 4.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 4096
    },
    "x-ai/grok-build-0.1": {
      id: "x-ai/grok-build-0.1",
      name: "SpaceXAI: Grok Build 0.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 2,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 4096
    },
    "xiaomi/mimo-v2.5": {
      id: "xiaomi/mimo-v2.5",
      name: "Xiaomi: MiMo-V2.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131072
    },
    "xiaomi/mimo-v2.5-pro": {
      id: "xiaomi/mimo-v2.5-pro",
      name: "Xiaomi: MiMo-V2.5-Pro",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131072
    },
    "z-ai/glm-4.5": {
      id: "z-ai/glm-4.5",
      name: "Z.ai: GLM 4.5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "z-ai/glm-4.5-air": {
      id: "z-ai/glm-4.5-air",
      name: "Z.ai: GLM 4.5 Air",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.13,
        output: 0.85,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "z-ai/glm-4.5v": {
      id: "z-ai/glm-4.5v",
      name: "Z.ai: GLM 4.5V",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 1.7999999999999998,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 65536,
      maxTokens: 16384
    },
    "z-ai/glm-4.6": {
      id: "z-ai/glm-4.6",
      name: "Z.ai: GLM 4.6",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 2,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-4.6v": {
      id: "z-ai/glm-4.6v",
      name: "Z.ai: GLM 4.6V",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 0.8999999999999999,
        cacheRead: 0.055,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "z-ai/glm-4.7": {
      id: "z-ai/glm-4.7",
      name: "Z.ai: GLM 4.7",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.39999999999999997,
        output: 1.75,
        cacheRead: 0.08,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-4.7-flash": {
      id: "z-ai/glm-4.7-flash",
      name: "Z.ai: GLM 4.7 Flash",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.39999999999999997,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 16384
    },
    "z-ai/glm-5": {
      id: "z-ai/glm-5",
      name: "Z.ai: GLM 5",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 1.9,
        cacheRead: 0.119,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-5-turbo": {
      id: "z-ai/glm-5-turbo",
      name: "Z.ai: GLM 5 Turbo",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 4,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 131072
    },
    "z-ai/glm-5.1": {
      id: "z-ai/glm-5.1",
      name: "Z.ai: GLM 5.1",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.952,
        output: 2.992,
        cacheRead: 0.17679999999999998,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-5.2": {
      id: "z-ai/glm-5.2",
      name: "Z.ai: GLM 5.2",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.4886,
        output: 1.5355999999999999,
        cacheRead: 0.09074,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "z-ai/glm-5v-turbo": {
      id: "z-ai/glm-5v-turbo",
      name: "Z.ai: GLM 5V Turbo",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.2,
        output: 4,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 131072
    },
    "~anthropic/claude-fable-latest": {
      id: "~anthropic/claude-fable-latest",
      name: "Anthropic: Claude Fable Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "~anthropic/claude-haiku-latest": {
      id: "~anthropic/claude-haiku-latest",
      name: "Anthropic Claude Haiku Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.09999999999999999,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "~anthropic/claude-opus-latest": {
      id: "~anthropic/claude-opus-latest",
      name: "Anthropic: Claude Opus Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "~anthropic/claude-sonnet-latest": {
      id: "~anthropic/claude-sonnet-latest",
      name: "Anthropic Claude Sonnet Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.19999999999999998,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "~deepseek/deepseek-v4-flash-latest": {
      id: "~deepseek/deepseek-v4-flash-latest",
      name: "DeepSeek V4 Flash Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      compat: { "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.072,
        output: 0.144,
        cacheRead: 0.0144,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 262144
    },
    "~google/gemini-flash-latest": {
      id: "~google/gemini-flash-latest",
      name: "Google Gemini Flash Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0.0833333333333333
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "~google/gemini-pro-latest": {
      id: "~google/gemini-pro-latest",
      name: "Google Gemini Pro Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "~moonshotai/kimi-latest": {
      id: "~moonshotai/kimi-latest",
      name: "MoonshotAI Kimi Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2.8,
        output: 14,
        cacheRead: 0.29,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "~openai/gpt-latest": {
      id: "~openai/gpt-latest",
      name: "OpenAI GPT Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "~openai/gpt-mini-latest": {
      id: "~openai/gpt-mini-latest",
      name: "OpenAI GPT Mini Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "~x-ai/grok-latest": {
      id: "~x-ai/grok-latest",
      name: "xAI: Grok Latest",
      api: "openai-completions",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 4096
    }
  },
  "prime-inference": {
    "anthropic/claude-fable-5": {
      id: "anthropic/claude-fable-5",
      name: "Claude Fable 5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "anthropic/claude-haiku-4.5": {
      id: "anthropic/claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.1,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3,
      featured: true
    },
    "anthropic/claude-opus-4.1": {
      id: "anthropic/claude-opus-4.1",
      name: "Claude Opus 4.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 32e3
    },
    "anthropic/claude-opus-4.5": {
      id: "anthropic/claude-opus-4.5",
      name: "Claude Opus 4.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-opus-4.6": {
      id: "anthropic/claude-opus-4.6",
      name: "Claude Opus 4.6",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "anthropic/claude-opus-4.7": {
      id: "anthropic/claude-opus-4.7",
      name: "Claude Opus 4.7",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "anthropic/claude-opus-4.8": {
      id: "anthropic/claude-opus-4.8",
      name: "Claude Opus 4.8",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "anthropic/claude-opus-5": {
      id: "anthropic/claude-opus-5",
      name: "Claude Opus 5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-sonnet-4": {
      id: "anthropic/claude-sonnet-4",
      name: "Claude Sonnet 4",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.30000000000000004,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-sonnet-4.5": {
      id: "anthropic/claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.30000000000000004,
        cacheWrite: 3.75
      },
      contextWindow: 2e5,
      maxTokens: 64e3,
      featured: true
    },
    "anthropic/claude-sonnet-4.6": {
      id: "anthropic/claude-sonnet-4.6",
      name: "Claude Sonnet 4.6",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.30000000000000004,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "anthropic/claude-sonnet-5": {
      id: "anthropic/claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.2,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3,
      featured: true
    },
    "deepseek/deepseek-chat": {
      id: "deepseek/deepseek-chat",
      name: "Deepseek Chat",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 16e3
    },
    "deepseek/deepseek-chat-v3-0324": {
      id: "deepseek/deepseek-chat-v3-0324",
      name: "Deepseek Chat V3 0324",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.25,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek/deepseek-chat-v3.1": {
      id: "deepseek/deepseek-chat-v3.1",
      name: "Deepseek Chat V3.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.56,
        output: 1.68,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 32768
    },
    "deepseek/deepseek-v3.1-terminus": {
      id: "deepseek/deepseek-v3.1-terminus",
      name: "Deepseek V3.1 Terminus",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.45,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 32768
    },
    "deepseek/deepseek-v3.2": {
      id: "deepseek/deepseek-v3.2",
      name: "Deepseek V3.2",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.28,
        output: 0.42,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536,
      featured: true
    },
    "deepseek/deepseek-v3.2-exp": {
      id: "deepseek/deepseek-v3.2-exp",
      name: "Deepseek V3.2 EXP",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.28,
        output: 0.42,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 65536
    },
    "deepseek/deepseek-v4-flash": {
      id: "deepseek/deepseek-v4-flash",
      name: "Deepseek V4 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false, "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 393216,
      featured: true
    },
    "deepseek/deepseek-v4-flash-0731": {
      id: "deepseek/deepseek-v4-flash-0731",
      name: "Deepseek V4 Flash 0731",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false, "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 384e3
    },
    "deepseek/deepseek-v4-pro": {
      id: "deepseek/deepseek-v4-pro",
      name: "Deepseek V4 PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false, "requiresReasoningContentOnAssistantMessages": true, "thinkingFormat": "deepseek" },
      reasoning: true,
      thinkingLevelMap: { "minimal": null, "low": null, "medium": null, "high": "high", "xhigh": "max" },
      input: ["text"],
      cost: {
        input: 2.1,
        output: 4.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 393216,
      featured: true
    },
    "google/gemini-2.5-flash": {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65535
    },
    "google/gemini-2.5-flash-lite": {
      id: "google/gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65535
    },
    "google/gemini-2.5-pro": {
      id: "google/gemini-2.5-pro",
      name: "Gemini 2.5 PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3-flash-preview": {
      id: "google/gemini-3-flash-preview",
      name: "Gemini 3 Flash Preview",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.1-pro-preview": {
      id: "google/gemini-3.1-pro-preview",
      name: "Gemini 3.1 PRO Preview",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.5-flash": {
      id: "google/gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3.6-flash": {
      id: "google/gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemma-3-27b-it": {
      id: "google/gemma-3-27b-it",
      name: "Gemma 3 27B IT",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.119,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "meta-llama/Llama-3.2-1B-Instruct": {
      id: "meta-llama/Llama-3.2-1B-Instruct",
      name: "Llama 3.2 1B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.03,
        output: 0.21,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 6e4,
      maxTokens: 6e4
    },
    "meta-llama/Llama-3.2-3B-Instruct": {
      id: "meta-llama/Llama-3.2-3B-Instruct",
      name: "Llama 3.2 3B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.34,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 8e4,
      maxTokens: 8e4
    },
    "meta-llama/llama-3.3-70b-instruct": {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.9,
        output: 0.9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "meta-llama/llama-4-maverick": {
      id: "meta-llama/llama-4-maverick",
      name: "Llama 4 Maverick",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.27,
        output: 0.88,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 8192
    },
    "minimax/minimax-m2.5": {
      id: "minimax/minimax-m2.5",
      name: "Minimax M2.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 196608
    },
    "minimax/minimax-m2.7": {
      id: "minimax/minimax-m2.7",
      name: "Minimax M2.7",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m3": {
      id: "minimax/minimax-m3",
      name: "Minimax M3",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 524288,
      maxTokens: 512e3,
      featured: true
    },
    "mistralai/mistral-large-2512": {
      id: "mistralai/mistral-large-2512",
      name: "Mistral Large 2512",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 8192
    },
    "mistralai/mistral-nemo": {
      id: "mistralai/mistral-nemo",
      name: "Mistral Nemo",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.25,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 16384
    },
    "mistralai/mistral-small-2603": {
      id: "mistralai/mistral-small-2603",
      name: "Mistral Small 2603",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.1875,
        output: 0.75,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 8192
    },
    "mistralai/mixtral-8x22b-instruct": {
      id: "mistralai/mixtral-8x22b-instruct",
      name: "Mixtral 8X22B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 65536,
      maxTokens: 8192
    },
    "moonshotai/kimi-k2-0905": {
      id: "moonshotai/kimi-k2-0905",
      name: "Kimi K2 0905",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 98304,
      maxTokens: 98304
    },
    "moonshotai/kimi-k2.5": {
      id: "moonshotai/kimi-k2.5",
      name: "Kimi K2.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65535
    },
    "moonshotai/kimi-k2.6": {
      id: "moonshotai/kimi-k2.6",
      name: "Kimi K2.6",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "moonshotai/kimi-k2.7-code": {
      id: "moonshotai/kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.0925,
        output: 4.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144,
      featured: true
    },
    "moonshotai/kimi-k3": {
      id: "moonshotai/kimi-k3",
      name: "Kimi K3",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576,
      featured: true
    },
    "nvidia/nemotron-3-nano-30b-a3b": {
      id: "nvidia/nemotron-3-nano-30b-a3b",
      name: "Nemotron 3 Nano 30B A3B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.05,
        output: 0.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 228e3,
      featured: true
    },
    "nvidia/nemotron-3-super-120b-a12b": {
      id: "nvidia/nemotron-3-super-120b-a12b",
      name: "Nemotron 3 Super 120B A12B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 0.9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 4096,
      featured: true
    },
    "openai/gpt-4.1": {
      id: "openai/gpt-4.1",
      name: "GPT 4.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-mini": {
      id: "openai/gpt-4.1-mini",
      name: "GPT 4.1 Mini",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-nano": {
      id: "openai/gpt-4.1-nano",
      name: "GPT 4.1 Nano",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.1,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4o": {
      id: "openai/gpt-4o",
      name: "GPT 4O",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-mini": {
      id: "openai/gpt-4o-mini",
      name: "GPT 4O Mini",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-5": {
      id: "openai/gpt-5",
      name: "GPT 5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-mini": {
      id: "openai/gpt-5-mini",
      name: "GPT 5 Mini",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-nano": {
      id: "openai/gpt-5-nano",
      name: "GPT 5 Nano",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.05,
        output: 0.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1": {
      id: "openai/gpt-5.1",
      name: "GPT 5.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2": {
      id: "openai/gpt-5.2",
      name: "GPT 5.2",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2-chat": {
      id: "openai/gpt-5.2-chat",
      name: "GPT 5.2 Chat",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 32e3
    },
    "openai/gpt-5.2-pro": {
      id: "openai/gpt-5.2-pro",
      name: "GPT 5.2 PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 21,
        output: 168,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.3-codex": {
      id: "openai/gpt-5.3-codex",
      name: "GPT 5.3 Codex",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3,
      featured: true
    },
    "openai/gpt-5.4": {
      id: "openai/gpt-5.4",
      name: "GPT 5.4",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3,
      featured: true
    },
    "openai/gpt-5.4-mini": {
      id: "openai/gpt-5.4-mini",
      name: "GPT 5.4 Mini",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3,
      featured: true
    },
    "openai/gpt-5.4-nano": {
      id: "openai/gpt-5.4-nano",
      name: "GPT 5.4 Nano",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.2,
        output: 1.25,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-pro": {
      id: "openai/gpt-5.4-pro",
      name: "GPT 5.4 PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3,
      featured: true
    },
    "openai/gpt-5.5": {
      id: "openai/gpt-5.5",
      name: "GPT 5.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3,
      featured: true
    },
    "openai/gpt-5.6": {
      id: "openai/gpt-5.6",
      name: "GPT 5.6",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "openai/gpt-5.6-luna": {
      id: "openai/gpt-5.6-luna",
      name: "GPT 5.6 Luna",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-luna-pro": {
      id: "openai/gpt-5.6-luna-pro",
      name: "GPT 5.6 Luna PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-sol": {
      id: "openai/gpt-5.6-sol",
      name: "GPT 5.6 SOL",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-sol-pro": {
      id: "openai/gpt-5.6-sol-pro",
      name: "GPT 5.6 SOL PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-terra": {
      id: "openai/gpt-5.6-terra",
      name: "GPT 5.6 Terra",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-terra-pro": {
      id: "openai/gpt-5.6-terra-pro",
      name: "GPT 5.6 Terra PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-oss-120b": {
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "openai/gpt-oss-20b": {
      id: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "poolside/laguna-s-2.1": {
      id: "poolside/laguna-s-2.1",
      name: "Laguna S 2.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.19,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "poolside/laguna-xs-2.1": {
      id: "poolside/laguna-xs-2.1",
      name: "Laguna XS 2.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.065,
        output: 0.13,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3-235b-a22b-2507": {
      id: "qwen/qwen3-235b-a22b-2507",
      name: "QWEN3 235B A22B 2507",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.88,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "qwen/qwen3-30b-a3b-instruct-2507": {
      id: "qwen/qwen3-30b-a3b-instruct-2507",
      name: "QWEN3 30B A3B Instruct 2507",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 0.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32e3,
      featured: true
    },
    "qwen/qwen3-8b": {
      id: "qwen/qwen3-8b",
      name: "QWEN3 8B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.117,
        output: 0.455,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 8192
    },
    "qwen/qwen3-coder": {
      id: "qwen/qwen3-coder",
      name: "QWEN3 Coder",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2,
        output: 4.875,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3-coder-next": {
      id: "qwen/qwen3-coder-next",
      name: "QWEN3 Coder Next",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144,
      featured: true
    },
    "qwen/qwen3-max": {
      id: "qwen/qwen3-max",
      name: "QWEN3 MAX",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536,
      featured: true
    },
    "qwen/qwen3-vl-235b-a22b-instruct": {
      id: "qwen/qwen3-vl-235b-a22b-instruct",
      name: "QWEN3 VL 235B A22B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 1.9,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3-vl-235b-a22b-thinking": {
      id: "qwen/qwen3-vl-235b-a22b-thinking",
      name: "QWEN3 VL 235B A22B Thinking",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768,
      featured: true
    },
    "qwen/qwen3-vl-30b-a3b-instruct": {
      id: "qwen/qwen3-vl-30b-a3b-instruct",
      name: "QWEN3 VL 30B A3B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "qwen/qwen3-vl-8b-instruct": {
      id: "qwen/qwen3-vl-8b-instruct",
      name: "QWEN3 VL 8B Instruct",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.18,
        output: 0.7,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "qwen/qwen3.5-35b-a3b": {
      id: "qwen/qwen3.5-35b-a3b",
      name: "QWEN3.5 35B A3B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3125,
        output: 1.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.5-397b-a17b": {
      id: "qwen/qwen3.5-397b-a17b",
      name: "QWEN3.5 397B A17B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "qwen/qwen3.6-27b": {
      id: "qwen/qwen3.6-27b",
      name: "QWEN3.6 27B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.6-35b-a3b": {
      id: "qwen/qwen3.6-35b-a3b",
      name: "QWEN3.6 35B A3B",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.8,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "qwen/qwen3.7-flash": {
      id: "qwen/qwen3.7-flash",
      name: "QWEN3.7 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.03,
        output: 0.13,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "qwen/qwen3.8-max": {
      id: "qwen/qwen3.8-max",
      name: "QWEN3.8 MAX",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "x-ai/grok-4.20": {
      id: "x-ai/grok-4.20",
      name: "Grok 4.20",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 3e4,
      featured: true
    },
    "x-ai/grok-4.20-multi-agent": {
      id: "x-ai/grok-4.20-multi-agent",
      name: "Grok 4.20 Multi Agent",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 3e4,
      featured: true
    },
    "xiaomi/mimo-v2.5": {
      id: "xiaomi/mimo-v2.5",
      name: "Mimo V2.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.4,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131072
    },
    "xiaomi/mimo-v2.5-pro": {
      id: "xiaomi/mimo-v2.5-pro",
      name: "Mimo V2.5 PRO",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": true, "maxTokensField": "max_tokens", "supportsStrictMode": false },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131072
    },
    "z-ai/glm-4.5": {
      id: "z-ai/glm-4.5",
      name: "GLM 4.5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "z-ai/glm-4.5-air": {
      id: "z-ai/glm-4.5-air",
      name: "GLM 4.5 AIR",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 1.1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 98304
    },
    "z-ai/glm-4.6": {
      id: "z-ai/glm-4.6",
      name: "GLM 4.6",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-4.7": {
      id: "z-ai/glm-4.7",
      name: "GLM 4.7",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.65,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "z-ai/glm-4.7-flash": {
      id: "z-ai/glm-4.7-flash",
      name: "GLM 4.7 Flash",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.1,
        output: 0.43,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 202752,
      maxTokens: 16384
    },
    "z-ai/glm-5": {
      id: "z-ai/glm-5",
      name: "GLM 5",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 3.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072,
      featured: true
    },
    "z-ai/glm-5.1": {
      id: "z-ai/glm-5.1",
      name: "GLM 5.1",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.75,
        output: 5.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072,
      featured: true
    },
    "z-ai/glm-5.2": {
      id: "z-ai/glm-5.2",
      name: "GLM 5.2",
      api: "openai-completions",
      provider: "prime-inference",
      baseUrl: "https://api.pinference.ai/api/v1",
      compat: { "supportsStore": false, "supportsDeveloperRole": false, "supportsReasoningEffort": false, "maxTokensField": "max_tokens", "supportsStrictMode": false, "thinkingFormat": "zai" },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.68,
        output: 5.28,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072,
      featured: true
    }
  },
  "vercel-ai-gateway": {
    "alibaba/qwen-3-14b": {
      id: "alibaba/qwen-3-14b",
      name: "Qwen3-14B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.12,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 40960,
      maxTokens: 16384
    },
    "alibaba/qwen-3-235b": {
      id: "alibaba/qwen-3-235b",
      name: "Qwen3 235B A22B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.88,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 16384
    },
    "alibaba/qwen-3-30b": {
      id: "alibaba/qwen-3-30b",
      name: "Qwen3-30B-A3B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.12,
        output: 0.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 40960,
      maxTokens: 16384
    },
    "alibaba/qwen-3-32b": {
      id: "alibaba/qwen-3-32b",
      name: "Qwen 3 32B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.16,
        output: 0.64,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "alibaba/qwen-3.6-max-preview": {
      id: "alibaba/qwen-3.6-max-preview",
      name: "Qwen 3.6 Max Preview",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.3,
        output: 7.8,
        cacheRead: 0.26,
        cacheWrite: 1.625
      },
      contextWindow: 24e4,
      maxTokens: 64e3
    },
    "alibaba/qwen3-235b-a22b-thinking": {
      id: "alibaba/qwen3-235b-a22b-thinking",
      name: "Qwen3 VL 235B A22B Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "alibaba/qwen3-coder": {
      id: "alibaba/qwen3-coder",
      name: "Qwen3 Coder 480B A35B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "alibaba/qwen3-coder-30b-a3b": {
      id: "alibaba/qwen3-coder-30b-a3b",
      name: "Qwen 3 Coder 30B A3B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 8192
    },
    "alibaba/qwen3-coder-next": {
      id: "alibaba/qwen3-coder-next",
      name: "Qwen3 Coder Next",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "alibaba/qwen3-coder-plus": {
      id: "alibaba/qwen3-coder-plus",
      name: "Qwen3 Coder Plus",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "alibaba/qwen3-max": {
      id: "alibaba/qwen3-max",
      name: "Qwen3 Max",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 6,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "alibaba/qwen3-max-preview": {
      id: "alibaba/qwen3-max-preview",
      name: "Qwen3 Max Preview",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 6,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "alibaba/qwen3-max-thinking": {
      id: "alibaba/qwen3-max-thinking",
      name: "Qwen 3 Max Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 6,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 65536
    },
    "alibaba/qwen3-next-80b-a3b-instruct": {
      id: "alibaba/qwen3-next-80b-a3b-instruct",
      name: "Qwen3 Next 80B A3B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "alibaba/qwen3-next-80b-a3b-thinking": {
      id: "alibaba/qwen3-next-80b-a3b-thinking",
      name: "Qwen3 Next 80B A3B Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 1.2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "alibaba/qwen3-vl-235b-a22b-instruct": {
      id: "alibaba/qwen3-vl-235b-a22b-instruct",
      name: "Qwen3 VL 235B A22B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 1.5999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 129024
    },
    "alibaba/qwen3-vl-instruct": {
      id: "alibaba/qwen3-vl-instruct",
      name: "Qwen3 VL 235B A22B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 1.5999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 129024
    },
    "alibaba/qwen3-vl-thinking": {
      id: "alibaba/qwen3-vl-thinking",
      name: "Qwen3 VL 235B A22B Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 32768
    },
    "alibaba/qwen3.5-flash": {
      id: "alibaba/qwen3.5-flash",
      name: "Qwen 3.5 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 1e-3,
        cacheWrite: 0.125
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "alibaba/qwen3.5-plus": {
      id: "alibaba/qwen3.5-plus",
      name: "Qwen 3.5 Plus",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 2.4,
        cacheRead: 0.04,
        cacheWrite: 0.5
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "alibaba/qwen3.6-27b": {
      id: "alibaba/qwen3.6-27b",
      name: "Qwen 3.6 27B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3.5999999999999996,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "alibaba/qwen3.6-plus": {
      id: "alibaba/qwen3.6-plus",
      name: "Qwen 3.6 Plus",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0.625
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "alibaba/qwen3.7-flash": {
      id: "alibaba/qwen3.7-flash",
      name: "Qwen 3.7 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.03,
        output: 0.13,
        cacheRead: 6e-3,
        cacheWrite: 0.038000000000000006
      },
      contextWindow: 991e3,
      maxTokens: 64e3
    },
    "alibaba/qwen3.7-max": {
      id: "alibaba/qwen3.7-max",
      name: "Qwen 3.7 Max",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 7.5,
        cacheRead: 0.5,
        cacheWrite: 3.125
      },
      contextWindow: 991e3,
      maxTokens: 64e3
    },
    "alibaba/qwen3.7-plus": {
      id: "alibaba/qwen3.7-plus",
      name: "Qwen 3.7 Plus",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 1.5999999999999999,
        cacheRead: 0.08,
        cacheWrite: 0.5
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "alibaba/qwen3.8-max": {
      id: "alibaba/qwen3.8-max",
      name: "Qwen 3.8 Max",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.25,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "amazon/nova-2-lite": {
      id: "amazon/nova-2-lite",
      name: "Nova 2 Lite",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "amazon/nova-lite": {
      id: "amazon/nova-lite",
      name: "Nova Lite",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.06,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 8192
    },
    "amazon/nova-micro": {
      id: "amazon/nova-micro",
      name: "Nova Micro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.035,
        output: 0.14,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "amazon/nova-pro": {
      id: "amazon/nova-pro",
      name: "Nova Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.7999999999999999,
        output: 3.1999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 3e5,
      maxTokens: 8192
    },
    "anthropic/claude-3-haiku": {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.25,
        cacheRead: 0.03,
        cacheWrite: 0.3
      },
      contextWindow: 2e5,
      maxTokens: 4096
    },
    "anthropic/claude-fable-5": {
      id: "anthropic/claude-fable-5",
      name: "Claude Fable 5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "off": null, "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-haiku-4.5": {
      id: "anthropic/claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 5,
        cacheRead: 0.09999999999999999,
        cacheWrite: 1.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-opus-4": {
      id: "anthropic/claude-opus-4",
      name: "Claude Opus 4",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 75,
        cacheRead: 1.5,
        cacheWrite: 18.75
      },
      contextWindow: 2e5,
      maxTokens: 8192
    },
    "anthropic/claude-opus-4.5": {
      id: "anthropic/claude-opus-4.5",
      name: "Claude Opus 4.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 2e5,
      maxTokens: 64e3
    },
    "anthropic/claude-opus-4.6": {
      id: "anthropic/claude-opus-4.6",
      name: "Claude Opus 4.6",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.7": {
      id: "anthropic/claude-opus-4.7",
      name: "Claude Opus 4.7",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.8": {
      id: "anthropic/claude-opus-4.8",
      name: "Claude Opus 4.8",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-4.8-fast": {
      id: "anthropic/claude-opus-4.8-fast",
      name: "Claude Opus 4.8 (Fast)",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-5": {
      id: "anthropic/claude-opus-5",
      name: "Claude Opus 5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-opus-5-fast": {
      id: "anthropic/claude-opus-5-fast",
      name: "Claude Opus 5 (Fast)",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 50,
        cacheRead: 1,
        cacheWrite: 12.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-sonnet-4": {
      id: "anthropic/claude-sonnet-4",
      name: "Claude Sonnet 4",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 8192
    },
    "anthropic/claude-sonnet-4.5": {
      id: "anthropic/claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "anthropic/claude-sonnet-4.6": {
      id: "anthropic/claude-sonnet-4.6",
      name: "Claude Sonnet 4.6",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "anthropic/claude-sonnet-5": {
      id: "anthropic/claude-sonnet-5",
      name: "Claude Sonnet 5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 10,
        cacheRead: 0.19999999999999998,
        cacheWrite: 2.5
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "arcee-ai/trinity-large-thinking": {
      id: "arcee-ai/trinity-large-thinking",
      name: "Trinity Large Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.8999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262100,
      maxTokens: 8e4
    },
    "arcee-ai/trinity-mini": {
      id: "arcee-ai/trinity-mini",
      name: "Trinity Mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.045,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "bytedance/seed-1.6": {
      id: "bytedance/seed-1.6",
      name: "Seed 1.6",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "bytedance/seed-1.8": {
      id: "bytedance/seed-1.8",
      name: "Bytedance Seed 1.8",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 64e3
    },
    "cohere/command-a": {
      id: "cohere/command-a",
      name: "Command A",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8e3
    },
    "deepseek/deepseek-r1": {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek-R1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.35,
        output: 5.4,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "deepseek/deepseek-v3": {
      id: "deepseek/deepseek-v3",
      name: "DeepSeek V3 0324",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 1.12,
        cacheRead: 0.135,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 163840
    },
    "deepseek/deepseek-v3.1": {
      id: "deepseek/deepseek-v3.1",
      name: "DeepSeek V3.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.95,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 163840,
      maxTokens: 128e3
    },
    "deepseek/deepseek-v3.1-terminus": {
      id: "deepseek/deepseek-v3.1-terminus",
      name: "DeepSeek V3.1 Terminus",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.27,
        output: 1,
        cacheRead: 0.135,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "deepseek/deepseek-v3.2": {
      id: "deepseek/deepseek-v3.2",
      name: "DeepSeek V3.2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.28,
        output: 0.42,
        cacheRead: 0.028,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8e3
    },
    "deepseek/deepseek-v3.2-thinking": {
      id: "deepseek/deepseek-v3.2-thinking",
      name: "DeepSeek V3.2 Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.62,
        output: 1.85,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8e3
    },
    "deepseek/deepseek-v4-flash": {
      id: "deepseek/deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.19999999999999998,
        output: 0.39999999999999997,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "deepseek/deepseek-v4-flash-0731": {
      id: "deepseek/deepseek-v4-flash-0731",
      name: "DeepSeek V4 Flash 0731",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.19999999999999998,
        output: 0.39999999999999997,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 384e3
    },
    "deepseek/deepseek-v4-pro": {
      id: "deepseek/deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.74,
        output: 3.48,
        cacheRead: 0.14,
        cacheWrite: 0
      },
      contextWindow: 1048600,
      maxTokens: 1048600
    },
    "google/gemini-2.5-flash": {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65536
    },
    "google/gemini-2.5-flash-lite": {
      id: "google/gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-2.5-pro": {
      id: "google/gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 65536
    },
    "google/gemini-3-flash": {
      id: "google/gemini-3-flash",
      name: "Gemini 3 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65e3
    },
    "google/gemini-3.1-flash-lite": {
      id: "google/gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65e3
    },
    "google/gemini-3.1-pro-preview": {
      id: "google/gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "google/gemini-3.5-flash": {
      id: "google/gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 9,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "google/gemini-3.5-flash-lite": {
      id: "google/gemini-3.5-flash-lite",
      name: "Gemini 3.5 Flash Lite",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65e3
    },
    "google/gemini-3.6-flash": {
      id: "google/gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 64e3
    },
    "google/gemma-4-26b-a4b-it": {
      id: "google/gemma-4-26b-a4b-it",
      name: "Google Gemma 4 26B A4B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.015,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "google/gemma-4-31b-it": {
      id: "google/gemma-4-31b-it",
      name: "Gemma 4 31B IT",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 131072
    },
    "inception/mercury-2": {
      id: "inception/mercury-2",
      name: "Mercury 2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 0.75,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "inception/mercury-coder-small": {
      id: "inception/mercury-coder-small",
      name: "Mercury Coder Small Beta",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.25,
        output: 1,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 16384
    },
    "inclusionai/ling-3.0-flash": {
      id: "inclusionai/ling-3.0-flash",
      name: "Ling 3.0 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.18,
        cacheRead: 0.012,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "inclusionai/ling-3.0-tiny-free": {
      id: "inclusionai/ling-3.0-tiny-free",
      name: "Ling 3.0 Tiny (Free)",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "interfaze/interfaze-beta": {
      id: "interfaze/interfaze-beta",
      name: "Interfaze Beta",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 3.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 32e3
    },
    "kwaipilot/kat-coder-air-v2.5": {
      id: "kwaipilot/kat-coder-air-v2.5",
      name: "Kat Coder Air V2.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8e4
    },
    "kwaipilot/kat-coder-pro-v1": {
      id: "kwaipilot/kat-coder-pro-v1",
      name: "KAT-Coder-Pro V1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "kwaipilot/kat-coder-pro-v2": {
      id: "kwaipilot/kat-coder-pro-v2",
      name: "Kat Coder Pro V2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "kwaipilot/kat-coder-pro-v2.5": {
      id: "kwaipilot/kat-coder-pro-v2.5",
      name: "Kat Coder Pro V2.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.74,
        output: 2.96,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 8e4
    },
    "meta/llama-3.1-70b": {
      id: "meta/llama-3.1-70b",
      name: "Llama 3.1 70B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.72,
        output: 0.72,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "meta/llama-3.1-8b": {
      id: "meta/llama-3.1-8b",
      name: "Llama 3.1 8B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.22,
        output: 0.22,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "meta/llama-3.3-70b": {
      id: "meta/llama-3.3-70b",
      name: "Llama 3.3 70B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.72,
        output: 0.72,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "meta/llama-4-maverick": {
      id: "meta/llama-4-maverick",
      name: "Llama 4 Maverick 17B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.24,
        output: 0.9700000000000001,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "meta/llama-4-scout": {
      id: "meta/llama-4-scout",
      name: "Llama 4 Scout 17B Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.16999999999999998,
        output: 0.66,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 8192
    },
    "meta/muse-glimmer-30b": {
      id: "meta/muse-glimmer-30b",
      name: "Muse Glimmer 30B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.35,
        output: 1.5,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "meta/muse-spark-1.1": {
      id: "meta/muse-spark-1.1",
      name: "Muse Spark 1.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 4.25,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "meta/muse-spark-1.2": {
      id: "meta/muse-spark-1.2",
      name: "Muse Spark 1.2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 4.25,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "meta/muse-spark-1.2-contributor": {
      id: "meta/muse-spark-1.2-contributor",
      name: "Muse Spark 1.2 Contributor",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.19999999999999998,
        cacheRead: 2e-3,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 1048576
    },
    "minimax/minimax-m2": {
      id: "minimax/minimax-m2",
      name: "MiniMax M2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.03,
        cacheWrite: 0.375
      },
      contextWindow: 205e3,
      maxTokens: 205e3
    },
    "minimax/minimax-m2.1": {
      id: "minimax/minimax-m2.1",
      name: "MiniMax M2.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.03,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m2.1-lightning": {
      id: "minimax/minimax-m2.1-lightning",
      name: "MiniMax M2.1 Lightning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 2.4,
        cacheRead: 0.03,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "minimax/minimax-m2.5": {
      id: "minimax/minimax-m2.5",
      name: "MiniMax M2.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.03,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131e3
    },
    "minimax/minimax-m2.5-highspeed": {
      id: "minimax/minimax-m2.5-highspeed",
      name: "MiniMax M2.5 High Speed",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0.03,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131e3
    },
    "minimax/minimax-m2.7": {
      id: "minimax/minimax-m2.7",
      name: "Minimax M2.7",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131e3
    },
    "minimax/minimax-m2.7-highspeed": {
      id: "minimax/minimax-m2.7-highspeed",
      name: "MiniMax M2.7 High Speed",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0.06,
        cacheWrite: 0.375
      },
      contextWindow: 204800,
      maxTokens: 131100
    },
    "minimax/minimax-m3": {
      id: "minimax/minimax-m3",
      name: "MiniMax M3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 1.2,
        cacheRead: 0.06,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "mistral/codestral": {
      id: "mistral/codestral",
      name: "Mistral Codestral",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.3,
        output: 0.8999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "mistral/devstral-2": {
      id: "mistral/devstral-2",
      name: "Devstral 2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.39999999999999997,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral/devstral-small-2": {
      id: "mistral/devstral-small-2",
      name: "Devstral Small 2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral/magistral-medium": {
      id: "mistral/magistral-medium",
      name: "Magistral Medium 2509",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 64e3
    },
    "mistral/magistral-small": {
      id: "mistral/magistral-small",
      name: "Magistral Small 2509",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 64e3
    },
    "mistral/ministral-14b": {
      id: "mistral/ministral-14b",
      name: "Ministral 14B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.19999999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral/ministral-3b": {
      id: "mistral/ministral-3b",
      name: "Ministral 3B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.09999999999999999,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "mistral/ministral-8b": {
      id: "mistral/ministral-8b",
      name: "Ministral 8B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "mistral/mistral-large-3": {
      id: "mistral/mistral-large-3",
      name: "Mistral Large 3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral/mistral-medium": {
      id: "mistral/mistral-medium",
      name: "Mistral Medium 3.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 64e3
    },
    "mistral/mistral-medium-3.5": {
      id: "mistral/mistral-medium-3.5",
      name: "Mistral Medium Latest",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.5,
        output: 7.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "mistral/mistral-nemo": {
      id: "mistral/mistral-nemo",
      name: "Mistral Nemo 12B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 128e3
    },
    "mistral/mistral-small": {
      id: "mistral/mistral-small",
      name: "Mistral Small",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 32e3,
      maxTokens: 4e3
    },
    "mistral/pixtral-12b": {
      id: "mistral/pixtral-12b",
      name: "Pixtral 12B 2409",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.15,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4e3
    },
    "moonshotai/kimi-k2": {
      id: "moonshotai/kimi-k2",
      name: "Kimi K2 Instruct",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5700000000000001,
        output: 2.3,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "moonshotai/kimi-k2-thinking": {
      id: "moonshotai/kimi-k2-thinking",
      name: "Kimi K2 Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.47,
        output: 2,
        cacheRead: 0.14100000000000001,
        cacheWrite: 0
      },
      contextWindow: 216144,
      maxTokens: 216144
    },
    "moonshotai/kimi-k2.5": {
      id: "moonshotai/kimi-k2.5",
      name: "Kimi K2.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 3,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 262114,
      maxTokens: 262114
    },
    "moonshotai/kimi-k2.6": {
      id: "moonshotai/kimi-k2.6",
      name: "Kimi K2.6",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.16,
        cacheWrite: 0
      },
      contextWindow: 262e3,
      maxTokens: 262e3
    },
    "moonshotai/kimi-k2.7-code": {
      id: "moonshotai/kimi-k2.7-code",
      name: "Kimi K2.7 Code",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.19,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32768
    },
    "moonshotai/kimi-k2.7-code-highspeed": {
      id: "moonshotai/kimi-k2.7-code-highspeed",
      name: "Kimi K2.7 Code High Speed",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.9,
        output: 8,
        cacheRead: 0.38,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 32768
    },
    "moonshotai/kimi-k3": {
      id: "moonshotai/kimi-k3",
      name: "Kimi K3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 3,
        output: 15,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "moonshotai/kimi-k3-fast": {
      id: "moonshotai/kimi-k3-fast",
      name: "Kimi K3 Fast",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "off": null, "minimal": null, "low": null, "medium": null, "high": null, "xhigh": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 4.5,
        output: 22.5,
        cacheRead: 0.44999999999999996,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "nvidia/nemotron-3-nano-30b-a3b": {
      id: "nvidia/nemotron-3-nano-30b-a3b",
      name: "Nemotron 3 Nano 30B A3B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.049999999999999996,
        output: 0.24,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "nvidia/nemotron-3-super-120b-a12b": {
      id: "nvidia/nemotron-3-super-120b-a12b",
      name: "NVIDIA Nemotron 3 Super 120B A12B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.15,
        output: 0.65,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32e3
    },
    "nvidia/nemotron-3-ultra-550b-a55b": {
      id: "nvidia/nemotron-3-ultra-550b-a55b",
      name: "Nemotron 3 Ultra",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.4,
        cacheRead: 0.12,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 65e3
    },
    "nvidia/nemotron-nano-12b-v2-vl": {
      id: "nvidia/nemotron-nano-12b-v2-vl",
      name: "Nvidia Nemotron Nano 12B V2 VL",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.6,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "nvidia/nemotron-nano-9b-v2": {
      id: "nvidia/nemotron-nano-9b-v2",
      name: "Nvidia Nemotron Nano 9B V2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.22999999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "openai/gpt-3.5-turbo": {
      id: "openai/gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.5,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 16385,
      maxTokens: 4096
    },
    "openai/gpt-4-turbo": {
      id: "openai/gpt-4-turbo",
      name: "GPT-4 Turbo",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 30,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 4096
    },
    "openai/gpt-4.1": {
      id: "openai/gpt-4.1",
      name: "GPT-4.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-mini": {
      id: "openai/gpt-4.1-mini",
      name: "GPT-4.1 mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.39999999999999997,
        output: 1.5999999999999999,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4.1-nano": {
      id: "openai/gpt-4.1-nano",
      name: "GPT-4.1 nano",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.09999999999999999,
        output: 0.39999999999999997,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1047576,
      maxTokens: 32768
    },
    "openai/gpt-4o": {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-4o-mini": {
      id: "openai/gpt-4o-mini",
      name: "GPT-4o mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.15,
        output: 0.6,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 16384
    },
    "openai/gpt-5": {
      id: "openai/gpt-5",
      name: "GPT-5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-codex": {
      id: "openai/gpt-5-codex",
      name: "GPT-5-Codex",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-mini": {
      id: "openai/gpt-5-mini",
      name: "GPT-5 mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.024999999999999998,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-nano": {
      id: "openai/gpt-5-nano",
      name: "GPT-5 nano",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.049999999999999996,
        output: 0.39999999999999997,
        cacheRead: 5e-3,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5-pro": {
      id: "openai/gpt-5-pro",
      name: "GPT-5 pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 120,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 272e3
    },
    "openai/gpt-5.1-codex": {
      id: "openai/gpt-5.1-codex",
      name: "GPT-5.1-Codex",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.13,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-codex-max": {
      id: "openai/gpt-5.1-codex-max",
      name: "GPT 5.1 Codex Max",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-codex-mini": {
      id: "openai/gpt-5.1-codex-mini",
      name: "GPT 5.1 Codex Mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.25,
        output: 2,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.1-thinking": {
      id: "openai/gpt-5.1-thinking",
      name: "GPT 5.1 Thinking",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 10,
        cacheRead: 0.125,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2": {
      id: "openai/gpt-5.2",
      name: "GPT 5.2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2-codex": {
      id: "openai/gpt-5.2-codex",
      name: "GPT 5.2 Codex",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.2-pro": {
      id: "openai/gpt-5.2-pro",
      name: "GPT 5.2 ",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 21,
        output: 168,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.3-codex": {
      id: "openai/gpt-5.3-codex",
      name: "GPT 5.3 Codex",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 1.75,
        output: 14,
        cacheRead: 0.175,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4": {
      id: "openai/gpt-5.4",
      name: "GPT 5.4",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 2.5,
        output: 15,
        cacheRead: 0.25,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-mini": {
      id: "openai/gpt-5.4-mini",
      name: "GPT 5.4 Mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.75,
        output: 4.5,
        cacheRead: 0.075,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-nano": {
      id: "openai/gpt-5.4-nano",
      name: "GPT 5.4 Nano",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 1.25,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 4e5,
      maxTokens: 128e3
    },
    "openai/gpt-5.4-pro": {
      id: "openai/gpt-5.4-pro",
      name: "GPT 5.4 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.5": {
      id: "openai/gpt-5.5",
      name: "GPT 5.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "openai/gpt-5.5-pro": {
      id: "openai/gpt-5.5-pro",
      name: "GPT 5.5 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh" },
      input: ["text", "image"],
      cost: {
        input: 30,
        output: 180,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-luna": {
      id: "openai/gpt-5.6-luna",
      name: "GPT 5.6 Luna",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 1.2,
        cacheRead: 0.02,
        cacheWrite: 0.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-sol": {
      id: "openai/gpt-5.6-sol",
      name: "GPT 5.6 Sol",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 6.25
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-5.6-terra": {
      id: "openai/gpt-5.6-terra",
      name: "GPT 5.6 Terra",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      thinkingLevelMap: { "xhigh": "xhigh", "minimal": null, "max": "max" },
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 2.5
      },
      contextWindow: 105e4,
      maxTokens: 128e3
    },
    "openai/gpt-oss-120b": {
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.5,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 131072
    },
    "openai/gpt-oss-20b": {
      id: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.049999999999999996,
        output: 0.19999999999999998,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 8192
    },
    "openai/gpt-oss-safeguard-20b": {
      id: "openai/gpt-oss-safeguard-20b",
      name: "GPT OSS Safeguard 20B",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.075,
        output: 0.3,
        cacheRead: 0.037,
        cacheWrite: 0
      },
      contextWindow: 131072,
      maxTokens: 65536
    },
    "openai/o1": {
      id: "openai/o1",
      name: "o1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 15,
        output: 60,
        cacheRead: 7.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3": {
      id: "openai/o3",
      name: "o3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 8,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-deep-research": {
      id: "openai/o3-deep-research",
      name: "o3-deep-research",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 10,
        output: 40,
        cacheRead: 2.5,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-mini": {
      id: "openai/o3-mini",
      name: "o3-mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.55,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o3-pro": {
      id: "openai/o3-pro",
      name: "o3 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 20,
        output: 80,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "openai/o4-mini": {
      id: "openai/o4-mini",
      name: "o4-mini",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.1,
        output: 4.4,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 1e5
    },
    "poolside/laguna-s-2.1": {
      id: "poolside/laguna-s-2.1",
      name: "Laguna S 2.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.09999999999999999,
        output: 0.19999999999999998,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "poolside/laguna-s-2.1-free": {
      id: "poolside/laguna-s-2.1-free",
      name: "Laguna S 2.1 Free",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 32768
    },
    "sakana/fugu-ultra": {
      id: "sakana/fugu-ultra",
      name: "Fugu Ultra",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 5,
        output: 30,
        cacheRead: 0.5,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "sakana/namazu": {
      id: "sakana/namazu",
      name: "Sakana Namazu",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.95,
        output: 4,
        cacheRead: 0.15,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "stepfun/step-3.5-flash": {
      id: "stepfun/step-3.5-flash",
      name: "StepFun 3.5 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.09,
        output: 0.3,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 262114,
      maxTokens: 262114
    },
    "stepfun/step-3.7-flash": {
      id: "stepfun/step-3.7-flash",
      name: "Step 3.7 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 1.15,
        cacheRead: 0.04,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "tencent/hy3": {
      id: "tencent/hy3",
      name: "Hy3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.58,
        cacheRead: 0.035,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 262144
    },
    "thinkingmachines/inkling": {
      id: "thinkingmachines/inkling",
      name: "Inkling",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 4.05,
        cacheRead: 0.16999999999999998,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "thinkingmachines/inkling-small": {
      id: "thinkingmachines/inkling-small",
      name: "Inkling Small",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.5,
        output: 1.2,
        cacheRead: 0.09999999999999999,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "xai/grok-4.1-fast-non-reasoning": {
      id: "xai/grok-4.1-fast-non-reasoning",
      name: "Grok 4.1 Fast Non-Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.5,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "xai/grok-4.1-fast-reasoning": {
      id: "xai/grok-4.1-fast-reasoning",
      name: "Grok 4.1 Fast Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.19999999999999998,
        output: 0.5,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "xai/grok-4.20-multi-agent": {
      id: "xai/grok-4.20-multi-agent",
      name: "Grok 4.20 Multi-Agent",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.20-multi-agent-beta": {
      id: "xai/grok-4.20-multi-agent-beta",
      name: "Grok 4.20 Multi Agent Beta",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.20-non-reasoning": {
      id: "xai/grok-4.20-non-reasoning",
      name: "Grok 4.20 Non-Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.20-non-reasoning-beta": {
      id: "xai/grok-4.20-non-reasoning-beta",
      name: "Grok 4.20 Beta Non-Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.20-reasoning": {
      id: "xai/grok-4.20-reasoning",
      name: "Grok 4.20 Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.20-reasoning-beta": {
      id: "xai/grok-4.20-reasoning-beta",
      name: "Grok 4.20 Beta Reasoning",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 2e6,
      maxTokens: 2e6
    },
    "xai/grok-4.3": {
      id: "xai/grok-4.3",
      name: "Grok 4.3",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 1e6
    },
    "xai/grok-4.5": {
      id: "xai/grok-4.5",
      name: "Grok 4.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 5e5
    },
    "xai/grok-build-0.1": {
      id: "xai/grok-build-0.1",
      name: "Grok Build 0.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 2,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "xiaomi/mimo-v2.5": {
      id: "xiaomi/mimo-v2.5",
      name: "MiMo M2.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131100
    },
    "xiaomi/mimo-v2.5-pro": {
      id: "xiaomi/mimo-v2.5-pro",
      name: "MiMo V2.5 Pro",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 105e4,
      maxTokens: 131e3
    },
    "zai/glm-4.5": {
      id: "zai/glm-4.5",
      name: "GLM 4.5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 96e3
    },
    "zai/glm-4.5-air": {
      id: "zai/glm-4.5-air",
      name: "GLM 4.5 Air",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.19999999999999998,
        output: 1.1,
        cacheRead: 0.03,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 96e3
    },
    "zai/glm-4.5v": {
      id: "zai/glm-4.5v",
      name: "GLM 4.5V",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.6,
        output: 1.7999999999999998,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 66e3,
      maxTokens: 16e3
    },
    "zai/glm-4.6": {
      id: "zai/glm-4.6",
      name: "GLM 4.6",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0.11,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 96e3
    },
    "zai/glm-4.6v": {
      id: "zai/glm-4.6v",
      name: "GLM-4.6V",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.3,
        output: 0.8999999999999999,
        cacheRead: 0.049999999999999996,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 24e3
    },
    "zai/glm-4.6v-flash": {
      id: "zai/glm-4.6v-flash",
      name: "GLM-4.6V-Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128e3,
      maxTokens: 24e3
    },
    "zai/glm-4.7": {
      id: "zai/glm-4.7",
      name: "GLM 4.7",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.6,
        output: 2.2,
        cacheRead: 0.12,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 12e4
    },
    "zai/glm-4.7-flash": {
      id: "zai/glm-4.7-flash",
      name: "GLM 4.7 Flash",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.07,
        output: 0.39999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 131e3
    },
    "zai/glm-4.7-flashx": {
      id: "zai/glm-4.7-flashx",
      name: "GLM 4.7 FlashX",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.06,
        output: 0.39999999999999997,
        cacheRead: 0.01,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 128e3
    },
    "zai/glm-5": {
      id: "zai/glm-5",
      name: "GLM 5",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1,
        output: 3.1999999999999997,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 202800,
      maxTokens: 131100
    },
    "zai/glm-5-turbo": {
      id: "zai/glm-5-turbo",
      name: "GLM 5 Turbo",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.2,
        output: 4,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 202800,
      maxTokens: 131100
    },
    "zai/glm-5.1": {
      id: "zai/glm-5.1",
      name: "GLM 5.1",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.4,
        output: 4.4,
        cacheRead: 0.26,
        cacheWrite: 0
      },
      contextWindow: 202800,
      maxTokens: 64e3
    },
    "zai/glm-5.2": {
      id: "zai/glm-5.2",
      name: "GLM 5.2",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.1,
        output: 3.851,
        cacheRead: 0.275,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "zai/glm-5.2-fast": {
      id: "zai/glm-5.2-fast",
      name: "GLM 5.2 Fast",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 2.0999999999999996,
        output: 6.6000000000000005,
        cacheRead: 0.21,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 128e3
    },
    "zai/glm-5v-turbo": {
      id: "zai/glm-5v-turbo",
      name: "GLM 5V Turbo",
      api: "anthropic-messages",
      provider: "vercel-ai-gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.2,
        output: 4,
        cacheRead: 0.24,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 128e3
    }
  },
  "xai": {
    "grok-4.20-0309-non-reasoning": {
      id: "grok-4.20-0309-non-reasoning",
      name: "Grok 4.20 (Non-Reasoning)",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: false,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 3e4
    },
    "grok-4.20-0309-reasoning": {
      id: "grok-4.20-0309-reasoning",
      name: "Grok 4.20 (Reasoning)",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 3e4
    },
    "grok-4.3": {
      id: "grok-4.3",
      name: "Grok 4.3",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1.25,
        output: 2.5,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 3e4
    },
    "grok-4.5": {
      id: "grok-4.5",
      name: "Grok 4.5",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.3,
        cacheWrite: 0
      },
      contextWindow: 5e5,
      maxTokens: 5e5
    },
    "grok-build-0.1": {
      id: "grok-build-0.1",
      name: "Grok Build 0.1",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 1,
        output: 2,
        cacheRead: 0.2,
        cacheWrite: 0
      },
      contextWindow: 256e3,
      maxTokens: 256e3
    },
    "grok-code-fast-1": {
      id: "grok-code-fast-1",
      name: "Grok Code Fast 1",
      api: "openai-completions",
      provider: "xai",
      baseUrl: "https://api.x.ai/v1",
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0.2,
        output: 1.5,
        cacheRead: 0.02,
        cacheWrite: 0
      },
      contextWindow: 32768,
      maxTokens: 8192
    }
  },
  "xiaomi": {
    "mimo-v2-flash": {
      id: "mimo-v2-flash",
      name: "MiMo-V2-Flash",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "mimo-v2-omni": {
      id: "mimo-v2-omni",
      name: "MiMo-V2-Omni",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "mimo-v2-pro": {
      id: "mimo-v2-pro",
      name: "MiMo-V2-Pro",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5": {
      id: "mimo-v2.5",
      name: "MiMo-V2.5",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro": {
      id: "mimo-v2.5-pro",
      name: "MiMo-V2.5-Pro",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro-ultraspeed": {
      id: "mimo-v2.5-pro-ultraspeed",
      name: "MiMo-V2.5-Pro-UltraSpeed",
      api: "anthropic-messages",
      provider: "xiaomi",
      baseUrl: "https://api.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.305,
        output: 2.61,
        cacheRead: 0.0108,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "xiaomi-token-plan-ams": {
    "mimo-v2-flash": {
      id: "mimo-v2-flash",
      name: "MiMo-V2-Flash",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "mimo-v2-omni": {
      id: "mimo-v2-omni",
      name: "MiMo-V2-Omni",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "mimo-v2-pro": {
      id: "mimo-v2-pro",
      name: "MiMo-V2-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5": {
      id: "mimo-v2.5",
      name: "MiMo-V2.5",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro": {
      id: "mimo-v2.5-pro",
      name: "MiMo-V2.5-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro-ultraspeed": {
      id: "mimo-v2.5-pro-ultraspeed",
      name: "MiMo-V2.5-Pro-UltraSpeed",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-ams",
      baseUrl: "https://token-plan-ams.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.305,
        output: 2.61,
        cacheRead: 0.0108,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "xiaomi-token-plan-cn": {
    "mimo-v2-flash": {
      id: "mimo-v2-flash",
      name: "MiMo-V2-Flash",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "mimo-v2-omni": {
      id: "mimo-v2-omni",
      name: "MiMo-V2-Omni",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "mimo-v2-pro": {
      id: "mimo-v2-pro",
      name: "MiMo-V2-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5": {
      id: "mimo-v2.5",
      name: "MiMo-V2.5",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro": {
      id: "mimo-v2.5-pro",
      name: "MiMo-V2.5-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro-ultraspeed": {
      id: "mimo-v2.5-pro-ultraspeed",
      name: "MiMo-V2.5-Pro-UltraSpeed",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-cn",
      baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.305,
        output: 2.61,
        cacheRead: 0.0108,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "xiaomi-token-plan-sgp": {
    "mimo-v2-flash": {
      id: "mimo-v2-flash",
      name: "MiMo-V2-Flash",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 65536
    },
    "mimo-v2-omni": {
      id: "mimo-v2-omni",
      name: "MiMo-V2-Omni",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 262144,
      maxTokens: 131072
    },
    "mimo-v2-pro": {
      id: "mimo-v2-pro",
      name: "MiMo-V2-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5": {
      id: "mimo-v2.5",
      name: "MiMo-V2.5",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text", "image"],
      cost: {
        input: 0.14,
        output: 0.28,
        cacheRead: 28e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro": {
      id: "mimo-v2.5-pro",
      name: "MiMo-V2.5-Pro",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0.435,
        output: 0.87,
        cacheRead: 36e-4,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    "mimo-v2.5-pro-ultraspeed": {
      id: "mimo-v2.5-pro-ultraspeed",
      name: "MiMo-V2.5-Pro-UltraSpeed",
      api: "anthropic-messages",
      provider: "xiaomi-token-plan-sgp",
      baseUrl: "https://token-plan-sgp.xiaomimimo.com/anthropic",
      reasoning: true,
      input: ["text"],
      cost: {
        input: 1.305,
        output: 2.61,
        cacheRead: 0.0108,
        cacheWrite: 0
      },
      contextWindow: 1048576,
      maxTokens: 131072
    }
  },
  "zai": {
    "glm-4.7": {
      id: "glm-4.7",
      name: "GLM-4.7",
      api: "openai-completions",
      provider: "zai",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      compat: { "supportsDeveloperRole": false, "thinkingFormat": "zai", "zaiToolStream": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 204800,
      maxTokens: 131072
    },
    "glm-5-turbo": {
      id: "glm-5-turbo",
      name: "GLM-5-Turbo",
      api: "openai-completions",
      provider: "zai",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      compat: { "supportsDeveloperRole": false, "thinkingFormat": "zai", "zaiToolStream": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 2e5,
      maxTokens: 131072
    },
    "glm-5.2": {
      id: "glm-5.2",
      name: "GLM-5.2",
      api: "openai-completions",
      provider: "zai",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      compat: { "supportsDeveloperRole": false, "thinkingFormat": "zai", "zaiToolStream": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    },
    "glm-5.2-highspeed": {
      id: "glm-5.2-highspeed",
      name: "GLM-5.2 Highspeed",
      api: "openai-completions",
      provider: "zai",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      compat: { "supportsDeveloperRole": false, "thinkingFormat": "zai", "zaiToolStream": true },
      reasoning: true,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 1e6,
      maxTokens: 131072
    }
  }
};

// ../ai/src/models.ts
var modelRegistry = /* @__PURE__ */ new Map();
for (const [provider, models] of Object.entries(MODELS)) {
  const providerModels = /* @__PURE__ */ new Map();
  for (const [id, model] of Object.entries(models)) {
    providerModels.set(id, model);
  }
  modelRegistry.set(provider, providerModels);
}
function getModel(provider, modelId) {
  const providerModels = modelRegistry.get(provider);
  return providerModels?.get(modelId);
}
function getProviders() {
  return Array.from(modelRegistry.keys());
}
function getModels(provider) {
  const models = modelRegistry.get(provider);
  return models ? Array.from(models.values()) : [];
}
function supportsFastMode(model) {
  return model.provider === "openai-codex" && model.api === "openai-codex-responses" && (model.id === "gpt-5.4" || model.id === "gpt-5.5" || model.id === "gpt-5.6" || model.id.startsWith("gpt-5.6-"));
}
function calculateCost(model, usage, overrides) {
  usage.cost.input = model.cost.input / 1e6 * usage.input;
  usage.cost.output = model.cost.output / 1e6 * usage.output;
  usage.cost.cacheRead = model.cost.cacheRead / 1e6 * usage.cacheRead;
  usage.cost.cacheWrite = (overrides?.cacheWrite ?? model.cost.cacheWrite) / 1e6 * usage.cacheWrite;
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
  return usage.cost;
}
var EXTENDED_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
function getSupportedThinkingLevels(model) {
  if (!model.reasoning) return ["off"];
  return EXTENDED_THINKING_LEVELS.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level];
    if (mapped === null) return false;
    if (level === "xhigh" || level === "max") return mapped !== void 0;
    return true;
  });
}
function clampThinkingLevel(model, level) {
  const availableLevels = getSupportedThinkingLevels(model);
  if (availableLevels.includes(level)) return level;
  const requestedIndex = EXTENDED_THINKING_LEVELS.indexOf(level);
  if (requestedIndex === -1) return availableLevels[0] ?? "off";
  for (let i = requestedIndex; i < EXTENDED_THINKING_LEVELS.length; i++) {
    const candidate = EXTENDED_THINKING_LEVELS[i];
    if (availableLevels.includes(candidate)) return candidate;
  }
  for (let i = requestedIndex - 1; i >= 0; i--) {
    const candidate = EXTENDED_THINKING_LEVELS[i];
    if (availableLevels.includes(candidate)) return candidate;
  }
  return availableLevels[0] ?? "off";
}
function modelsAreEqual(a, b) {
  if (!a || !b) return false;
  return a.id === b.id && a.provider === b.provider;
}

// ../ai/src/utils/event-stream.ts
var EventStream = class {
  constructor(isComplete, extractResult) {
    this.isComplete = isComplete;
    this.extractResult = extractResult;
    this.queue = [];
    this.waiting = [];
    this.done = false;
    this.finalResultPromise = new Promise((resolve) => {
      this.resolveFinalResult = resolve;
    });
  }
  push(event) {
    if (this.done) return;
    if (this.isComplete(event)) {
      this.done = true;
      this.resolveFinalResult(this.extractResult(event));
    }
    const waiter = this.waiting.shift();
    if (waiter) {
      waiter({ value: event, done: false });
    } else {
      this.queue.push(event);
    }
  }
  end(result) {
    this.done = true;
    if (result !== void 0) {
      this.resolveFinalResult(result);
    }
    while (this.waiting.length > 0) {
      const waiter = this.waiting.shift();
      waiter({ value: void 0, done: true });
    }
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.queue.length > 0) {
        yield this.queue.shift();
      } else if (this.done) {
        return;
      } else {
        const result = await new Promise((resolve) => this.waiting.push(resolve));
        if (result.done) return;
        yield result.value;
      }
    }
  }
  result() {
    return this.finalResultPromise;
  }
};
var AssistantMessageEventStream = class extends EventStream {
  constructor() {
    super(
      (event) => event.type === "done" || event.type === "error",
      (event) => {
        if (event.type === "done") {
          return event.message;
        } else if (event.type === "error") {
          return event.error;
        }
        throw new Error("Unexpected event type for final result");
      }
    );
  }
};
function createAssistantMessageEventStream() {
  return new AssistantMessageEventStream();
}

export {
  getModel,
  getProviders,
  getModels,
  supportsFastMode,
  calculateCost,
  getSupportedThinkingLevels,
  clampThinkingLevel,
  modelsAreEqual,
  EventStream,
  AssistantMessageEventStream,
  createAssistantMessageEventStream
};
