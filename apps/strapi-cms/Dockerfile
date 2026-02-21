FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  pkg-config \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p public

ENV NODE_ENV=production
EXPOSE 1337
CMD ["sh", "-lc", "mkdir -p public && npm run start"]
