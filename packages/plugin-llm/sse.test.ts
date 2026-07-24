/**
 * @file: sse.test.ts
 * @description: SSE Server-Sent Events 协议测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SSEClient, readSSEStream } from "./src/sse";

/** 构造模拟 ReadableStream */
function makeSSEStream(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
}

/** 模拟 fetch 返回 SSE 流 */
function mockFetch(frames: string[], status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "ERR",
    body: makeSSEStream(frames),
  });
}

describe("SSEClient — 帧解析", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch([
      "data: hello\n\n",
      "data: world\n\n",
      "data: [DONE]\n\n",
    ]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应按行解析 data 字段", async () => {
    const events: string[] = [];
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false },
      { onEvent: (e) => events.push(e.data) }
    );
    await client.connect();
    expect(events).toEqual(["hello", "world", ""]);
  });

  it("应识别 [DONE] 标记", async () => {
    const events: { event: string; data: string }[] = [];
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false },
      { onEvent: (e) => events.push({ event: e.event, data: e.data }) }
    );
    await client.connect();
    expect(events[2].event).toBe("done");
  });
});

describe("SSEClient — 多行 data 字段", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch([
      "data: line1\ndata: line2\ndata: line3\n\n",
    ]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应按 \\n 拼接多行 data", async () => {
    const events: string[] = [];
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false },
      { onEvent: (e) => events.push(e.data) }
    );
    await client.connect();
    expect(events[0]).toBe("line1\nline2\nline3");
  });
});

describe("SSEClient — event / id / retry 字段", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch([
      "event: ping\ndata: 1\nid: 42\nretry: 2000\n\n",
    ]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应解析 event/id/retry 字段", async () => {
    const events: any[] = [];
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false },
      { onEvent: (e) => events.push(e) }
    );
    await client.connect();
    expect(events[0].event).toBe("ping");
    expect(events[0].id).toBe("42");
    expect(events[0].retry).toBe(2000);
  });
});

describe("SSEClient — POST 方法 + 自定义 headers", () => {
  let fetchSpy: ReturnType<typeof mockFetch>;
  beforeEach(() => {
    fetchSpy = mockFetch(["data: ok\n\n"]);
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应使用 POST 方法并带 Authorization 头", async () => {
    const client = new SSEClient(
      {
        url: "http://test/sse",
        method: "POST",
        headers: { Authorization: "Bearer sk-test" },
        body: { prompt: "hi" },
        autoReconnect: false,
      },
      { onEvent: () => { } }
    );
    await client.connect();
    expect(fetchSpy).toHaveBeenCalled();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://test/sse");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer sk-test");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ prompt: "hi" }));
  });
});

describe("SSEClient — 错误处理", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("HTTP 错误应触发 onError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      body: null,
    }));
    const onError = vi.fn();
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false, maxRetries: 0 },
      { onEvent: () => { }, onError }
    );
    await client.connect();
    expect(onError).toHaveBeenCalled();
    const err = onError.mock.calls[0][0];
    expect(err.message).toContain("500");
  });

  it("网络错误 + autoReconnect=false 不应重连", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const onError = vi.fn();
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false, maxRetries: 0 },
      { onEvent: () => { }, onError }
    );
    await client.connect();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("SSEClient — close()", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("close 后 isClosed 应返回 true", () => {
    vi.stubGlobal("fetch", mockFetch(["data: 1\n\n"]));
    const client = new SSEClient(
      { url: "http://test/sse", autoReconnect: false },
      { onEvent: () => { } }
    );
    client.close();
    expect(client.isClosed).toBe(true);
  });
});

describe("readSSEStream — 简化版", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch([
      "data: chunk1\n\n",
      "data: chunk2\n\n",
      "data: [DONE]\n\n",
    ]));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应简化读取并识别 [DONE]", async () => {
    const chunks: string[] = [];
    let doneCalled = false;
    await readSSEStream("http://test/sse", {
      onChunk: (data) => chunks.push(data),
      onDone: () => { doneCalled = true; },
    });
    expect(chunks).toEqual(["chunk1", "chunk2"]);
    expect(doneCalled).toBe(true);
  });
});
