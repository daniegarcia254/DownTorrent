#  DownTorrent
_**DownTorrent**_ is a webapp that simplifies and unifies the process of download a torrent. In the same app you can search for a torrent, get it to download in a torrent client in the same webapp and finally download it to your computer. Besides, you can scan the downloaded torrents with an antivirus.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. You will need some knowledge about linux adminsitration as well the use of AWS.
See deployment for notes on how to deploy the project on a live system. 

### Prerequisites
What things you need to install & run the software.

##### - Ubuntu server
You are going to need at least an _**Ubuntu Server 16.04 LTS (Xenial Xerus)**_ machine (you can use your own or one deployed on an _AWS EC2 instance_ for example). This will be necessary for deploy the backend service, since it will use a command-line based torrent client and a command-line based antivirus, as well as some other command-lines regarding auth.
Of course you can use whatever Linux distribution and version you want, but this one is where the app has been developed and tested.
In your Linux machine, you will need the following programs installed and running.

##### - Transmission BitTorrent Client
_**Transmission**_ is a cross-platform and open source BitTorrent client, designed for easy and powerful use.
In order to install it, you can follow [this tutorial:](https://help.ubuntu.com/community/TransmissionHowTo). You cant totally ignore the part about the Web Interface, the app will only use Transmission from its command-line interface.

##### - ClamAV
_**ClamAV**_ is an open source antivirus engine for detecting trojans, viruses, malware & other malicious threats.
In order to install it, you can use this [interactive tutorial:](https://www.katacoda.com/dgarcia/scenarios/clamav).

##### - Deluge BitTorrent Client (optional)
The backend service can use either the Transmission BitTorrent Client or either Deluge BitTorrent Client for downloading and manage torrents. So if you prefer this one over Transmission, you can install it following [this tutorial](http://dev.deluge-torrent.org/wiki/UserGuide/Service/systemd). The software will be installed and runned as a system daemon, so you can skip the part about the _Deluge Web UI (deluge-web) Service_.

##### - NodeJS and NPM
Install following the steps described in the [node.js web page tutorial](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

#### - AWS S3 bucket
You will need an [AWS](https://aws.amazon.com/) account in order to configure an [S3 bucket](https://aws.amazon.com/s3/?nc1=h_ls) where the torrents will be uploaded. This way we will avoid the need of infinite disk space in our system. It is recommend that you create a new user in your [AWS IAM](https://aws.amazon.com/iam/?nc1=h_ls) with specific permissions to access the S3 bucket, whose keys will be used later in the app configuration.

## Installing
Once you have all the pre-requisites ready, the app can be deployed in order to get a developement enviroment running.

### - Backend
The backend service will be launched and monitored with [PM2](http://pm2.keymetrics.io/), an advanced, production process manager for NodeJS. So, in order to get the backend service running you need to execute the following steps:

**_Step 1:_** Install pm2 package globally
```
sudo npm i -g pm2
```
**_Step 2:_** Now inside the repo 'back/' dir, install the needed packages
```
npm install
```
**_Step 3:_** Configure the service ENV vars in the _start.config.json_ file
```
"APP_PORT": 10005                   // Port where the service will be available
"VALID_USERS": ["user1","user2"],   // Usernames that will have access
"S3_BUCKET": "s3bucket",            // S3 bucket name where the torrents' files will be uploaded
"AWS_ACCESS_KEY_ID": "XXXXXXXXXX",  // Credentials of AWS user with permissions to the S3 bucket
"AWS_SECRET_ACCESS_KEY":"XXXXXX",
"AWS_REGION":"eu-west-1",
"TRANSMISSION_USER":"user",         // Credentials and config for Transmission BitTorrent client
"TRANSMISSION_PWD": "pwd",
"TRANSMISSION_HOST":"localhost",
"TRANSMISSION_PORT":9091
```
**_Step 4:_** Finally, start the service using the provided script
```
sh start.sh
```

**_Note_**: You can access the PM2 logs and check if the service is running without errors:
```
pm2 logs --lines 100 torrent-webapp
```

### - Frontend
The webapp is developed using the [Quasar Framework](http://quasar-framework.org/), that allow us to build responsive websites and hybrid mobile Apps (that look native!) with [VueJs 2](https://vuejs.org/).

**_Step 1:_** First of all, we need to install globally the Quasar CLI
```
sudo npm i -g quasar-cli
```
**_Step 2:_** Now inside the repo 'back/' dir, install the needed packages
```
npm install
```
**_Step 3:_** To start a development server of the app on _https://localhost:10003_, equipped with hot reload, execute inside the _'front/'_ folder the command:
```
quasar dev
```
You also can use [Quasar Play App](http://quasar-framework.org/guide/#Quasar-Play-App) if you want test the app directly in a mobile/tablet device, with hot reload.

## Running the tests
There are no tests implemented so far.

## Deployment
Yet to be deployed and tested on a live system.

## Built With
### - Backend
* [PM2](http://pm2.keymetrics.io/) -  The Node.js process manager to run and monitor the backend service
* [ExpressJS](https://expressjs.com/) - The Node.js framework used for the backend service
* [Socket.IO](https://socket.io/) - JavaScript library for realtime web applications. It enables realtime, bi-directional communication between the web clients and the server.
### - Frontend
* [Quasar Framework](http://quasar-framework.org/) - The web framework used for the frontend
* [VueJS](https://vuejs.org/) - A progressive framework for building user interfaces in which _Quasar Framework_ is based
    * [Vue-router](https://router.vuejs.org/en/) - The official router for Vue.js
    * [Vuex](https://vuex.vuejs.org/en/intro.html) - Vuex is a state management pattern + library for Vue.js applications.
    * [Vue-Socket.io](https://github.com/MetinSeylan/Vue-Socket.io) - socket.io implemantation for vuejs
    * [Vue-i18n](https://github.com/kazupon/vue-i18n) - Internationalization plugin for Vue.js
    * And more VueJS plugins and libraries...
* [Axios](https://github.com/mzabriskie/axios) - Promise based HTTP client for the browser and node.js

## Authors

* **Daniel García** - *Software developer* - [Github](https://github.com/daniegarcia254)

See also the list of [contributors](https://github.com/daniegarcia254/DownTorrent/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
