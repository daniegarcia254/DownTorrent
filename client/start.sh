#!/bin/bash

DEV_SERVER_PORT=10002
PROD_SERVER_PORT=10003
DEV_URL_CORDOVA="http:\/\/danigarcia.dev.com"
PROD_URL_CORDOVA="http:\/\/danigarcia.dev.com"

if [ -z "$1"];
then
  echo "Please choose an enviroment to deploy: dev/prod";
	exit 1;
fi

if [ $1 = "dev" ]; then
	echo "CLIENT: DEPLOY DEVELOPMENT ENVIRONMENT"

	sed -i 's/SERVER_PORT_VALUE/'$DEV_SERVER_PORT'/g' src/main.js
	sed -i 's/SERVER_URL_CORDOVA/"'$DEV_URL_CORDOVA'"/g' src/main.js
	sed -i 's/SERVER_PORT_VALUE/'$DEV_SERVER_PORT'/g' src/store/store.js
	sed -i 's/SERVER_URL_CORDOVA/"'$DEV_URL_CORDOVA'"/g' src/store/store.js

	# Start Quasar dev
	quasar dev --play

elif [ $1 = "prod" ]; then
	echo "CLIENT: DEPLOY PRODUCTION ENVIRONMENT"

	sed -i 's/SERVER_PORT_VALUE/'$PROD_SERVER_PORT'/g' src/main.js
	sed -i 's/SERVER_URL_CORDOVA/"'$PROD_URL_CORDOVA'"/g' src/main.js
	sed -i 's/SERVER_PORT_VALUE/'$PROD_SERVER_PORT'/g' src/store/store.js
	sed -i 's/SERVER_URL_CORDOVA/"'$PROD_URL_CORDOVA'"/g' src/store/store.js
	sed -i 's/'$DEV_SERVER_PORT'/'$PROD_SERVER_PORT'/g' src/main.js
	sed -i 's/'$DEV_SERVER_PORT'/'$PROD_SERVER_PORT'/g' src/store/store.js

	echo "CLIENT: BUILDING QUASAR APP"
	# Build Quasar app
	quasar build

	# Deploy app in Apache server
	echo "CLIENT: DEPLOYING APP IN APACHE SERVER"
	echo "You can access the webapp in: "$PROD_URL_CORDOVA":10005"

	cp -r dist /var/www/html/downtorrent
  cp -r src/statics /var/www/html/

	# Avoid Apache warning
	sed -i 's/# Global configuration/# Global configuration\nServerName downtorrent_client_prod/g' /etc/apache2/apache2.conf

	# Start Apache
	/usr/sbin/apache2ctl -D FOREGROUND

else
	echo "Enviroment "$1" is not a valid one";
	echo "";
	echo "Please choose an valid enviroment to deploy: dev/prod";
	exit 1;
fi
