#!/bin/bash

CONFIG_FILE="/usr/src/app/backend/start.config.json"
USER=$1

docker-compose exec --privileged downtorrent_back adduser --shell /bin/bash --disabled-password --gecos "" $USER
docker-compose exec --privileged downtorrent_back mkdir "/home/$USER/downloads"
docker-compose exec --privileged downtorrent_back chmod -R 0777 "/home/$USER/downloads"
docker-compose exec --privileged downtorrent_back chown $USER:$USER  -R "/home/$USER/downloads"
docker-compose exec --privileged downtorrent_back sed -i 's/\("VALID_USERS":\s\[.*\)\]\,/\1\,"'"$USER"'"],/g' "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back cat "$CONFIG_FILE"
docker-compose exec --privileged downtorrent_back sh restart.sh
