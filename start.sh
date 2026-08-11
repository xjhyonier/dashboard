#!/bin/bash
# dashboard-framework 开发服务器启动脚本
#
# 背景：Floatboat 内置 Node.js 启用了 Hardened Runtime (Team ID: YRK8XRVMZR)，
# 导致含原生二进制（.node）的 npm 包（如 Vite 8 的 rolldown）无法正常加载。
# 解决方案：强制使用 Homebrew 的 Node.js（无 Hardened Runtime）来运行命令。

HOMEBREW_BIN="/opt/homebrew/bin"
HOMEBREW_SBIN="/opt/homebrew/sbin"

# 检查 Homebrew node 是否存在
if [ ! -f "$HOMEBREW_BIN/node" ]; then
  echo "❌ 未找到 Homebrew node，请先安装：brew install node"
  exit 1
fi

# 检查包管理器是否存在
if [ ! -f "$HOMEBREW_BIN/npm" ]; then
  echo "❌ 未找到 npm，请先安装：brew install npm"
  exit 1
fi

echo "✅ 使用 Homebrew node: $($HOMEBREW_BIN/node --version)"
echo "✅ 使用 npm: $($HOMEBREW_BIN/npm --version)"
echo "🚀 启动 dashboard-framework..."
echo ""

# 切换到脚本所在目录（项目根目录）
cd "$(dirname "$0")"

# 强制优先使用 Homebrew 的 node，覆盖 Floatboat 内置 node
export PATH="$HOMEBREW_BIN:$HOMEBREW_SBIN:$PATH"

exec npm run dev
