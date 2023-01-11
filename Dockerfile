FROM node:latest
MAINTAINER Christoph Hoffmann <Christoph.Hoffmann@oeaw.ac.at>

RUN  apt-get update && apt-get upgrade -y && apt-get install -y  ghostscript graphicsmagick libgs-dev imagemagick poppler-utils
# Specify app directory
WORKDIR /home/node_rest/wks_prod/

# Install app + dev dependencies
COPY ./* nestify-base-app/
WORKDIR /home/node_rest/wks_prod/nestify-base-app
RUN npm install --legacy-peer-deps

CMD [ "npm", "run", "start:dev" ]