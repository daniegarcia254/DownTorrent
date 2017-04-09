#!/bin/bash

# Start a Node.js local development server on 'localhost:10004'
docker-compose exec --privileged downtorrent_front bash -c 'cd /usr/src/app && quasar dev --play'
