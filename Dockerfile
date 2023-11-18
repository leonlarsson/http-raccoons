FROM node:21-bookworm-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . ./

ENV WRANGLER_SEND_METRICS=false

EXPOSE 8787

CMD [ "npm", "start" ]
