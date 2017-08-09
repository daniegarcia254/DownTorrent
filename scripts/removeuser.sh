#!/bin/bash

# VARS
CONFIG_FILE="/usr/src/app/start.config.json"
USER=$1

#Remove user from system
docker exec --privileged downtorrent_back_prod deluser --remove-home $USER

#Remove user from config file
docker exec --privileged downtorrent_back_prod sed -i 's/\,\?"'"$USER"'"//g' "$CONFIG_FILE"
docker exec --privileged downtorrent_back_prod cat "$CONFIG_FILE"

#Restart service
docker exec --privileged downtorrent_back_prod sh restart.sh
