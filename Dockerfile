FROM node

VOLUME /war

ADD *.js* README* /app/

RUN cd app/ && npm install 


ENTRYPOINT ["node","/app/compileJcmsLessFiles.js", "/war"]
