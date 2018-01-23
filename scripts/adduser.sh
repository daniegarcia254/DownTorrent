#!/bin/bash

#VARS
CONFIG_FILE="/usr/src/app/start.config.json"
USER=$1

#Add user to system
docker exec --privileged downtorrent_server_prod adduser --shell /bin/bash --disabled-password --gecos "" $USER

#Make user home
docker exec --privileged downtorrent_server_prod mkdir "/home/$USER/downloads"

#Create user folder for downloads
docker exec --privileged downtorrent_server_prod chmod -R 0777 "/home/$USER/downloads"
docker exec --privileged downtorrent_server_prod chown $USER:$USER  -R "/home/$USER/downloads"

#Add user to config file
docker exec --privileged downtorrent_server_prod sed -i 's/\("VALID_USERS":\s\[.*\)\]\,/\1\,"'"$USER"'"],/g' "$CONFIG_FILE"
docker exec --privileged downtorrent_server_prod cat "$CONFIG_FILE"

# Restart service
docker exec --privileged downtorrent_server_prod sh restart.sh
