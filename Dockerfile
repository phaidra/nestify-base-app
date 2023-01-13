FROM node:18 as base
MAINTAINER Christoph Hoffmann <Christoph.Hoffmann@oeaw.ac.at>

RUN  apt-get update && apt-get upgrade -y && apt-get install -y  ghostscript graphicsmagick libgs-dev imagemagick poppler-utils

WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./

FROM base as dev
ENV NODE_ENV development
RUN npm install --legacy-peer-deps
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./tsconfig.build.json ./tsconfig.build.json
COPY --chown=node:node ./tsconfig.json ./tsconfig.json

CMD [ "npm", "run", "start:dev" ]

FROM base as prod
ENV NODE_ENV production
RUN npm ci --legacy-peer-deps
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./tsconfig.build.json ./tsconfig.build.json
COPY --chown=node:node ./tsconfig.json ./tsconfig.json
RUN npm run build
CMD [ "node", "dist/main.js" ]
