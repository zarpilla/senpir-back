# Strapi 4.10 supports Node <= 18. The Brotli guard (src/middlewares/block-brotli.js)
# covers CVE-2026-111497 until the move to Strapi 5 / Node 22.
FROM node:18-alpine AS build
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev git
ENV NODE_ENV=production
# sharp 0.32 can't compile against current Alpine; use its prebuilt binary (bundles libvips)
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm ci --omit=dev --no-audit --no-fund
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
# The admin uses relative URLs, so it can be built once here instead of at every start
RUN npm run build

FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build --chown=node:node /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH
USER node
EXPOSE 1337
CMD ["npm", "start"]
