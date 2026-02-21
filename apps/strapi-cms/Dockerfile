FROM node:20-slim

WORKDIR /app

# deps
COPY apps/strapi-cms/package*.json ./
RUN npm ci --omit=dev

# app
COPY apps/strapi-cms/ ./

# strapi requires public
RUN mkdir -p public

ENV NODE_ENV=production
EXPOSE 1337

CMD ["npm","run","start"]
