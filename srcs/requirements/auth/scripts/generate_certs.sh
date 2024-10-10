#!/bin/bash

# /etc/ssl/certs/ folder is created upon openssl installation
# The SSL certificates, including the public key and any intermediate certificates,
# are usually stored in a directory such as /etc/ssl/certs/.
# Private Keys: The private keys associated with the SSL certificates are stored
# in a directory such as /etc/ssl/private/.

echo "Generating SSL certificate..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout /etc/ssl/certs/auth.key \
	-out /etc/ssl/certs/auth.crt \
	-subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=${DOMAIN_NAME}"