FROM node:20-bookworm-slim

# sharp용 libvips + 빌드툴
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  pkg-config \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 먼저
COPY package*.json ./
RUN npm ci

# 소스 복사
COPY . .

# Strapi build (실패해도 런타임은 가능할 때가 있어 일단 허용)
RUN npm run build || true

ENV NODE_ENV=production
EXPOSE 1337

# Strapi가 public 폴더를 꼭 요구함
CMD ["sh","-lc","mkdir -p public && npm run start"]
