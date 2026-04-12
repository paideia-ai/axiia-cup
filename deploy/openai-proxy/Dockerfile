FROM node:22-alpine

WORKDIR /app

COPY server.mjs /app/server.mjs

ENV HOST=0.0.0.0
ENV PORT=3100

USER node

EXPOSE 3100

CMD ["node", "/app/server.mjs"]
