#!/bin/bash

if [ -d /etc/cron.d/ ] && [ -f /etc/cron.d/auth_tokens_cron ]; then
    echo "Cron job already exists"
else
    echo "Creating cron job"
    echo "*/1 * * * * curl https://auth:8000/api/user/flush-expired-tokens" > /etc/cron.d/auth_tokens_cron && \
    echo "*/1 * * * * curl https://auth:8000/api/user/show-blacklisted-tokens" >> /etc/cron.d/auth_tokens_cron && \
    chmod 0644 /etc/cron.d/auth_tokens_cron && \
    crontab /etc/cron.d/auth_tokens_cron
fi

cron -f