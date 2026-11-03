FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173 4173

CMD ["npm", "run", "dev"]
