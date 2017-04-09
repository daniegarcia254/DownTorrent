#!/bin/bash

sed -i 's/BACKEND_PORT_VALUE/10002/g' src/main.js
sed -i 's/BACKEND_URL_CORDOVA/"http\/\/danigarcia-dev.com"/g' src/main.js
sed -i 's/BACKEND_PORT_VALUE/10002/g' src/store/store.js
sed -i 's/BACKEND_URL_CORDOVA/"http\/\/danigarcia-dev.com"/g' src/store/store.js

# Start Quasar dev
quasar dev --play
