#!/bin/bash

echo "Force restart of service..."

pm2 restart downtorrent start.config.json --update-env

echo "Service restarted!!!"
