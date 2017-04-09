#!/bin/bash

BACKEND_PORT=10005
BACKEND_URL="http:\/\/danigarcia-dev.com"

# Config BACKEND DEV enviroment

# BACKEND: Start dev service
docker-compose exec --privileged downtorrent_front bash -c 'sed -i "s/BACKEND_PORT_VALUE/'$BACKEND_PORT'/g" /usr/src/dev/src/main.js'


# Config FRONTEND DEV enviroment
docker-compose exec --privileged downtorrent_front bash -c 'sed -i "s/BACKEND_PORT_VALUE/'$BACKEND_PORT'/g" /usr/src/dev/src/main.js'
docker-compose exec --privileged downtorrent_front bash -c 'sed -i "s/BACKEND_URL_VALUE/\"'$BACKEND_URL'\"/g" /usr/src/dev/src/main.js'
docker-compose exec --privileged downtorrent_front bash -c 'sed -i "s/BACKEND_PORT_VALUE/'$BACKEND_PORT'/g" /usr/src/dev/src/store/store.js'
docker-compose exec --privileged downtorrent_front bash -c 'sed -i "s/BACKEND_URL_VALUE/\"'$BACKEND_URL'\"/g" /usr/src/dev/src/store/store.js'

# FRONTEND: Start a Node.js local development server on 'localhost:10004'
docker-compose exec --privileged downtorrent_front bash -c 'cd /usr/src/dev && quasar dev --play'
