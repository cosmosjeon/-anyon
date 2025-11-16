#!/bin/bash

set -e  # Exit on any error

# Set default shared API base (can be overridden by environment variable)
export AY_SHARED_API_BASE="${AY_SHARED_API_BASE:-http://43.200.12.99:3000}"

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist/macos-arm64

echo "🔨 Building frontend..."
(cd frontend && npm run build)

echo "🔨 Building Rust binaries with shared API base: $AY_SHARED_API_BASE"
cargo build --release --manifest-path Cargo.toml
cargo build --release --bin mcp_task_server --manifest-path Cargo.toml

echo "📦 Creating distribution package..."

# Copy the main binary
cp target/release/server anyon
zip -q anyon.zip anyon
rm -f anyon
mv anyon.zip npx-cli/dist/macos-arm64/anyon.zip

# Copy the MCP binary
cp target/release/mcp_task_server anyon-mcp
zip -q anyon-mcp.zip anyon-mcp
rm -f anyon-mcp
mv anyon-mcp.zip npx-cli/dist/macos-arm64/anyon-mcp.zip

echo "✅ NPM package ready!"
echo "📁 Files created:"
echo "   - npx-cli/dist/macos-arm64/anyon.zip"
echo "   - npx-cli/dist/macos-arm64/anyon-mcp.zip"
