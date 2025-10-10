# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files and scripts first
COPY package.json package-lock.json ./
COPY scripts/ ./scripts/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy Google credentials (optional - will be created from env var in production)
RUN touch ./google-credentials.json

# Generate Prisma client for PostgreSQL
RUN npx prisma generate

# ❌ SUPPRIMÉ: RUN npx prisma db push (créait dev.db SQLite)
# La base PostgreSQL est gérée par DATABASE_URL en production

# Build Next.js with environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/google-credentials.json ./google-credentials.json
COPY --from=builder /app/prisma ./prisma
# ❌ SUPPRIMÉ: COPY --from=builder /app/dev.db ./dev.db
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Script de démarrage qui initialise les credentials Google puis lance l'app
CMD ["sh", "-c", "node scripts/init-google-credentials.js || echo 'Google credentials init failed, continuing...' && node server.js"]

