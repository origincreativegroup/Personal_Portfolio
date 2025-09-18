FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/. .
COPY prisma ./prisma

RUN npm run build && npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
