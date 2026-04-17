FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY favicon.png /usr/share/nginx/html/favicon.png
COPY style/ /usr/share/nginx/html/style/
COPY scripts/ /usr/share/nginx/html/scripts/

EXPOSE 80
