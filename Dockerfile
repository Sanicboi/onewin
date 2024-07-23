FROM node:alpine
EXPOSE 5143
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD ["npm", "start"]