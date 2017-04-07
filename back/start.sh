#!/bin/bash

# Config
sed -i 's/localhost/downtorrent_back/g' start.config.json
sed -i 's/9091/9090/g' start.config.json

# Start transmission torrent client
service transmission-daemon start

# Start service
pm2 start start.config.json --only downtorrent --env local --no-daemon
