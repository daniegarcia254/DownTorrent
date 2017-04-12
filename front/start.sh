#!/bin/bash

DEV_BACKEND_PORT=10002
PROD_BACKEND_PORT=10003
DEV_URL_CORDOVA="http:\/\/danigarcia.dev.com"
PROD_URL_CORDOVA="http:\/\/danigarcia.dev.com"

if [ -z "$1"];
then
  echo "Please choose an enviroment to deploy: dev/prod";
	exit 1;
fi

if [ $1 = "dev" ]; then
	echo "FRONT: DEPLOY DEVELOPMENT ENVIRONMENT"

	sed -i 's/BACKEND_PORT_VALUE/'$DEV_BACKEND_PORT'/g' src/main.js
	sed -i 's/BACKEND_URL_CORDOVA/"'$DEV_URL_CORDOVA'"/g' src/main.js
	sed -i 's/BACKEND_PORT_VALUE/'$DEV_BACKEND_PORT'/g' src/store/store.js
	sed -i 's/BACKEND_URL_CORDOVA/"'$DEV_URL_CORDOVA'"/g' src/store/store.js

	# Start Quasar dev
	quasar dev --play

elif [ $1 = "prod" ]; then
	echo "FRONT: DEPLOY PRODUCTION ENVIRONMENT"

	sed -i 's/BACKEND_PORT_VALUE/'$PROD_BACKEND_PORT'/g' src/main.js
	sed -i 's/BACKEND_URL_CORDOVA/"'$PROD_URL_CORDOVA'"/g' src/main.js
	sed -i 's/BACKEND_PORT_VALUE/'$PROD_BACKEND_PORT'/g' src/store/store.js
	sed -i 's/BACKEND_URL_CORDOVA/"'$PROD_URL_CORDOVA'"/g' src/store/store.js
	sed -i 's/'$DEV_BACKEND_PORT'/'$PROD_BACKEND_PORT'/g' src/main.js
	sed -i 's/'$DEV_BACKEND_PORT'/'$PROD_BACKEND_PORT'/g' src/store/store.js

	echo "FRONT: BUILDING QUASAR APP"
	# Build Quasar app
	quasar build

	# Deploy app in Apache server
	echo "FRONT: DEPLOYING APP IN APACHE SERVER"
	echo "You can access the webapp in: "$PROD_URL_CORDOVA":10005"

	cp -r dist /var/www/html/downtorrent
  cp -r src/statics /var/www/html/

	# Avoid Apache warning
	sed -i 's/# Global configuration/# Global configuration\nServerName downtorrent_front_prod/g' /etc/apache2/apache2.conf

	# Start Apache
	/usr/sbin/apache2ctl -D FOREGROUND

else
	echo "Enviroment "$1" is not a valid one";
	echo "";
	echo "Please choose an valid enviroment to deploy: dev/prod";
	exit 1;
fi
