FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Drop default static config noise
RUN rm -f /etc/nginx/conf.d/default.conf.default 2>/dev/null || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
