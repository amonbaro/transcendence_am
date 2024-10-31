#!/bin/bash

# the /var/www/html folder is the path of all site file.
# This path is stored in the environnement variable $SITE_PATH.
# This path is automatically created by the docker-compose files, the volumes section.
# www-data is the user with www-data group that web servers such as nginx use by default for normal operations.
# The web server process can access any file that www-data can access (e.g. by ownership)
# So we have to check if all files in $SITE_PATH have the ownership of www-data user and www-data group
# As we added the auth container user and the host machine user to the group www-data,
# we have to set the permissions to 775 so each user can read, write, and execute

#-----------------------------------------------------------------------------------------------------------------------
# set_ownership_permissions explanation:
#-----------------------------------------------------------------------------------------------------------------------
  # chmod 775:
  # owner and group can read, write, and execute;
  # public can read and execute
  # -> THIS WHAT WE NEED because we added the auth container user
  # and the host machine user to the group www-data
  # So each user should be able to read, write, and execute
  #--------------------------------------
  # stat -c "%U" file-or-folder -> see the owner
  # stat -c "%G" file-or-folder -> see the group
  # stat -c "%a" file-or-folder -> see the permissions (e.g. 755)

if [ "$LOG_LEVEL" = "DEBUG" ]; then
  cat /etc/nginx/nginx.conf.gixy
fi

function set_ownership_permissions() {

  PERMISSIONS=$(stat -c "%a" "$1")
  OWNER=$(stat -c "%U" "$1")
  GROUP=$(stat -c "%G" "$1")

  if [ "$OWNER" != "www-data" ] || [ "$GROUP" != "www-data" ]; then
      echo "Changing the owner and the group of $1 to www-data"
      chown -R www-data:www-data "$1"
  fi

  if [ "$PERMISSIONS" -ne 775 ]; then
      echo "Changing the permissions of $1 to 775"
      chmod -R 775 "$1"
  fi
}

set_ownership_permissions "$SITE_PATH"
set_ownership_permissions "$SITE_PATH"/static
set_ownership_permissions "$SITE_PATH"/media
set_ownership_permissions "$SITE_PATH"/errors
#-----------------------------------------------------------------------------------------------------------------------

# Replace the variables in the template and generate a new conf file
#-----------------------------------------------------------------------------------------------------------------------
# Debugging: Check if template file exists
if [ -f /etc/nginx/nginx.conf.template ]; then
	# Replace the variables in the template and generate a new conf file
	echo "Creating nginx configuration file"
	envsubst '${DOMAIN_NAME} ${SITE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
	
	# Delete this file because you don't need it anymore
    echo "Deleting nginx.conf.template"
	rm -f /etc/nginx/nginx.conf.template
fi

echo "Starting nginx in foreground"
#-----------------------------------------------------------------------------------------------------------------------

# Start nginx in foreground mode
#-----------------------------------------------------------------------------------------------------------------------
exec nginx -g 'daemon off;'
