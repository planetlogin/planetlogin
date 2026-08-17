# PlanetLogin — SvelteKit flavor (adapter-node). Stateless: scale horizontally.
# Built from the monorepo root so @planetlogin/core resolves via file: reference.
#
#   docker build -f flavors/svelte/Dockerfile -t planetlogin-svelte .
#   docker run -p 3000:3000 #     -e PLANETLOGIN_BASE_URL=https://login.acme.com #     -e PLANETLOGIN_CONFIG="$(cat planetlogin.config.json)" #     -e PLANETLOGIN_JWT_PRIVATE_KEY=/run/secrets/pl.pem #     -e PLANETLOGIN_DOWNSTREAM_URL=https://api.acme.com/identity #     -e PLANETLOGIN_DOWNSTREAM_SECRET=... #     -v /path/pl_ed25519.pem:/run/secrets/pl.pem:ro #     planetlogin-svelte

FROM node:22-alpine AS build
WORKDIR /app
ARG PLANETLOGIN_BASE=""
ENV PLANETLOGIN_BASE=$PLANETLOGIN_BASE
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/core/tsup.config.ts packages/core/
COPY packages/core/tsconfig.json packages/core/
COPY packages/core/bin/ packages/core/bin/
COPY packages/core/src/ packages/core/src/
COPY flavors/svelte/package.json flavors/svelte/
RUN npm ci --workspace=planetlogin-svelte --workspace=@planetlogin/core --include-workspace-root
COPY flavors/svelte/ flavors/svelte/
RUN npm run build -w planetlogin-svelte

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/flavors/svelte/build ./build
COPY --from=build /app/flavors/svelte/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "build"]
