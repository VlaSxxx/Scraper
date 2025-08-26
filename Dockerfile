FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/

EXPOSE 3000

ENV MONGODB_URI=mongodb://casino-scores-mongodb:27017/casino-scores
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
