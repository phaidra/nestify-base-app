FROM node:18-bullseye-slim as base
MAINTAINER Christoph Hoffmann <Christoph.Hoffmann@oeaw.ac.at>

RUN  apt-get update && apt-get upgrade -y && apt-get install -y  ghostscript graphicsmagick libgs-dev imagemagick poppler-utils

WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./tsconfig.build.json ./tsconfig.build.json
COPY --chown=node:node ./tsconfig.json ./tsconfig.json

FROM base as dev
ENV NODE_ENV development
RUN npm install --legacy-peer-deps
CMD [ "npm", "run", "start:dev" ]

FROM base as prod
ENV NODE_ENV production
RUN npm ci --legacy-peer-deps
RUN npm run build
CMD [ "node", "dist/main.js" ]
