#!/bin/bash

# psql command doc and options: https://www.postgresql.org/docs/current/app-psql.html
# pg_ctl command doc and options: https://www.postgresql.org/docs/current/app-pg-ctl.html
# initdb source: https://www.postgresql.org/docs/current/app-initdb.html

set -e # Exit immediately if a command exits with a non-zero status.

# If the data directory doesn't exist, then initialize the database
# -z string: True if the length of string is zero.
# Then start the database
if [ ! -d "$PGDATA" ] ; then

echo "Initializing the database"

  # Take the values from the secret files
  POSTGRES_USER="$(cat "$POSTGRES_USER_FILE")"
  POSTGRES_PASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  POSTGRES_DB="$(cat "$POSTGRES_DB_NAME_FILE")"

  PGPASSWORD="$(cat "$PG_SUPERUSER_PASS")"
  export PGPASSWORD

  if [ $LOG_LEVEL = "DEBUG" ]; then
    # for debugging
    echo "POSTGRES_USER: $POSTGRES_USER"
    echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
    echo "POSTGRES_DB: $POSTGRES_DB"
    echo "PG SUPERUSER PASSWORD: $PGPASSWORD"
  fi

  # initdb creates a new PostgreSQL database cluster.
  # --pwfile=filename: initdb read the database superuser's password from a file.
  initdb --auth-local=scram-sha-256 --auth-host=scram-sha-256 -D "$PGDATA" --pwfile=/run/secrets/pg_superuser_pass

  # get auth container ip address
  DJANGO_CONTAINER_IP=$(getent hosts auth | awk '{ print $1 }')

  if [ $LOG_LEVEL = "DEBUG" ]; then
    echo "auth ip address is : $DJANGO_CONTAINER_IP"
  fi

  # Add auth container ip adress to  pg_hba.conf
  echo "host    all             all             $DJANGO_CONTAINER_IP/32           scram-sha-256" >> "$PGDATA"/pg_hba.conf

  # pg_ctl is a utility for initializing, starting, stopping, or restarting a PostgreSQL instance.
  # -D for data directory: the directory where the database cluster will be stored
  # If this option (-D) is omitted, the environment variable PGDATA is used.
  # -l logfile: write (or append) server log output to the specified file
  # -w for wait: Wait for the operation to complete (e.g., startup, shutdown, or restart) before returning.
  # -start mode launches a new server in the background
  pg_ctl -D "$PGDATA" -l /etc/postgresql/logfile -w start

  # Create a user with password
  # -U for user: connect the database to a user
  # -c for command: execute the given command string
  psql -U postgres -c "
      CREATE ROLE $POSTGRES_USER
      WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
  "

  # source :  https://docs.djangoproject.com/en/5.1/ref/databases/#optimizing-postgresql-s-configuration
  # Django current settings: USE_TZ = True and TIME_ZONE = 'Europe/Zurich'
  # Django needs the following parameters for its database connections
  # You can configure them directly in postgresql.conf or more conveniently per database user with ALTER ROLE.
  # I did both
  psql -U postgres -c "ALTER ROLE $POSTGRES_USER SET client_encoding TO 'UTF8';"
  psql -U postgres -c "ALTER ROLE $POSTGRES_USER SET default_transaction_isolation TO 'read committed';"
  psql -U postgres -c "ALTER ROLE $POSTGRES_USER SET timezone TO 'Europe/Zurich';"

  # Create a database with owner
  psql -U postgres -c "
      CREATE DATABASE $POSTGRES_DB
      OWNER $POSTGRES_USER;
  "

  # change the password to match POSTGRES_USER (pong)
  PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  export PGPASSWORD


  # Connect to database $POSTGRES_DB with user $POSTGRES_USER and execute an sql script from a file
  # -d for database name: connect to the database with this name
  # -f for file: read and execute commands from the file
  # psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /etc/postgresql/sql_scripts/init_tables.sql

  # -m Specifies the shutdown mode. Fast is recommended for normal shutdowns.
  pg_ctl -D "$PGDATA" -m fast -w stop

fi

unset PGPASSWORD

exec postgres -D "$PGDATA" -c config_file=/etc/postgresql/postgresql.conf
