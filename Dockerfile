FROM node:18-alpine as build

WORKDIR /app

ENV SERA ${ENV}

COPY . .

RUN npm i -g @nestjs/cli
RUN npm ci --omit=dev --ignore-scripts
RUN npm run build

RUN ls dist/src -al

CMD ["node", "dist/src/main.js"]
