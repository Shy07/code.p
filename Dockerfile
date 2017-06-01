FROM node:4-onbuild
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN npm install
EXPOSE 8080
CMD npm start
