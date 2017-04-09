#!/bin/bash

ENVIROMENT=$1

# If not enviroment is suplied, default will be "dev"
if [ -z "$1"];
then
  ENVIROMENT="dev"
fi

echo "ENVIROMENT: "$ENVIROMENT

# Fix limit on system for watching files
echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf && sysctl -p
npm dedupe

# Start transmission torrent client
service transmission-daemon start
# Start service
pm2 start start.config.json --only downtorrent --env $ENVIROMENT --no-daemon
