FROM node:22.12-alpine AS build

WORKDIR /app

COPY . .

RUN npm i -g @nestjs/cli
RUN npm ci --omit=dev --ignore-scripts
RUN npm run build

RUN ls dist/src -al

CMD ["node", "dist/src/main.js"]
