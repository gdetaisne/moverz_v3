# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and scripts first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/ ./scripts/
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

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
RUN pnpm build

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
# Next.js standalone inclut déjà node_modules/.prisma via .next/standalone/node_modules

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Script de démarrage qui initialise les credentials Google puis lance l'app
CMD ["sh", "-c", "node scripts/init-google-credentials.js || echo 'Google credentials init failed, continuing...' && node server.js"]

