FROM debian:bullseye-slim

ENV EDITOR="nano"

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y cron \
                      nano \
                      curl \
                      rsyslog \
                      procps

RUN sed -i 's/^module(load="imklog")/#module(load="imklog")/' /etc/rsyslog.conf || \
    sed -i 's/^\$ModLoad imklog/#\$ModLoad imklog/' /etc/rsyslog.conf

RUN echo "*/1 * * * * curl -k -X POST https://auth:8000/api/user/flush/ >> /var/log/flush_cron_job.log 2>&1" > /etc/cron.d/auth_tokens_cron && \
    echo "*/1 * * * * curl -k -X POST https://auth:8000/api/user/show/ >> /var/log/show_cron_job.log 2>&1" >> /etc/cron.d/auth_tokens_cron && \
    chmod 0644 /etc/cron.d/auth_tokens_cron && \
    crontab /etc/cron.d/auth_tokens_cron

CMD service rsyslog start && cron -f