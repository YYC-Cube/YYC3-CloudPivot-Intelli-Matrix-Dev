/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NodeAdapter, setPlatformAdapter, resetPlatformAdapter, getPlatformAdapter } from '../src/platform/PlatformAdapter.js';
import { ToolRegistry, createTextAnalysisTool, createCalculatorTool } from '../src/engine/ToolRegistry.js';

describe('PlatformAdapter', () => {
  afterEach(() => {
    resetPlatformAdapter();
  });

  it('NodeAdapter returns defaults', () => {
    const adapter = new NodeAdapter();
    expect(adapter.getScreenSize()).toEqual({ width: 1920, height: 1080 });
    expect(adapter.getDeviceType()).toBe('desktop');
    expect(adapter.getPlatform()).toBe(process.platform);
    expect(adapter.isBrowser()).toBe(false);
    expect(adapter.isNode()).toBe(true);
    expect(adapter.getAgentManager()).toBeUndefined();
  });

  it('setPlatformAdapter overrides default', () => {
    const custom = new NodeAdapter();
    setPlatformAdapter(custom);
    expect(getPlatformAdapter()).toBe(custom);
  });

  it('resetPlatformAdapter clears override', () => {
    const custom = new NodeAdapter();
    setPlatformAdapter(custom);
    resetPlatformAdapter();
    const next = getPlatformAdapter();
    expect(next).not.toBe(custom);
    expect(next.isNode()).toBe(true);
  });

  it('NodeAdapter.getLanguage returns env LANG or fallback', () => {
    const adapter = new NodeAdapter();
    const lang = adapter.getLanguage();
    expect(typeof lang).toBe('string');
    expect(lang.length).toBeGreaterThan(0);
  });
});

describe('ToolRegistry', () => {
  it('registers and retrieves a tool', async () => {
    const registry = new ToolRegistry();
    const tool = createTextAnalysisTool();
    const result = await registry.registerTool(tool);
    expect(result.success).toBe(true);
    expect(result.toolId).toBe('text-analysis');
    expect(registry.getTool('text-analysis')).toBe(tool);
  });

  it('rejects duplicate tool IDs', async () => {
    const registry = new ToolRegistry();
    const tool = createTextAnalysisTool();
    await registry.registerTool(tool);
    const result = await registry.registerTool(tool);
    expect(result.success).toBe(false);
  });

  it('rejects invalid tool definitions', async () => {
    const registry = new ToolRegistry();
    const result = await registry.registerTool({} as any);
    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('executes text analysis tool', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createTextAnalysisTool());
    const result = await registry.executeTool('text-analysis', { text: 'Hello world.' });
    expect(result.success).toBe(true);
    expect(result.data.data.wordCount).toBe(2);
  });

  it('executes calculator tool', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createCalculatorTool());
    const result = await registry.executeTool('calculator', { operation: 'add', a: 3, b: 4 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ success: true, data: 7, executionTime: expect.any(Number) });
  });

  it('returns error for missing tool', async () => {
    const registry = new ToolRegistry();
    const result = await registry.executeTool('nonexistent', {});
    expect(result.success).toBe(false);
  });

  it('unregisters a tool', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createCalculatorTool());
    await registry.unregisterTool('calculator');
    expect(registry.getTool('calculator')).toBeUndefined();
  });

  it('throws when unregistering missing tool', async () => {
    const registry = new ToolRegistry();
    await expect(registry.unregisterTool('ghost')).rejects.toThrow('not found');
  });

  it('lists tools by category', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createTextAnalysisTool());
    await registry.registerTool(createCalculatorTool());
    const textTools = registry.listTools('text');
    expect(textTools).toHaveLength(1);
    expect(textTools[0].id).toBe('text-analysis');
  });

  it('lists all tools', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createTextAnalysisTool());
    await registry.registerTool(createCalculatorTool());
    expect(registry.listTools()).toHaveLength(2);
  });

  it('searches tools by name', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createTextAnalysisTool());
    await registry.registerTool(createCalculatorTool());
    const results = registry.searchTools('calc');
    expect(results).toHaveLength(1);
  });

  it('validates tool parameters before execution', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createTextAnalysisTool());
    const result = await registry.executeTool('text-analysis', { text: 123 });
    expect(result.success).toBe(false);
  });

  it('validates division by zero in calculator', async () => {
    const registry = new ToolRegistry();
    await registry.registerTool(createCalculatorTool());
    const result = await registry.executeTool('calculator', { operation: 'divide', a: 1, b: 0 });
    expect(result.success).toBe(false);
  });

  it('emits tool:registered event', async () => {
    const registry = new ToolRegistry();
    const listener = vi.fn();
    registry.on('tool:registered', listener);
    await registry.registerTool(createTextAnalysisTool());
    expect(listener).toHaveBeenCalled();
  });
});
