FROM node:20-alpine

WORKDIR /opt/app
RUN chown -R node:node /opt/app
COPY --chown=node:node ./backend/package*.json /opt/app/

USER node
RUN npm install

COPY --chown=node:node ./backend/index.js ./
COPY --chown=node:node ./backend/db ./db
COPY --chown=node:node ./.env ./

EXPOSE 8000
ENTRYPOINT ["node"]
CMD ["index.js"]
