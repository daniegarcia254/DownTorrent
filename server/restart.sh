#!/bin/bash

echo "Force restart of server,.."

pm2 restart downtorrent start.config.json --update-env

echo "Server restarted!!!"
