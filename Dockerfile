# Strapi 5 on Node 22 (patched for CVE-2026-111497)
FROM node:22-alpine AS build
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev git
ENV NODE_ENV=production
# use sharp's prebuilt binary (bundles libvips) instead of compiling it against Alpine's
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm ci --omit=dev --no-audit --no-fund
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
# The admin uses relative URLs, so it can be built once here instead of at every start
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
# Dates in MySQL are stored in the server's local time (written that way by the old PM2 setup)
ENV TZ=Europe/Berlin
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build --chown=node:node /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH
USER node
EXPOSE 1337
CMD ["npm", "start"]
