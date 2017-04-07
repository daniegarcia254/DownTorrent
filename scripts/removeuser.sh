#!/bin/bash

# VARS
CONFIG_FILE="/usr/src/app/backend/start.config.json"
USER=$1

#Remove user from system
docker-compose exec --privileged downtorrent_back deluser --remove-home $USER

#Remove user from config file
docker-compose exec --privileged downtorrent_back sed -i 's/\,\?"'"$USER"'"//g' "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back cat "$CONFIG_FILE"

#Restart service
docker-compose exec --privileged downtorrent_back sh restart.sh
