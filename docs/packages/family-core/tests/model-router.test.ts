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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelRouter, RoutingStrategy } from '../src/model/ModelRouter';
import type { RouterConfig, ModelRouteConfig, CircuitBreakerConfig } from '../src/model/ModelRouter';
import type { BaseModelAdapter } from '../src/model/BaseModelAdapter';
import type { ChatRequest, ChatResponse } from '../src/deps/model-types';

function createMockAdapter(fail = false): BaseModelAdapter {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    generateChatCompletion: fail
      ? vi.fn().mockRejectedValue(new Error('Provider error'))
      : vi.fn().mockResolvedValue({ id: 'resp-1', choices: [{ message: { role: 'assistant', content: 'ok' } }] } as ChatResponse),
    healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' }),
  } as unknown as BaseModelAdapter;
}

function createConfig(overrides?: Partial<RouterConfig>): RouterConfig {
  return {
    strategy: RoutingStrategy.ROUND_ROBIN,
    defaultProvider: 'openai',
    routes: [
      { provider: 'openai', model: 'gpt-4', priority: 1, enabled: true },
      { provider: 'anthropic', model: 'claude-3', priority: 2, enabled: true },
    ],
    fallbackEnabled: true,
    ...overrides,
  };
}

describe('ModelRouter', () => {
  describe('constructor and initialization', () => {
    it('creates a router with valid config', () => {
      const router = new ModelRouter(createConfig());
      expect(router).toBeDefined();
    });

    it('initializes adapters for enabled routes', async () => {
      const router = new ModelRouter(createConfig());
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();
      expect(router['adapters'].size).toBe(2);
    });

    it('skips disabled routes during initialization', async () => {
      const config = createConfig({
        routes: [
          { provider: 'openai', model: 'gpt-4', priority: 1, enabled: false },
          { provider: 'anthropic', model: 'claude-3', priority: 2, enabled: true },
        ],
      });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();
      expect(router['adapters'].size).toBe(1);
    });

    it('creates circuit breakers for each adapter', async () => {
      const router = new ModelRouter(createConfig());
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();
      expect(router['circuitBreakers'].size).toBe(2);
    });
  });

  describe('chat routing', () => {
    it('routes to the selected adapter', async () => {
      const router = new ModelRouter(createConfig());
      const mockAdapter = createMockAdapter();
      router['createAdapter'] = vi.fn().mockReturnValue(mockAdapter);
      await router.initialize();

      const response = await router.chat({ messages: [{ role: 'user', content: 'hello' }] });
      expect(response).toBeDefined();
      expect(mockAdapter.generateChatCompletion).toHaveBeenCalled();
    });

    it('falls back to another provider on failure', async () => {
      const config = createConfig();
      const router = new ModelRouter(config);
      const failAdapter = createMockAdapter(true);
      const okAdapter = createMockAdapter(false);

      let callCount = 0;
      router['createAdapter'] = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? failAdapter : okAdapter;
      });
      await router.initialize();

      const response = await router.chat({ messages: [{ role: 'user', content: 'hello' }] });
      expect(response).toBeDefined();
    });

    it('throws when no fallback available', async () => {
      const config = createConfig({
        fallbackEnabled: false,
        routes: [{ provider: 'openai', model: 'gpt-4', priority: 1, enabled: true }],
      });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter(true));
      await router.initialize();

      await expect(router.chat({ messages: [{ role: 'user', content: 'hello' }] }))
        .rejects.toThrow('Provider error');
    });
  });

  describe('circuit breaker', () => {
    it('opens after consecutive failures', async () => {
      const config = createConfig({ strategy: RoutingStrategy.COST_OPTIMIZED });
      const router = new ModelRouter(config);
      const failAdapter = createMockAdapter(true);
      const okAdapter = createMockAdapter(false);

      let callCount = 0;
      router['createAdapter'] = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? failAdapter : okAdapter;
      });
      await router.initialize();

      for (let i = 0; i < 6; i++) {
        await router.chat({ messages: [{ role: 'user', content: 'test' }] });
      }

      const cb = router['circuitBreakers'].get('openai:gpt-4');
      expect(cb).toBeDefined();
      expect(cb!.isAvailable()).toBe(false);
    });

    it('records success and closes circuit', async () => {
      const router = new ModelRouter(createConfig());
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const cb = router['circuitBreakers'].values().next().value!;
      cb['state'] = 'open' as any;
      cb['failureCount'] = 5;

      cb.recordSuccess();
      expect(cb.getState()).toBe('closed');
      expect(cb['failureCount']).toBe(0);
    });

    it('transitions to half-open after reset timeout', async () => {
      const router = new ModelRouter(createConfig());
      const failAdapter = createMockAdapter(true);
      const okAdapter = createMockAdapter(false);

      let callCount = 0;
      router['createAdapter'] = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? failAdapter : okAdapter;
      });
      await router.initialize();

      // Force the circuit breaker to open with a short timeout
      const cb = router['circuitBreakers'].get('openai:gpt-4')!;
      cb['config'] = { failureThreshold: 3, resetTimeoutMs: 100, halfOpenMaxAttempts: 1 };
      for (let i = 0; i < 3; i++) cb.recordFailure();
      expect(cb.isAvailable()).toBe(false);

      // Wait for reset timeout
      await new Promise(r => setTimeout(r, 150));
      expect(cb.isAvailable()).toBe(true);
    });
  });

  describe('routing strategies', () => {
    it('selects round-robin routes', async () => {
      const config = createConfig({ strategy: RoutingStrategy.ROUND_ROBIN });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const route1 = router['selectModel']({});
      const route2 = router['selectModel']({});
      expect(route1).toBeDefined();
      expect(route2).toBeDefined();
    });

    it('selects cost-optimized route (lowest priority)', async () => {
      const config = createConfig({ strategy: RoutingStrategy.COST_OPTIMIZED });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const route = router['selectModel']({});
      expect(route.priority).toBe(1);
    });

    it('selects quality-first route (highest priority)', async () => {
      const config = createConfig({ strategy: RoutingStrategy.QUALITY_FIRST });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const route = router['selectModel']({});
      expect(route.priority).toBe(2);
    });

    it('selects manual route by default provider', async () => {
      const config = createConfig({ strategy: RoutingStrategy.MANUAL });
      const router = new ModelRouter(config);
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const route = router['selectModel']({});
      expect(route.provider).toBe('openai');
    });
  });

  describe('stats and health', () => {
    it('returns stats', async () => {
      const router = new ModelRouter(createConfig());
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const stats = router.getStats();
      expect(Object.keys(stats).length).toBe(2);
    });

    it('returns health status', async () => {
      const router = new ModelRouter(createConfig());
      router['createAdapter'] = vi.fn().mockReturnValue(createMockAdapter());
      await router.initialize();

      const health = await router.getHealthStatus();
      expect(Object.keys(health).length).toBe(2);
    });
  });
});
