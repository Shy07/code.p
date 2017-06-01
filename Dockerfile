FROM node:4-onbuild
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
EXPOSE 8080
CMD npm start
