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

The suite covers product creation, editing, low-stock highlighting, search,
deletion, income/writeoff operations, movement history, API CRUD, validation,
and protection against writing off more stock than is available.

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

## Continuous deployment to AWS EKS

A push to `main` builds the image, pushes
`<account>.dkr.ecr.eu-north-1.amazonaws.com/wms-frontend:<commit-sha>` to
Amazon ECR, and the `deploy-eks` job runs `kubectl set image` and
`kubectl rollout status` for `deployment/wms-frontend` in the `wms` namespace of
the `wms-lab` cluster. It then checks the SPA and the `/api` proxy, and runs
`kubectl rollout undo` on failure. Required GitHub configuration: secrets
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and variable `ENABLE_EKS_CD=true`
(see the backend README for details).
