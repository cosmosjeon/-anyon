# Anyon

> **Based on [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) by BloopAI**
> Modified by **Slit** | Licensed under Apache 2.0

<p align="center">
  <img src="frontend/public/anyon-logo.svg" alt="Anyon Logo" width="200">
</p>

<p align="center">Get 10X more out of Claude Code, Gemini CLI, Codex, Amp and other coding agents...</p>

## Overview

AI coding agents are increasingly writing the world's code and human engineers now spend the majority of their time planning, reviewing, and orchestrating tasks. Anyon streamlines this process, enabling you to:

- Easily switch between different coding agents
- Orchestrate the execution of multiple coding agents in parallel or in sequence
- Quickly review work and start dev servers
- Track the status of tasks that your coding agents are working on
- Centralise configuration of coding agent MCP configs
- Open projects remotely via SSH when running Anyon on a remote server

## Installation

Make sure you have authenticated with your favourite coding agent. Then in your terminal run:

```bash
npx anyon
```

Or set your own server:

```bash
export AY_SHARED_API_BASE=http://43.200.12.99:3000
npx anyon
```

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (>=18)
- [pnpm](https://pnpm.io/) (>=8)

Additional development tools:
```bash
cargo install cargo-watch
cargo install sqlx-cli
```

Install dependencies:
```bash
pnpm i
```

### Running the dev server

```bash
pnpm run dev
```

This will start the backend. A blank DB will be copied from the `dev_assets_seed` folder.

### Building the frontend

To build just the frontend:

```bash
cd frontend
pnpm build
```

### Build from source

1. Run `build-npm-package.sh`
2. In the `npx-cli` folder run `npm pack`
3. You can run your build with `npx [GENERATED FILE].tgz`

### Environment Variables

The following environment variables can be configured at build time or runtime:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `AY_SHARED_API_BASE` | Build/Runtime | - | Remote sync server URL |
| `POSTHOG_API_KEY` | Build | - | Analytics key |
| `BACKEND_PORT` | Runtime | auto | Backend server port |
| `FRONTEND_PORT` | Runtime | 3000 | Frontend dev port |

### Remote Server Deployment

See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) for detailed instructions on deploying your own remote sync server.

## License & Attribution

This project is based on **Vibe Kanban** by **BloopAI**:
- Original: https://github.com/BloopAI/vibe-kanban
- Modified by: **Slit** as **Anyon**
- License: Apache 2.0

See [LICENSE](./LICENSE) file for details.

## Original Credits

Vibe Kanban was created by the BloopAI team. This fork maintains the original Apache 2.0 license and includes modifications for Slit's use case.
