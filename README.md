# wms-frontend

React + Vite frontend for the WMS individual project. The production image uses
Nginx to serve the compiled application and proxy `/api` requests to the backend.

## Requirements

- Node.js 20+
- Running `wms-backend` on `http://localhost:4000`

## Setup

```bash
npm install
npm run dev
```

Optional API URL override:

```bash
VITE_API_URL=http://localhost:4000 npm run dev
```

## Cypress

```bash
npm run cy:run
```

The GitHub Actions workflow starts PostgreSQL as a service, starts `wms-backend`, starts Vite and runs Cypress tests.

## Docker Compose

Clone `wms-backend` and `wms-frontend` as sibling folders, then run:

```bash
docker compose -f ../wms-backend/infra/docker-compose.yml up -d --build --wait
```

Open:

```text
http://localhost:5173
```

Stop the stack and remove its database volume:

```bash
docker compose -f ../wms-backend/infra/docker-compose.yml down -v
```

## CI and container image

Pull requests build the full three-container stack and run Cypress. A successful
push to `main` publishes `ghcr.io/volodyaknu/wms-frontend:latest` and an immutable
image tagged with the commit SHA.
