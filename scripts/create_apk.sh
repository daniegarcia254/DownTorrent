#!/bin/bash

docker-compose exec --privileged downtorrent_front bash -c 'cd /usr/src/app && echo "Y" | quasar wrap cordova'
docker-compose exec --privileged downtorrent_front bash -c "cd /usr/src/app/cordova && cordova platform remove android && cordova platform add android && cordova build android"
docker-compose exec --privileged downtorrent_front bash -c "cp /usr/src/app/cordova/platforms/android/build/outputs/apk/android-debug.apk /var/www/html/DownTorrent.apk"
docker-compose exec --privileged downtorrent_front bash -c "cd /usr/src/app"