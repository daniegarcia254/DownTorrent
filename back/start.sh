#!/bin/bash

if [ -z "$1"];
then
  echo "Please choose an enviroment to deploy: dev/prod";
	exit 1;
elif [ "$1" = "dev"];
then
	echo "BACKEND: DEPLOYING DEVELOPMENT ENVIRONMENT";
elif [ "$1" = "prod" ];
then
	echo "BACKEND: DEPLOYING PRODUCTION ENVIRONMENT";
else
	echo "Enviroment "$1" is not a valid one."
	echo "Please chose a valid envoriment: dev/prod"
	exit 1;
fi

ENVIRONMENT=$1

# Fix limit on system for watching files
echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf && sysctl -p
npm dedupe

# Start transmission torrent client
echo "BACKEND: STARTING TRANSMISSION-DAEMON"
service transmission-daemon start

# Start service
echo "BACKEND: STARTING SERVICE WITH PM2"
pm2 start start.config.json --only downtorrent --env $ENVIRONMENT --no-daemon
