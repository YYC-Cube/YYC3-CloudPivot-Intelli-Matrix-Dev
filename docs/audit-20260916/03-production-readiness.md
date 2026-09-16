# 03 · 生产部署就绪度审计报告

> 审计对象：`/Users/yanyu/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix-Dev`
> 审计日期：2026-09-16 · 审计方式：只读静态审计（未运行安装/构建，未修改项目文件）
> 审计人：言启·千行（原派生产部署 Worker 因超时失败，本报告由千行亲自补做，证据均为本机实查）
> 所有判断附文件路径证据，可复现。

---

## 〇、执行摘要

部署面配置齐全度高（Dockerfile 三阶段/nginx 安全头/healthcheck/vercel.json/CSP/CORS/速率限制/LLM 代理函数均有真实实现），**但整条部署链存在 4 个阻断级断点**：①Dockerfile 复制不存在的 plugin-dynasty 包清单；②`pnpm install --frozen-lockfile` 在 pnpm 9（CI 钉定版本）下必失败；③CI deploy 依赖链结构性断裂（main push 永不部署）；④Nginx 运行时镜像内无 LLM 代理能力。规划文档宣称「Phase 4 生产部署 ✅ 100%」与实况差距显著——**配置就绪 ≠ 可部署**。同时规划文档的技术栈清单与实际依赖大面积不符（宣称 openai/@anthropic-ai/sdk/dexie/crypto-js，实际全是自研零依赖实现）。

---

## 一、部署面盘点表

| 部署面 | 文件 | 实况 | 判定 |
|--------|------|------|------|
| 容器构建 | `Dockerfile` | 三阶段（deps→builder→runtime）：node:20-alpine + pnpm@9.15.0 + nginx:alpine；gzip、8 类安全头、SPA fallback、/healthz、非 root 用户（nginx）、HEALTHCHECK 30s | ✅ 结构规范 |
| 容器编排 | `docker-compose.yml` | 单 web 服务：8080:80、env_file .env.docker、restart unless-stopped、healthcheck、资源限制 256M/0.5CPU、Traefik HTTPS 注释模板 | ✅ 结构规范 |
| Serverless | `vercel.json` | buildCommand=`type-check && test && app-full build`；outputDirectory=apps/full/dist；regions sin1/hkg1；10 项响应头；/assets 1y immutable；SPA rewrite；/github 302 | ✅ 结构规范 |
| Serverless 函数 | `api/chat/stream.ts`（288 行） | 5 Provider 代理（OpenAI/Anthropic/Qwen/DeepSeek/Kimi）、SSE 转发、内存级 IP 限流 60/min、CORS 白名单、60s 上游超时、Bearer/x-api-key 双协议 | ✅ 真实实现 |
| 环境变量样例 | `.env.example` / `.env.docker.example` | VITE_APP_* / 5 Provider Key / CORS / RATE_LIMIT / SERVER_MASTER_KEY / SENTRY_DSN / POSTHOG_KEY / VERCEL_* | ✅ 齐全（部分为死配置，见④） |
| 忽略清单 | `.dockerignore` | 排除 node_modules/dist/.git/docs/e2e 等 | ✅ 合理（但见⑤镜像体积节） |
| 健康检查 | Dockerfile HEALTHCHECK + compose healthcheck + nginx /healthz | wget /healthz，三层一致 | ✅ |
| PWA | vercel.json /sw.js no-store 头 | **sw.js 全仓不存在**（find public apps 无结果） | ❌ 死配置 |
| 监控 | SENTRY_DSN / POSTHOG_KEY | **全仓零代码引用**（grep 无 sentry/posthog import） | ❌ 纯占位 |
| Dockerfile 包清单 | COPY plugin-dynasty/package.json | **packages/plugin-dynasty 不存在**（ls 实查） | 🔴 阻断 |

## 二、LLM 代理与安全实况

### 2.1 api/chat/stream.ts（唯一的 Serverless 函数）

**真实能力**（逐行核验）：
- ✅ 5 Provider 端点路由：openai/anthropic/qwen（dashscope 兼容模式）/deepseek/kimi（moonshot），各自 buildBody/parseStreamLine 适配（Anthropic 的 system 消息外提、x-api-key + anthropic-version 头）
- ✅ SSE 流式转发：upstream reader → 按 \n 切帧 → `data: {"delta":...}` → `data: [DONE]`
- ✅ 内存级速率限制：Map<ip,{count,resetAt}>，60 req/min 可配，X-RateLimit-* 响应头
- ✅ CORS 白名单：CORS_ALLOWED_ORIGINS env，默认 localhost:5173，Vary: Origin
- ✅ 上游错误兜底：非 2xx 时透传 status + detail.slice(0,300)；AbortSignal.timeout(60_000)
- ✅ headersSent 后的错误走 SSE event: error 帧

**缺口**：
- ❌ **Nginx/Docker 形态无此能力**：该函数是 Vercel Serverless 专属（@vercel/node）；Docker 镜像是纯静态 nginx——**「私有部署 = 无 LLM 代理」**，前端只能直连各 Provider（CSP connect-src 允许）或走浏览器 Keyring 模式
- ⚠️ 内存级限流在 Serverless 多实例下形同虚设（代码注释自认「生产环境建议用 Vercel KV / Upstash Redis」——但未做）
- ⚠️ `.env.example` 的 `LLM_PROXY_ENABLED` 开关在前后端代码零引用（grep 实查），前端没有消费该开关的逻辑——**代理模式实际不可从前端开启**，只能手动改前端代码里的 baseURL
- ⚠️ userSignature 字段定义了但主流程未使用（仅透传）
- ⚠️ `.env.example` 中 SERVER_MASTER_KEY 声明「用于服务端加密」——stream.ts 全文无服务端加密实现（Key 加密只存在于前端 plugin-llm Keyring）

### 2.2 安全头与 CSP

vercel.json 与 Dockerfile/nginx 的 CSP **基本一致但有微妙分叉**：
- vercel.json 版 connect-src 含 `https://api.moonshot.cn` **重复两次**
- nginx 版无此重复，但 img-src 含 `https:`（vercel 版同）
- 两版 script-src 均含 `'unsafe-inline' 'unsafe-eval'`——**React 生产构建本不需要 unsafe-eval**，这是为 dev 模式留的口子，直接进了生产 CSP，属安全自贬
- Dockerfile 内嵌 nginx conf 用 heredoc `COPY <<'EOF'`——要求 BuildKit；docker-compose 未声明要求，老版 docker build 直接失败
- X-XSS-Protection 只在 vercel.json 有，nginx 版没有（该头已废弃，无实际影响，但不一致）

### 2.3 前端密钥安全（plugin-llm Keyring）

- ✅ AES-256-GCM + PBKDF2 100K 迭代 + 每密文独立 salt/IV，实现规范（见 02/04 报告详析）
- ⚠️ 默认设备指纹口令模式安全性低（代码注释自认），生产应强制主口令或服务端代理——但服务端代理形态（stream.ts）又没有前端开关消费（见 2.1）

## 三、规划 vs 实况差距表

以 `docs/YYC3-生产部署-就绪规划.md`（v1.3，自称 Phase 4 100% 完成）对照：

| # | 规划宣称 | 实况 | 差距 |
|---|----------|------|------|
| 1 | 「部署: Vercel + Docker + CI/CD 8-job ✅」 | CI 三处结构性缺陷（dynasty 不存在 / pnpm 版本矛盾 / deploy needs 链断裂），见 02 报告⑥ | 🔴 宣称 ✅ 实际不可用 |
| 2 | 「Vercel 部署 可访问 https://yyc3.vercel.app ✅ 配置就绪」 | vercel.json 存在，但 buildCommand 含 `pnpm test --run`——CI 环境外购测试即挂（见 02 报告③口径问题 + R1/R7）；且 vercel 构建器走 installCommand `pnpm install --frozen-lockfile` 同样踩 pnpm 版本矛盾 | 🔴 部署命令链本身会失败 |
| 3 | 「Docker 镜像 < 500MB ✅ Nginx Alpine ~50MB」 | nginx:alpine 基础镜像属实，但 **Dockerfile COPY plugin-dynasty/package.json 不存在 → docker build 第一步失败**，镜像大小无从谈起 | 🔴 阻断 |
| 4 | 「依赖漏洞 0 高危 ✅ CI 集成」 | security job 三个扫描全部 continue-on-error，无门禁（02 报告⑥） | ⚠️ 形式达成 |
|  build 命令「type-check && test && build」实测不可过（见 #2） | | | |
| 5 | 「LLM 适配层技术栈: openai (npm) / @anthropic-ai/sdk / dexie / crypto-js」 | 实际实现：**零 npm 依赖自研**（BaseAdapter 模板方法 + Web Crypto API + localStorage），plugin-llm/package.json 无任何 runtime deps | ⚠️ 文档严重失真（自研比宣称的更轻，但文档记录的依赖面全错） |
| 6 | 「本地 Keyring + 远端 Vault ✅」 | 远端 Vault 无任何实现痕迹 | ❌ 虚构项 |
| 7 | 「单元测试 294 tests / 100% pass ✅」 | 实测根命令 271（docs 域 799 另算），294 是历史口径 | ⚠️ 数字过期 |
| 5 | Lighthouse「LCP<2.5s/CLS<0.1/TBT<200ms ✅」 | .lighthouserc.json 断言真实存在（02 报告⑥），但仅 PR 触发且依赖 build 产物存在 | ⚠️ 部分成立 |

> 规划文档中 M1–M14 里程碑时间戳（02:50–09:11 连夜完成）与「294 tests」「8 App 全 npm install 可运行」等口径，均指向该文档生成于某个历史时点后未随代码演进更新，与 README 同病。

## 四、构建链路实况

| 环节 | 实况 | 证据 |
|------|------|------|
| 根 build 脚本 | `echo 'build: ok'` 占位 | package.json scripts.build |
| 真实构建 | 各 app `vite build`（full/standalone-* 均有 dist 残留，说明本机构建过） | apps/*/dist 实存 |
| full 依赖声明 | **package.json 零 @yyc3/\* 依赖**，import 靠 vite.config alias 直连 ../../packages/*/src 解析 | apps/full/package.json vs App.tsx:5-68 |
| full tsconfig | **不存在**（其余 standalone 有） | ls apps/full |
| plugin-ai-family 运行时 | peerDep `@yyc3/family-core: workspace:*` → 安装解析到 **docs/packages/family-core/dist**（CJS 产物） | 01 报告 3.3 |
| packageManager 字段 | **缺失**——无 engines、无 packageManager 声明，包管理器版本全靠 README/CI 文字约定 | grep package.json |
| Vercel 构建链 | installCommand 用 --frozen-lockfile（pnpm 9 必挂）+ buildCommand 含 pnpm test（271 测试，测试自身能过但 install 先挂） | vercel.json |
| Docker 构建链 | corepack pnpm@9.15.0 + --frozen-lockfile（同 #2 必挂）+ COPY dynasty（必挂）+ heredoc 语法（需 BuildKit） | Dockerfile |
| 环境变量注入 | 纯 VITE_APP_NAME/VERSION/ENV 三项 + LLM Keys；VITE_DEFAULT_LLM_PROVIDER/STRATEGY 声明了但前端消费情况未验证 | .env.example |

## 五、生产落地差距清单（分级）

### 🔴 阻断级（不修复无法上线）

| # | 差距 | 证据 | 修复建议 |
|---|------|------|----------|
| B1 | Dockerfile COPY 不存在的 plugin-dynasty 清单 → docker build 直接失败 | Dockerfile L20 `COPY packages/plugin-dynasty/package.json` vs ls 实查不存在 | 删除该行（或补齐真实包清单） |
| B2 | pnpm 版本矛盾：workspace 配置用 pnpm 11+ 语法，CI/Dockerfile/README 钉 pnpm 9.15.0 → frozen install 必失败 | pnpm-workspace.yaml overrides/onlyBuiltDependencies + 02 报告①实测报错 | 统一升 pnpm 11 并在 package.json 加 packageManager 字段；CI/Dockerfile 同步 |
| B3 | CI deploy needs 链含 PR-only 的 lighthouse → main push 永不部署 | .github/workflows/ai-eco-ci.yml deploy.needs + 02 报告⑥ | lighthouse 移出 needs 或加 if: always() 逻辑 |
| B4 | Vercel buildCommand 链 `type-check && test --run && build`：install 先挂（B2 同源） | vercel.json buildCommand | B2 修复后自解 |

### 🟠 高优先级（可部署但明显残缺）

| # | 差距 | 证据 | 修复建议 |
| 05 | Docker 形态无 LLM 代理（纯静态 nginx）→ 私有部署用户被迫用浏览器 Keyring 直连 | api/chat/stream.ts 仅 Vercel 形态 | 增补 node sidecar 或 nginx njs；或文档明示私有部署的能力边界 |
| H2 | LLM_PROXY_ENABLED 开关无代码消费 | grep 零引用 | 前端接线或从 env 样例移除 |
| H3 | CSP 含 'unsafe-eval'（为 dev 留的口子进生产） | vercel.json/Dockerfile CSP | 生产 CSP 收紧 |
| H4 | Serverless 限流内存级，多实例失效 | stream.ts 注释自认 | 接 Upstash Redis（@upstash/ratelimit 一小时工作量） |
| H5 | Sentry/PostHog 纯 env 占位，零代码接入 | grep 零引用 | 接入或移除，避免虚假安全感 |
| H6 | sw.js 死配置（vercel 头存在、文件不存在） | find 实查 | 移除或补 PWA |
| H7 | 监控/告警页面全是 Math.random() mock，生产无真实数据源 | 04 报告 R3 | 定义 DataAdapter 接口 |

### 🟡 中低优先级

- M1：nginx conf heredoc 需 BuildKit，docker-compose 未声明（老 docker build 失败）
- M2：vercel.json connect-src moonshot 重复两次；X-XSS-Protection 两平台不一致
- M3：.env.docker 不存在（compose env_file 指向的文件需要用户从 example 创建——README 需说明）
- M4：规划文档「远端 Vault」「dexie/crypto-js」等虚构/失实项应清理
- M5：Traefik HTTPS 是注释模板，私有部署 HTTPS 指引未成文

## 六、可执行的落地路线（分阶段）

**第 0 步 · 修断点（半天，全是小改）**
1. Dockerfile 删 dynasty 行（B1）
2. package.json 加 `"packageManager": "pnpm@11.x"`，CI/Dockerfile/README 同步升 pnpm 11（B2/B4）
3. CI deploy needs 修 lighthouse 依赖（B3）
4. 删 sw.js 头、修 CSP 重复项（H6/M2）
→ 验收：`docker build .` 与 `vercel deploy --prod`（或 CI 全绿）各自走通一次

**第 1 步 · 真实可部署（1-2 天）**
5. Docker 形态补 LLM 代理能力（node:20-alpine sidecar 挂 stream.ts 逻辑，或 nginx njs）——或短期内文档明示「私有部署=无代理模式」
6. 限流迁 Upstash；CSP 收紧去 unsafe-eval
7. Sentry/PostHog 二选一真实接入（或移除 env）
→ 验收：私有部署后 /api/chat/stream 可用 + 前端代理开关接线

**第 2 步 · 可运营（3-5 天）**
8. 监控页面接真实数据源（DataAdapter 接口替换 mock 常量）
9. E2E 修到可绿（装 Chromium、修 webServer 与被测对象一致性——02 报告⑤）
10. Lighthouse 从 PR-only 扩展到 main 部署前门禁
→ 验验收：main 合并 → 全链路自动部署可用

**第 3 步 · 规划对齐（持续）**
11. 重写「生产部署就绪规划」文档对齐实况（本文档可作输入）
12. README 徽章数字改为脚本化生成（CI 输出实际测试数）

---

## 附：本报告实测命令口径

- `cat Dockerfile docker-compose.yml vercel.json .dockerignore .env.example .env.docker.example`
- `sed -n '1,288p' api/chat/stream.ts`（全文逐段）
- `ls packages/plugin-dynasty` → No such file or directory
- `find public apps -name "sw.js" -o -name "manifest.json" -o -name "robots.txt"`（排除 node_modules）→ 空
- `grep -rn "sentry\|posthog" --include="*.ts" --include="*.tsx"` → 零代码引用
- `grep -rn "LLM_PROXY_ENABLED"` → 仅 .env.example
- `cat apps/full/package.json apps/standalone-monitor/package.json`、`grep packageManager package.json` → 无声明
- `sed -n '101,171p' docs/YYC3-生产部署-就绪规划.md`
