FROM node:16-alpine
ENV NODE_ENV=production
#WORKDIR /usr/src/app
#COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
#RUN npm install --production --silent && mv node_modules ../
RUN apk add --no-cache git
#COPY . .
EXPOSE 30000
#RUN chown -R node /usr/src/app
USER node
#CMD ["npm", "start"]
