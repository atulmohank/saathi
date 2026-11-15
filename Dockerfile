# Saathi on Google Cloud Run (or any container host). The production deploy is Vercel; this is an alternative.
# Build: docker build -t saathi .   Run: docker run -p 8080:8080 --env-file .env.production saathi
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
RUN npm prune --omit=dev
USER node
EXPOSE 8080
CMD ["npx", "next", "start", "-p", "8080"]
