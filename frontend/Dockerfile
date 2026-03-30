FROM node:20.18.0-alpine3.20 as build

WORKDIR /app

# If you need to configure backend URL, VITE_* must be provided at build time.
# Example: --build-arg VITE_API_URL=http://1.2.3.4:8000/api
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


