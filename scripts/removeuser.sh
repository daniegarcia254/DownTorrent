#!/bin/bash

# VARS
CONFIG_FILE="/usr/src/app/backend/start.config.json"
USER=$1

#Remove user from system
docker-compose exec --privileged downtorrent_back_prod deluser --remove-home $USER

#Remove user from config file
docker-compose exec --privileged downtorrent_back_prod sed -i 's/\,\?"'"$USER"'"//g' "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back_prod cat "$CONFIG_FILE"

#Restart service
docker-compose exec --privileged downtorrent_back_prod sh restart.sh
