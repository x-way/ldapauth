FROM node:20.12.2-slim

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY ldap_server.js ./

EXPOSE 389

CMD [ "node", "ldap_server.js" ]
