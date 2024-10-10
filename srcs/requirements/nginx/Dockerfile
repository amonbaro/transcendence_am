# Nginx Dockerfile
FROM debian:bullseye-slim

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
      nginx \
      openssl \
      gettext \
      python3 \
      python3-pip

COPY scripts/entrypoint.sh /docker-entrypoint-initdb.d/entrypoint.sh
COPY conf/nginx.conf /etc/nginx/nginx.conf.template
COPY scripts/generate_certs.sh /etc/nginx/certs/generate_certs.sh

RUN chmod +x /docker-entrypoint-initdb.d/entrypoint.sh \
              /etc/nginx/certs/generate_certs.sh && \
    sh /etc/nginx/certs/generate_certs.sh

RUN pip3 install gixy==0.1.20 pyparsing==2.4.7

RUN gixy /etc/nginx/nginx.conf --format=text --output=/etc/nginx/nginx.conf.gixy

# Expose ports for HTTP and HTTPS
EXPOSE 80
EXPOSE 443

CMD ["/docker-entrypoint-initdb.d/entrypoint.sh"]

