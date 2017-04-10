#!/bin/bash

BACKEND_PORT=10002
URL_CORDOVA="http:\/\/danigarcia.dev.com"

sed -i 's/BACKEND_PORT_VALUE/'$BACKEND_PORT'/g' src/main.js
sed -i 's/BACKEND_URL_CORDOVA/"'$URL_CORDOVA'"/g' src/main.js
sed -i 's/BACKEND_PORT_VALUE/'$BACKEND_PORT'/g' src/store/store.js
sed -i 's/BACKEND_URL_CORDOVA/"'$URL_CORDOVA'"/g' src/store/store.js

# Start Quasar dev
quasar dev --play
