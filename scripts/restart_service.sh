#!/bin/bash

if [ -z "$1" ]; then
  echo ""
  echo "Please specifiy a container"
  echo ""
  echo "Example: sh restart.sh downtorrent_server_prod"
  echo ""
  exit 1
fi

CONTAINER=$1

docker exec --privileged $CONTAINER sh restart.sh
