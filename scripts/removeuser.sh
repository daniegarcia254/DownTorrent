#!/bin/bash

CONFIG_FILE="/usr/src/app/backend/start.config.json"
USER=$1

docker-compose exec --privileged downtorrent_back deluser --remove-home $USER
docker-compose exec --privileged downtorrent_back sed -i 's/\,\?"'"$USER"'"//g' "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back cat "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back sh restart.sh
