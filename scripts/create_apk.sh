#!/bin/bash

# Creates APK
docker exec --privileged downtorrent_client_prod bash -c 'cd /usr/src/app && echo "Y" | quasar wrap cordova'
docker exec --privileged downtorrent_client_prod bash -c "cd /usr/src/app/cordova && cordova platform remove android && cordova platform add android && cordova build android"

# Save APK in Apache server as 'DownTorrent.apk'
docker exec --privileged downtorrent_client_prod bash -c "cp /usr/src/app/cordova/platforms/android/build/outputs/apk/android-debug.apk /var/www/html/DownTorrent.apk"
docker exec --privileged downtorrent_client_prod bash -c "cd /usr/src/app"
