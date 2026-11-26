#!/usr/bin/env zsh
# scripts/test-plugin-suite-coverage.sh
# plugin 五件套 (+ plugin-ai-family) 逐包 istanbul 覆盖率门禁 — 每包三项 ≥85% 才放行
# 用法: pnpm test:coverage:plugins  （或 zsh scripts/test-plugin-suite-coverage.sh）
# 可用 PLUGIN_SUITE_PKGS="plugin-monitor plugin-ops" 只跑子集
set -uo pipefail
cd "$(dirname "$0")/.."

PKGS_LIST="${PLUGIN_SUITE_PKGS:-plugin-admin plugin-ai plugin-dev plugin-monitor plugin-ops plugin-ai-family}"
FAILED=()

for p in ${=PKGS_LIST}; do
  if [[ ! -d "packages/$p/src" ]]; then
    echo "✗ packages/$p 不存在，跳过"
    FAILED+=("$p")
    continue
  fi
  echo "▶ plugin-suite istanbul 门禁: $p"
  if PLUGIN_PKG="$p" npx vitest run --config vitest.plugin-suite.config.ts --coverage; then
    echo "✓ $p 通过 (statements/branches/functions/lines ≥ 85)"
  else
    echo "✗ $p 未达标"
    FAILED+=("$p")
  fi
done

if (( ${#FAILED} > 0 )); then
  echo "✗ plugin-suite 覆盖率门禁未通过: ${FAILED[*]}"
  exit 1
fi
echo "✓ plugin-suite 全部通过 85% istanbul 门禁"
