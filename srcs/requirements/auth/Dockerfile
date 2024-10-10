FROM debian:bullseye-slim

# www-data group is already created because of the shared volume with the host and nginx
ENV GROUPNAME=www-data
#ENV GROUPNAME=root

# pong will be the name of the new created user
ENV USERNAME=pong
#ENV USERNAME=root

# Specifies where pip can install packages if a non-root user uses pip
ENV PATH="/home/$USERNAME/.local/lib:$PATH"
ENV PATH="/home/$USERNAME/.local/bin:$PATH"

#ENV EDITOR="nano"

# Specifies the default time zone
ENV TZ="Europe/Zurich"

# .local/lib  and .local/bin: folders for pip packages installed as non root user:
# /logs/ : folder for logs configured in gunicorn.conf.py
# /usr/src/app/ : folder for the django project
# /usr/src/app/scripts : folder for scripts
RUN mkdir -p /home/$USERNAME/.local/lib  \
             /home/$USERNAME/.local/bin  \
             /logs \
             /usr/src/app/

WORKDIR /usr/src/app

COPY requirements.txt ./
COPY pong_site/ ./
COPY conf/gunicorn.conf.py ./
COPY scripts/ ./scripts/

RUN chmod +x ./scripts/init.sh \
             ./scripts/wait-for-it.sh \
             ./scripts/generate_certs.sh

# Create group and user, adjust ownership
RUN useradd $USERNAME && echo "$USERNAME:password" | chpasswd && \
    usermod -a -G $GROUPNAME $USERNAME && \
    chown -R $USERNAME:$GROUPNAME /home/$USERNAME/.local/lib  \
                                  /home/$USERNAME/.local/bin  \
                                  /logs  \
                                  /usr/src/app/


RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y python3 \
                   python3-pip \
                   # for postgres test use: psql -h postgres -U your_username -d your_database -W
                   postgresql-client \
                   # for ping test: ping postgres
                   iputils-ping \
                   # for api test
                   curl
                   # editor of crontab
#                   nano \
#                   # for cron tasks
#                   cron \
#                   # for ps command: ps aux | grep "cron"
#                   procps

RUN bash ./scripts/generate_certs.sh
RUN chown -R $USERNAME:$GROUPNAME /etc/ssl/certs/

# for crontab
#RUN echo "$USERNAME" > /etc/cron.allow
#RUN chmod 755 /var/run
#RUN chown $USERNAME:$GROUPNAME /var/run
#RUN chmod u+s /usr/sbin/cron

# Ajouter la tâche cron
#RUN echo "* * * * * /usr/bin/python3 /usr/src/app/manage.py flushexpiredtokens >> /usr/src/app/cron_job.log 2>&1" > /etc/cron.d/mycron \
#    && chmod 0644 /etc/cron.d/mycron \
#    && crontab /etc/cron.d/mycron


#RUN mkdir -p /home/$USERNAME/.local/share/nano/ \
#    && chmod 777 /home/$USERNAME/.local/share/nano/\
#    && chown $USERNAME:$GROUPNAME /home/$USERNAME/.local/share/nano/

USER $USERNAME

#RUN crontab /etc/cron.d/mycron

RUN pip3 install --no-cache-dir -r requirements.txt && \
    gunicorn --version

EXPOSE 8000

CMD [ "sh", "/usr/src/app/scripts/init.sh" ]
