# College Football Prediction App

A superforecaster-driven prediction platform for college football event contracts.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [nvm](https://github.com/nvm-sh/nvm) (for local development without Docker)

## Quick Start with Docker

```bash
# 1. Clone and enter the project
cd nfleventprediction

# 2. Copy environment file
cp .env.example .env

# 3. Build and run
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/health
```

## Node Version Management

This project uses [nvm](https://github.com/nvm-sh/nvm) for Node.js version management.

### Install nvm (if not already installed)

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc
```

### Use the correct Node version

```bash
# Install the version specified in .nvmrc
nvm install

# Use it (run this when entering the project)
nvm use

# Verify
node --version  # Should show v20.x.x
```

### Update to latest Node 20.x

```bash
# Install latest Node 20
nvm install 20

# Update .nvmrc to latest
node --version | cut -d'v' -f2 | cut -d'.' -f1 > .nvmrc

# Or for a specific version:
echo "20.18.0" > .nvmrc
```

### Update to a new major version (e.g., Node 22)

```bash
# 1. Install new version
nvm install 22

# 2. Update .nvmrc
echo "22" > .nvmrc

# 3. Update Dockerfiles (backend/Dockerfile and frontend/Dockerfile)
#    Change: FROM node:20-alpine
#    To:     FROM node:22-alpine

# 4. Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install

# 5. Test locally before committing
npm run dev
```

## Local Development (without Docker)

```bash
# Use correct Node version
nvm use

# Backend (terminal 1)
cd backend
npm install
npm run dev
# Runs on http://localhost:3001

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Development with Docker (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

This mounts your source files so changes reflect immediately.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts        # Express + WebSocket server
│   │   ├── routes/         # API endpoints
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/app/            # Next.js pages
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Production
├── docker-compose.dev.yml  # Development
├── .nvmrc                  # Node version
└── .env.example
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/games` | GET | List games |
| `/api/games/:id` | GET | Get single game |
| `/api/games/:id/odds` | GET | Get odds for game |
| `/api/forecast` | POST | Start forecast |
| `/api/forecast/:id` | GET | Get forecast status |
| `/api/positions` | GET | List positions |
| `/api/positions` | POST | Create position |
| `/api/positions/:id` | PATCH | Update position |

WebSocket: `ws://localhost:3001/ws`

## Troubleshooting

### Docker build fails
```bash
# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up
```

### Port already in use
```bash
# Find and kill process on port 3000 or 3001
lsof -i :3000
kill -9 <PID>
```

### Node version mismatch
```bash
nvm use
# If version not installed:
nvm install
```
