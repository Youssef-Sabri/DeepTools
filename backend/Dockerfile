# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npm install prisma@^6.19.3
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server"]
