# 02 · 测试与质量验证报告

> 项目：YYC3-CloudPivot-Intelli-Matrix-Dev
> 验证日期：2026-09-16 07:37–07:50 (GMT+8) · 验证人：测试验证 Worker（言启家族）
> 方法：全部数字来自真实命令输出（日志留存于 /tmp/*.log），未修改任何源码

---

## ① 环境与安装实况

| 项 | 实况 |
|----|------|
| node | v22.18.0（/usr/local/bin/node） |
| pnpm | 9.15.4（/opt/homebrew/bin/pnpm） |
| OS | Darwin arm64（macOS） |
| git | /opt/homebrew/bin/git，HEAD=07c7343（修整README文档），初始提交 61fb9ef |
| 安装前 node_modules | 不存在（干净状态） |

### 安装过程（有阻断，已降级解决）

**第一步：按任务要求执行 `pnpm install --frozen-lockfile`（pnpm 9.15.4）→ 失败**

报错原文：
```
Scope: all 28 workspace projects
WARN  There are cyclic workspace dependencies:
  .../docs/packages/family-agents, .../docs/packages/family-skills;
  .../packages/plugin-llm, .../packages/shell
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
The current "overrides" configuration doesn't match the value found in the lockfile
Update your lockfile using "pnpm install --no-frozen-lockfile"
```

**根因**：`pnpm-workspace.yaml` 中使用了 pnpm 11+ 语法（`overrides:`、`onlyBuiltDeduendencies:` 块，文件内注释自证"pnpm 11+ 构建脚本白名单/统一依赖覆盖"），而 pnpm 9.15.4 无法读取 workspace 级 `overrides`，与 lockfile（其中记录了 `overrides: react ^19.0.0`）不匹配。**项目声称的包管理器版本（README/CI 均为 9.15.x）与仓库配置实际要求的版本（11+）自相矛盾——这是环境阻断级问题。**

**降级处理**：改用 `npx pnpm@11.27.0 install --frozen-lockfile` → 安装成功（518 个包入 .pnpm store，vitest/tsc/playwright/esbuild bin 均可用），但退出码为 1，原因是 pnpm 11 默认忽略构建脚本：

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @swc/core@1.15.46,
esbuild@0.25.12, esbuild@0.27.0, esbuild@0.27.7
```

`onlyBuiltDependencies` 在 workspace.yaml 中有配置（@swc/core、esbuild），理论上应放行——但 pnpm 11.27 还要求 `allowBuilds` 布尔确认（它自动往 pnpm-workspace.yaml 写入了 `allowBuilds: 'set this to true or false'` 占位，我已 `git checkout -- pnpm-workspace.yaml` 还原，**已跟踪文件零改动**）。实测 `esbuild --version` = 0.27.7 可运行，vitest/vite 均正常工作，故该 ignored-builds 警告未影响本报告的测试结论。

**其他安装观察**：
- 循环依赖警告：`plugin-llm ↔ shell`（peerDep 双向）、`docs/packages/family-agents ↔ family-skills`
- 仓库同时存在 `package-lock.json`（npm，lockfileVersion 3）与 `pnpm-lock.yaml`——双锁文件并存，npm 残留未清理
- `~/.npmrc` 中含 npm authToken（本机环境，与项目无关，不计入项目风险）

---

## ② type-check 结果

### 根目录 `tsc --noEmit`（pnpm type-check）

| 项 | 结果 |
|----|------|
| 退出码 | **0（通过）** |
| 报错数 | 0 |
| 覆盖范围 | tsconfig include：packages/**、apps/**、api/**（strict: true） |

### 补充：docs/packages 与 i18n（根 tsconfig 不覆盖，单独验证）

| 包 | tsc --noEmit | 退出码 |
|----|--------------|--------|
| docs/packages/family-core | 通过 | 0 |
| docs/packages/family-agents | 通过 | 0 |
| docs/packages/family-skills | 通过 | 0 |
| docs/packages/family-ui | 通过 | 0 |
| docs/packages/a2a-adapter | 通过 | 0 |
| docs/packages/ai-assistant | 通过 | 0 |
| i18n/packages/i18n-core（tsconfig.build.json） | 通过 | 0 |

**结论：TypeScript 全域（根 + docs + i18n-core）零错误，类型质量实况良好。**

⚠️ 注意：根 `type-check` 只覆盖 packages/apps/api，docs/packages（README 声称的"权威实现"）与 i18n/** 完全不在 CI 的 type-check 范围内（各自包内有 typecheck script 但 CI 未调用）。

---

## ③ 单元测试实测数字（宣称 vs 实测）

### 实测总表

| 测试域 | 命令 | 测试文件 | 通过 | 失败 | 跳过 | 耗时 | 退出码 |
|--------|------|---------|------|------|------|------|--------|
| **根 `pnpm test`（vitest run）** | 根 vitest.config.ts，include 仅 `packages/**`+`apps/**` | **20** | **271** | **0** | **0** | 7.12s | **0** |
| docs/packages/family-core | 包内 vitest run | 29 | 540 | 0 | 0 | 5.02s | 0 |
| docs/packages/family-agents | 包内 vitest run | 4 | 76 | 0 | 0 | 0.66s | 0 |
| docs/packages/family-skills | 包内 vitest run | 7 | 121 | 0 | **26** | 3.66s | 0 |
| docs/packages/family-ui | 包内 vitest run | 2 | 39 | 0 | 0 | 1.79s | 0 |
| docs/packages/a2a-adapter | 包内 vitest run | 2 | 23 | 0 | 0 | 1.69s | 0 |
| **docs/packages 小计** | — | 44 | **799** | 0 | **26** | — | 0 |
| i18n/packages/i18n-core | 包内 vitest run ×4 次（1 次偶发 1 失败后 3 连绿） | 20 | 321 | 0 | 0 | ~8s | 0 |
| i18n/packages/plugin-package-contract | 临时 config 跑（无 vitest.config，test script 缺失） | 1 | 4 | 0 | 0 | 5.27s | 0 |
| i18n/packages/memory-host-sdk | 临时 config 跑（同上） | 22 | 50 | **1+14 文件级失败** | 4 | 12.30s | 1 |

### 根 pnpm test 明细（271 = 各文件实测）

plugin-prompt 19 · shell/event-bus-cross-plugin 15 · shell/hub-commands 15 · plugin-cost 30 · plugin-target/target-engine 27 · plugin-marketing 41 · plugin-target/engine-integration 8 · plugin-llm/sse 9 · plugin-llm/providers 14 · plugin-llm/router 13 · shell/event-bus 5 · shell/ErrorBoundary 7 · shell/storage 7 · family-agents(根) 10 · plugin-llm/key-manager 11 · shell/AIAssistantHub 8 · shell/WelcomePage 9 · plugin-llm/crypto 10 · shell/llm-bridge 7 · family-core(根)/ecosystem 6

### 抽查单独跑（workspace 级联验证）

| 抽查 | 命令 | 结果 |
|------|------|------|
| packages/shell | `vitest run packages/shell` | **8 文件 / 73 tests 全过**（6.01s） |
| packages/plugin-llm | `vitest run packages/plugin-llm` | **5 文件 / 57 tests 全过**（4.92s） |

> 说明：packages/ 下的包自身 package.json 均无 test script（shell 是纯 peerDeps 壳），需从根跑或按路径过滤——级联安装正常，但"包级 test script"体系未建立。

### 宣称 vs 实测对照表

| README 宣称 | 宣称值 | 实测 | 判定 |
|------------|--------|------|------|
| 徽章：Tests 799 ✅ / 0 ❌ / 26 ⚠ | 799/0/26 | 根 `pnpm test` 仅 **271/0/0**；799/0/26 实际来自 **docs/packages 五包各自单独跑** | ⚠️ **口径不符：`npx vitest run`（README 172 行命令）只能得到 271，799 需要分别在 docs/packages 各包目录跑 test 才能凑齐** |
| "测试总数 799 通过 · 26 跳过 ✅ 全绿"（417 行） | 799+26 | 799 通过 + 26 跳过可复现（docs 域合计） | ✅ 数字本身可复现，但**不是单一命令产出** |
| "npx vitest run # 全量测试 799 通过"（172 行） | 799 | 实测 271 | ❌ **该命令实测得 271，宣称 799 不成立** |
| shell 67 tests（插件矩阵） | 67 | 实测 **73**（8 文件） | ⚠️ 宣称偏低（README 数字陈旧） |
| family-core 540 | 540 | 实测 **540** | ✅ |
| family-skills 121 | 121 | 实测 121 通过 + 26 跳过 | ✅（跳过数未提） |
| family-agents 76 | 76 | 实测 **76** | ✅ |
| family-ui 39 | 39 | 实测 **39** | ✅ |
| a2a-adapter 23 | 23 | 实测 **23** | ✅ |
| plugin-target 35 | 35 | 实测 27+8=**35** | ✅ |
| plugin-cost 30 | 30 | 实测 **30** | ✅ |
| plugin-marketing 41 | 41 | 实测 **41** | ✅ |
| plugin-prompt 19 | 19 | 实测 **19** | ✅ |
| plugin-llm 5（Phase4 清单行） | 5 | 实测 **57**（5 文件） | ⚠️ 宣称严重偏低（可能是早期数字） |
| RTL 组件测试 24 用例 | 24 | ErrorBoundary 7 + WelcomePage 9 + AIAssistantHub 8 = **24** | ✅ |
| 合计 996 全绿（插件矩阵表） | 996 | 各包实测合计 271+799=1070（口径混乱） | ⚠️ **没有任何单一命令能产出 996** |
| "E2E 测试 Playwright (Chromium) ✅"（419 行） | ✅ | 7/7 因浏览器未装全部失败（详见⑤） | ❌ 本机不可复现"✅" |

### i18n 域实况（README 完全未提）

- **i18n-core：321 tests**（4 次运行中 1 次 1 用例失败、3 次 321 全绿 → 存在**约 25% 概率的 flaky 测试**）
- **memory-host-sdk：不可完整运行**——22 个测试文件中 14 个文件级失败，根因是大量 `../../../../src/...` 相对导入指向**仓库中不存在的路径**（src/agents/agent-scope.js、src/infra/retry.js、src/media/mime.js、src/test-utils/model-auth-mock.js）——该包像是从另一个仓库（OpenClaw 生态，包名 @openclaw/memory-host-sdk）**裁切搬运而来且未随迁依赖源码**。可运行的 50 通过/4 跳过，失败的 1 个用例同样源于缺模块（src/media/mime.js）。
- plugin-package-contract：4 tests 通过（但包内无 vitest.config、无 test script，需临时配置才能跑）

---

## ④ 覆盖率

### `pnpm test:coverage` 实况：**崩溃（退出码 1）**

- **现象**：`vitest run --coverage` 抛 Unhandled Error 后崩溃：
  ```
  Error: An error occurred while trying to read the map file at
  %E4%BA%94%E7%BB%B4%E8%AF%84%E4%BC%B0%E5%BC%95%E6%93%8E.js.map
  Error: ENOENT: ... docs/packages/family-core/dist/architecture/五维评估引擎.js.map
  ```
- **根因（已实证）**：仓库内残留的 `docs/packages/family-core/dist/`（git-ignored 构建产物，2026-07-24 生成）中，中文文件名的 sourcemap URL 注释是 **percent-编码**（`//# sourceMappingURL=%E4%BA%94...`），而 coverage-v8 按编码串读盘 → ENOENT。根 vitest 配置未 exclude `docs/**`，coverage 的 untested-files 扫描把陈旧 dist 一并卷入。
- **验证**：追加 `--coverage.exclude='docs/**'` 后 coverage 可完成（测试仍 271 全过），但**退出码仍为 1**——因为暴露出 9 个 Unhandled Rejection（见⑦质量风险 R4）。
- **CI 影响**：CI quality job 含 `pnpm test:coverage` → **在 CI 干净环境（无 dist 残留）可能不触发 ENOENT，但 unhandled rejection 问题与本地一致，`test:coverage` 在 CI 的可用性存疑**。

### 覆盖率数字（--coverage.exclude='docs/**' 后产出，root 域）

```
All files | % Stmts 17.98 | % Branch 65.6 | % Funcs 54.5 | % Lines 17.98
```

要点摘录（语句覆盖）：
| 模块 | Stmts | 备注 |
|------|-------|------|
| plugin-prompt/src | 86.76% | business-prompts 100%，register.ts 仅 6.89% |
| plugin-target/src | 82.26% | target-engine 100%，register.ts 7.4% |
| shell/src | 67.81% | AIAssistantHub 52.65%，llm-bridge 71.91%，ErrorBoundary/WelcomePage ~100% |
| AIAssistant/（根目录遗留组件） | 0% | 完全无测试 |
| api/chat/stream.ts | 0% | 完全无测试 |
| plugin-ops、plugin-monitor、plugin-business 等 6 个界面型插件 | 0% | register.ts + pages 全部 0% |

> 总体 17.98% 语句覆盖被 0% 的界面型插件与遗留目录严重拉低；引擎型插件（prompt/target/cost/marketing）覆盖良好。**CI 上传的 coverage artifact 实为这种"全仓扫描"口径，无阈值门禁（无 thresholds 配置），覆盖率不构成质量门禁。**

---

## ⑤ E2E 实况

| 项 | 实况 |
|----|------|
| 配置 | playwright.config.ts：testDir ./e2e，chromium 单项目，baseURL localhost:3112，webServer 自动启动 `apps/standalone-ai-family` 的 vite（apps/standalone-ai-family/node_modules/.bin/vite 存在 ✅） |
| 用例规模 | **1 个文件（e2e/welcome-flow.spec.ts）、7 个用例**（欢迎页 3 + Hub 浮窗 4） |
| `playwright test --list`（dry-run） | 正常列出 7 用例，退出码 0 |
| 实际执行 | **7/7 全部失败**，失败原因统一为：`browserType.launch: Executable doesn't exist at ~/Library/Caches/ms-playwright/chromium_headless_shell-1228/...`（**Chromium 浏览器未安装**，本机缓存目录为空） |
| 未执行（安装浏览器）原因 | 任务约定不安装浏览器；且安装属环境变更，超出"不修改源码、只跑验证"的边界 |
| 仓库残留 | test-results/.last-run.json 显示此前一次运行也是 **status: failed（7 个 failedTests）**；playwright-report/ 有历史 HTML 报告——说明**本仓库交付时的 E2E 也从未绿过** |

**结论：E2E 体系 = 7 个用例的单一 smoke 文件，从未在本仓库成功跑绿；README"E2E ✅"仅指配置存在，不代表可复现通过。**

---

## ⑥ CI 覆盖分析（.github/workflows/ai-eco-ci.yml）

触发：push（main/feature/*/phase/*）+ PR→main；concurrency 取消旧 run。

| Job | 内容 | 实测对照判定 |
|-----|------|--------------|
| 1️⃣ quality（TS+Lint+Vitest+Coverage） | pnpm install --frozen-lockfile → type-check → lint → `pnpm test --run` → test:coverage → 上传 coverage | ⚠️ **CI 用 Node 20 + pnpm 9.15.0，而 frozen-lockfile 在 pnpm 9 下必然 ERR_PNPM_LOCKFILE_CONFIG_MISMATCH（见①）→ CI 第一步就会挂**（除非 GitHub runner 有不同行为；workspace overrides 语法 pnpm 9 不认是版本行为，与环境无关）。另外 test 只测 271（packages/apps），docs 域 799 不在 CI 范围 |
| 2️⃣ build（8 app 矩阵） | standalone-monitor/ops/ai/ai-family/dev/admin/**dynasty**/full 各自 `pnpm --filter build` | ❌ **矩阵含 standalone-dynasty，但 apps/ 下不存在该目录（且 apps 里另有 CI 未覆盖的 standalone-business）→ dynasty 构建必失败** |
| 3️⃣ e2e | 下载 full 构建产物 → playwright:install → test:e2e | ⚠️ 用 full 构建跑 e2e，但 playwright.config webServer 命令是起 standalone-ai-family 的 **dev server**，且 url:3112——e2e job 下载的 dist 与实际被测对象不一致（结构性疑点）；用例仅 7 条 |
| 4️⃣ security | pnpm audit(high) + Snyk + Gitleaks，**三者全部 continue-on-error: true** | ⚠️ 安全扫描全部"允许失败"= 无实际门禁，仅信息收集 |
| 5️⃣ lighthouse | PR 时对 apps/full/dist 跑 Lighthouse CI（性能≥0.9 warn / a11y≥0.95 error / LCP≤2500ms error 等） | ✅ 断言配置真实存在且较严格（仅 PR 触发） |
| 6️⃣ docker | main/phase 分支构建镜像不推送 | 正常 |
| 7️⃣ deploy | main push 时 Vercel 生产部署，needs [quality, build, e2e, security, lighthouse] | ⚠️ lighthouse 仅 PR 触发——**纯 main push 时 deploy 的 needs 链会因 lighthouse 被 skip 而直接 skipped**（GitHub Actions 行为：needs 中被 skip 的 job 会让下游默认也 skip，除非用 if: always()，配置里没有）→ **main 直推实际上永远不部署** |
| 8️⃣ ecosystem-check | 检查 12 个插件的 src/index.ts 存在性；`node validate-ecosystem.js || true`（**该文件不存在**，靠 || true 兜底） | ⚠️ 形式检查；validate 脚本缺失被静默吞掉 |

**CI 总评**：骨架完整（质量→构建→e2e→安全→性能→部署的流水线形状齐全），但**至少三处结构性缺陷会导致它在真实 runner 上无法全绿**：pnpm 9 与 workspace overrides 不兼容（quality job 第一步挂）、standalone-dynasty 不存在（build job 挂）、deploy 的 needs 链含仅 PR 触发的 lighthouse（main push 永远不部署）。结合本仓库 GitHub 仓库是否真实启用 Actions 未验证（本地无远端运行记录），CI 声称与可运行性存疑。

---

## ⑦ 质量风险清单

| # | 风险 | 严重度 | 证据 |
|---|------|--------|------|
| **R1** | **包管理器版本矛盾**：README/CI 声称 pnpm 9.15.x，但 pnpm-workspace.yaml 使用 pnpm 11+ 语法（overrides/onlyBuiltDependencies）；pnpm 9 下 frozen install 必失败；pnpm 11 下又因 allowBuilds 确认退出码 1 并自动改写 workspace.yaml | 🔴 阻断 | ①中报错原文 + pnpm 11 自动写入 allowBuilds 占位（已还原） |
| **R2** | **测试数字口径失真**：README 核心命令 `npx vitest run` 宣称 799 通过，实测根命令仅 271；799 只能由 docs/packages 五包分别跑出（540+76+121+39+23）；矩阵表"合计 996"无任何命令可复现 | 🔴 高 | ③对照表 |
| **R3** | **测试域割裂**：根 vitest include 仅 packages/apps；docs/packages（自称"权威实现"）与 i18n/**（321+50+4 tests）完全游离于根测试与 CI 之外；packages/family-* 在 workspace 中被排除（用 docs 版替代）但根 packages/family-agents、family-core 下仍有孤立测试文件（10+6 tests，测的是"壳"还是 docs 版存疑——alias 未指到 docs，实际测的是 packages/ 下同名源码） | 🔴 高 | pnpm-workspace.yaml 排除项 + vitest include + ③ |
| **R4** | **9 个 Unhandled Rejection（window is not defined）**：packages/shell/src/AIAssistantHub.tsx:189/241 —— jsdom 卸载后异步回调仍 setState；带 --coverage 跑时导致退出码 1（无 coverage 时 vitest 不判死）。CI 的 test:coverage 步骤可能因此挂掉 | 🟠 中高 | ④复现步骤与堆栈 |
| **R5** | **coverage 无法原生完成**：默认 `pnpm test:coverage` 因 docs/packages/family-core/dist/ 陈旧构建产物的中文文件名 sourcemap（percent-编码）ENOENT 崩溃；且无覆盖率阈值门禁 | 🟠 中 | ④ |
| **R6** | **E2E 从未绿过**：7 用例单文件；本机浏览器未装全败（约定不装）；仓库自带 .last-run.json 即 failed;7，历史 playwright-report 同为失败记录 | 🟠 中 | ⑤ |
| **R7** | **CI 三处结构性缺陷**：pnpm 版本不兼容（job1 挂）、standalone-dynasty 不存在（job2 挂）、deploy needs 链含 PR-only 的 lighthouse（main push 永不部署）；安全扫描全部 continue-on-error 无门禁；validate-ecosystem.js 缺失被 `\|\| true` 吞 | 🔴 高 | ⑥ |
| **R8** | **lint 是占位符**：package.json `lint: echo 'lint: ok (add ESLint config)'`，实测输出 "lint: ok (add ESLint config)"，仓库无任何 ESLint/Prettier 配置文件。**README/CI 把它当质量门禁展示是虚设** | 🟠 中 | ①+⑥（实况确认） |
| **R9** | **memory-host-sdk 半成品搬运**：22 测试文件中 14 个因引用不存在的 src/agents|infra|media|test-utils 路径而文件级失败——从外部仓库（@openclaw 命名空间）裁切而来未随迁依赖；包无 test script 无 vitest.config，README 对 i18n 域 375+ tests 只字未提 | 🟠 中 | ③ |
| **R10** | **i18n-core 存在 flaky**：4 连跑出现 1 次 1 用例失败（后 3 次全绿） | 🟡 低中 | ③ |
| **R11** | **双锁文件并存**：package-lock.json（npm）与 pnpm-lock.yaml 同存，且 package-lock 的项目名是 "yyc3-ai-ecosystem"（与 package.json 的 yyc3-cloudpivot-intelli-matrix 不同名）→ npm/pnpm 混用残留 | 🟡 低 | ① |
| **R12** | **循环依赖警告**：plugin-llm ↔ shell（workspace 级）、docs/family-agents ↔ family-skills；安装时持续告警 | 🟡 低 | ① |
| **R13** | **测试覆盖盲区**：AIAssistant/（根遗留组件 8 文件）、api/chat/stream.ts、6 个界面型插件（monitor/ops/ai/business/dev/admin）语句覆盖 0% | 🟡 低中 | ④ |
| **R14** | **plugin-llm 测试宣称 5 实测 57**、shell 宣称 67 实测 73——README 数字多处陈旧失准（虽偏向保守） | 🟡 低 | ③ |

### 值得肯定的信号

- ✅ 根域 271/271、docs 域 799/799 全绿，**零真实失败用例**（i18n flaky 与 memory-host-sdk 除外）
- ✅ TypeScript strict 全域零错误（含 docs、i18n-core）
- ✅ 26 个 skip 全部集中在 family-skills（显式标注，多为需外部服务的 NVIDIA/MCP 用例），非隐藏性跳过
- ✅ 测试质量本身不差：加密用例验证 IV 唯一性、组件测试用 RTL、引擎测试 30+ 用例/包
- ✅ 循环依赖、peerDeps 结构上虽有告警但安装与运行正常

---

## 附：验证命令留痕（全部真实执行）

```
pnpm install --frozen-lockfile                     # pnpm 9.15.4 → ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
npx pnpm@11 install --frozen-lockfile              # 成功，exit 1（ignored-builds 提示）
./node_modules/.bin/tsc --noEmit                   # exit 0
./node_modules/.bin/vitest run                     # 271 passed, exit 0
./node_modules/.bin/vitest run packages/shell      # 73 passed
./node_modules/.bin/vitest run packages/plugin-llm # 57 passed
(cd docs/packages/family-core && vitest run)       # 540 passed
(cd docs/packages/family-agents && vitest run)     # 76 passed
(cd docs/packages/family-skills && vitest run)     # 121 passed | 26 skipped
(cd docs/packages/family-ui && vitest run)         # 39 passed
(cd docs/packages/a2a-adapter && vitest run)       # 23 passed
(cd i18n/packages/i18n-core && vitest run) ×4      # 321 passed ×3, 1 failed ×1（flaky）
./node_modules/.bin/vitest run --coverage          # ENOENT 崩溃 exit 1
./node_modules/.bin/vitest run --coverage --coverage.exclude='docs/**'  # 报表产出，exit 1（unhandled rejections）
./node_modules/.bin/playwright test --list         # 7 tests listed, exit 0
./node_modules/.bin/playwright test                # 7 failed（浏览器未装）
npx pnpm@11 run lint / pnpm run lint               # "lint: ok (add ESLint config)"（echo 占位）
```

*已跟踪文件改动：0（pnpm 11 自动写入 pnpm-workspace.yaml 的 allowBuilds 占位已 git checkout 还原；coverage/、test-results/ 增量产物均为 git-ignored 常规副产物）*
