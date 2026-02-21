FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

ENV npm_config_build_from_source=sharp
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=0

RUN npm install

COPY . .

RUN mkdir -p public

RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
# cache bust Sat Feb 21 19:53:53 +07 2026
