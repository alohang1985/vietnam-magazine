FROM node:20-bullseye-slim@sha256:be08b7dfa11af5daa0757d12160117e02587f28a746f4cbffe20b46896e50608

RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p public

RUN echo "y" | npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
