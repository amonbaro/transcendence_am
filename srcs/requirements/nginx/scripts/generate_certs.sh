#!/bin/bash
mkdir -p /etc/nginx/certs


openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout /etc/nginx/certs/nginx.key \
	-out /etc/nginx/certs/nginx.crt \
	-subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=${DOMAIN_NAME}"

