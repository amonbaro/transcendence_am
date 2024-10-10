# source: https://docs.gunicorn.org/en/20.1.0/settings.html
import ssl

errorlog = "/logs/error.log"
loglevel = "debug"
accesslog = "/logs/access.log" # register all HTTP requests and responses
workers = 1
bind = "0.0.0.0:8000"
keyfile = "/etc/ssl/certs/auth.key"
certfile = "/etc/ssl/certs/auth.crt"
ssl_version = ssl.PROTOCOL_TLSv1_2  # Utiliser la constante correcte pour TLSv1.2
