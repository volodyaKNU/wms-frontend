# wms-frontend

Simple React + Vite frontend for the WMS Lab 2 individual task.

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

## Docker

Clone `wms-backend` and `wms-frontend` as sibling folders, then run from `wms-frontend`:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5173
```
