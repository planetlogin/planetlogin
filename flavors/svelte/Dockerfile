# PlanetLogin — SvelteKit flavor (adapter-node). Stateless: scale horizontally.
# @planetlogin/core is pulled from npm, so this builds standalone (no monorepo needed).
#
#   docker build -t planetlogin-svelte .
#   docker run -p 3000:3000 \
#     -e PLANETLOGIN_BASE_URL=https://login.acme.com \
#     -e PLANETLOGIN_CONFIG="$(cat planetlogin.config.json)" \
#     -e PLANETLOGIN_JWT_PRIVATE_KEY=/run/secrets/pl.pem \
#     -e PLANETLOGIN_DOWNSTREAM_URL=https://api.acme.com/identity \
#     -e PLANETLOGIN_DOWNSTREAM_SECRET=... \
#     -v /path/pl_ed25519.pem:/run/secrets/pl.pem:ro \
#     planetlogin-svelte

FROM node:22-alpine AS build
WORKDIR /app
# Mount point baked at build time (paths.base). Empty = subdomain; e.g. /auth to
# consume PlanetLogin same-origin under another app's path.
ARG PLANETLOGIN_BASE=""
ENV PLANETLOGIN_BASE=$PLANETLOGIN_BASE
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/build ./build
EXPOSE 3000
# Provide the env at runtime (see header). The PEM is best mounted as a secret file.
CMD ["node", "build"]
