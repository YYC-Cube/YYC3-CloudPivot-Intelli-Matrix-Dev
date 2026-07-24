/**
 * @file: api/chat/stream.ts
 * @description: Vercel Serverless Function — LLM 代理 (隐藏 Key + 避免 CORS)
 *
 * 作用:
 * 1. 前端调用 /api/chat/stream, 无需暴露 API Key
 * 2. 服务端根据 provider 路由到 OpenAI/Anthropic/Qwen/DeepSeek/Kimi
 * 3. 输出标准 SSE 流式响应
 * 4. 实现 IP 速率限制 (60 req/min)
 *
 * 部署平台: Vercel (Node.js 20+)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ============================================================
// 速率限制 (内存级, 每个 Serverless 实例独立)
// 生产环境建议用 Vercel KV / Upstash Redis
// ============================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60);

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    const resetAt = now + 60_000;
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - 1, resetAt };
  }
  record.count += 1;
  return {
    allowed: record.count <= RATE_LIMIT_PER_MINUTE,
    remaining: Math.max(0, RATE_LIMIT_PER_MINUTE - record.count),
    resetAt: record.resetAt,
  };
}

// ============================================================
// Provider 配置
// ============================================================
interface ProviderEnv {
  apiKey: string;
  endpoint: string;
  buildBody: (req: ChatRequest) => Record<string, unknown>;
  parseStreamLine: (line: string) => string | null;
}

interface ChatRequest {
  provider: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userSignature?: string; // 用户签名 (用于指纹识别, 防滥用)
}

const PROVIDERS: Record<string, ProviderEnv> = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    endpoint: "https://api.openai.com/v1/chat/completions",
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? -1,
      stream: true,
    }),
    parseStreamLine: (line) => {
      if (!line.startsWith("data:")) return null;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return null;
      try {
        return JSON.parse(data).choices?.[0]?.delta?.content || null;
      } catch {
        return null;
      }
    },
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    endpoint: "https://api.anthropic.com/v1/messages",
    buildBody: (req) => ({
      model: req.model,
      system: req.systemPrompt,
      messages: req.messages.filter(m => m.role !== "system"),
      max_tokens: req.maxTokens ?? 4096,
      stream: true,
    }),
    parseStreamLine: (line) => {
      if (!line.startsWith("data:")) return null;
      try {
        const obj = JSON.parse(line.slice(5).trim());
        if (obj.type === "content_block_delta" && obj.delta?.text) return obj.delta.text;
        return null;
      } catch {
        return null;
      }
    },
  },
  qwen: {
    apiKey: process.env.DASHSCOPE_API_KEY ?? "",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      stream: true,
    }),
    parseStreamLine: (line) => {
      if (!line.startsWith("data:")) return null;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return null;
      try {
        return JSON.parse(data).choices?.[0]?.delta?.content || null;
      } catch {
        return null;
      }
    },
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      stream: true,
    }),
    parseStreamLine: (line) => {
      if (!line.startsWith("data:")) return null;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return null;
      try {
        return JSON.parse(data).choices?.[0]?.delta?.content || null;
      } catch {
        return null;
      }
    },
  },
  kimi: {
    apiKey: process.env.MOONSHOT_API_KEY ?? "",
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      stream: true,
    }),
    parseStreamLine: (line) => {
      if (!line.startsWith("data:")) return null;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return null;
      try {
        return JSON.parse(data).choices?.[0]?.delta?.content || null;
      } catch {
        return null;
      }
    },
  },
};

// ============================================================
// CORS 配置
// ============================================================
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:5173").split(",");

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Signature");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

// ============================================================
// 主入口
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  // CORS 预检
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // 速率限制
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? "unknown";
  const rl = checkRateLimit(clientIp);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_PER_MINUTE);
  res.setHeader("X-RateLimit-Remaining", rl.remaining);
  res.setHeader("X-RateLimit-Reset", Math.floor(rl.resetAt / 1000));
  if (!rl.allowed) {
    res.status(429).json({ error: "Too Many Requests", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) });
    return;
  }

  // 解析请求
  let chatReq: ChatRequest;
  try {
    chatReq = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const providerName = chatReq.provider ?? process.env.VITE_DEFAULT_LLM_PROVIDER ?? "openai";
  const provider = PROVIDERS[providerName];
  if (!provider) {
    res.status(400).json({ error: `Unknown provider: ${providerName}` });
    return;
  }
  if (!provider.apiKey) {
    res.status(503).json({ error: `${providerName} API Key 未配置 (服务端)` });
    return;
  }

  // 调用上游 LLM
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    };
    if (providerName === "anthropic") {
      headers["x-api-key"] = provider.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      delete headers.Authorization;
    }

    const upstream = await fetch(provider.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(provider.buildBody(chatReq)),
      signal: AbortSignal.timeout(60_000),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      res.status(upstream.status).json({ error: `${providerName} upstream error`, detail: errText.slice(0, 300) });
      return;
    }

    // SSE 流式转发
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        const delta = provider.parseStreamLine(line);
        if (delta) {
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const e = err as Error;
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", detail: e.message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
}
