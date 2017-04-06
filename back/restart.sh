#/bin/bash

echo "Force restart of service..."

pm2 restart start.config.json --update-env

echo "Service restarted!!!"
