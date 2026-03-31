FROM node:20.18.0-alpine3.20 AS build

WORKDIR /app

# Vite inlines VITE_* at `npm run build` — runtime env on nginx does not change them.
# Example:
#   docker build --build-arg VITE_API_URL=http://YOUR_IP:8000/api -t frontend-image .
ARG VITE_API_URL
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_PUBLIC_BASE_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PAYPAL_CLIENT_ID=${VITE_PAYPAL_CLIENT_ID}
ENV VITE_PUBLIC_BASE_URL=${VITE_PUBLIC_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


