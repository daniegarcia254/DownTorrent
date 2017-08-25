#  DownTorrent
_**DownTorrent**_ is a webapp that simplifies and unifies the process of download a torrent. In the same app you can:
* Search for a torrent in The Pirate Bay
* Download and manage (delete, pause, resume) the torrent as well as watch the download progress
* Scan the downloaded torrents with an antivirus if you want to make sure it is free of viruses
* Upload the torrents to a S3 bucket, and download them anytime you want

## Motivation
This project is motived by the need of some relatives to download films, books, etc. from the internet without the difficulty of search for it in the browser (as well to avoid all the advertising these kind of pages produce), know how to add it to a torrent client and use that torrent client. The fact of have it all in the same app, make it easier for them.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. You will need some knowledge about linux administration as well the use of AWS and Docker.

### Prerequisites
What do you need to install && run the software.

#### - Ubuntu/Debian server
You are going to need at least an _**Ubuntu or Debain**_ machine (you can use your own or one deployed on an _AWS EC2 instance_ for example) for test, develope and deploy the app.
Of course you can use any Linux distribution and version you want, but these are the ones where the app has been developed and tested.
In your Linux machine, you will need the following programs installed and running.

#### - Docker
_**Docker**_ provides a way to run applications securely isolated in a container, packaged with all its dependencies and libraries.
You can follow the [official tutorial](https://docs.docker.com/engine/installation/) to install it in your system.

You will also need to install [Docker-compose](https://docs.docker.com/compose/install/).

#### - AWS S3 bucket
You will need an [AWS](https://aws.amazon.com/) account in order to configure an [S3 bucket](https://aws.amazon.com/s3/?nc1=h_ls) where the torrents will be uploaded. This way we will avoid the need of infinite disk space in our system. It is recommend that you create a new user in your [AWS IAM](https://aws.amazon.com/iam/?nc1=h_ls) with specific permissions to access the S3 bucket, whose keys will be used later in the app configuration.

#### - Others
* _**Transmission**_ is a cross-platform and open source BitTorrent client, designed for easy and powerful use.
* _**ClamAV**_ is an open source antivirus engine for detecting trojans, viruses, malware & other malicious threats.

These programs are already installed in the Docker images.

## Configuration
Once you have all the pre-requisites ready, the app can be configured in order to get a development or production enviroment running.

### Development enviroment
* **_[development.yml](development.yml)_**: ports that will be exposed in the docker containers
  * Default backend port: 10002
  * Default backend port: 10004
  * Default trasmission port: 9090
* **_[front/start-dev.sh](front/start-dev.sh)_**: in this script you can configure two values
  * _BACKEND_PORT_VALUE_: Port where the back service will be available (default value: 10002)
  * _BACKEND_URL_CORDOVA_: URL for the back service when the app is running with cordova
* **_[Dockerfile-back.dev](Dockerfile-back.dev)_**: Transmission torrent client port, username and password config
  * Default tranmission port: 9090
  * Default transmission user: trsuer
  * Default transmission user: trpwd
### Production enviroment
* **_[production.yml](production.yml)_**: ports that will be exposed in the docker containers
  * Default backend port: 10003
  * Default backend port: 10005 (in this case it will be mapping the container Apache port 80)
  * Default trasmission port: 9090
* **_[Dockerfile-back.prod](Dockerfile-back.prod)_**: Transmission torrent client port, username and password config
  * Default tranmission port: 9090
  * Default transmission user: trsuer
  * Default transmission user: trpwd
* **_[Dockerfile-front.prod](Dockerfile-front.prod)_**: here you can configure the following values
  * _BACKEND_PORT_VALUE_: Port where the back service will be available (default value: 10003)
  * _BACKEND_URL_CORDOVA_: URL for the back service when the app is running with cordova
### Backend configuration for development and production enviroment
* **_[back/start.config.json](back/start.config.json)_**: config file that PM2 will use to launch the service
  * APP_PORT: Port where the service will be listening
  * S3_BUCKET: AWS S3 bucket name where the torrents will be uploaded and stored
  * AWS_ACCESS_KEY_ID: AWS Access Key of the user with write access to the S3 bucket
  * AWS_SECRET_ACCESS_KEY: AWS Secret Access Key of the user with write access to the S3 bucket
  * AWS_REGION: AWS Region of the S3 bucket
  * TRANSMISSION_USER: Default user for transmission torrent client
  * TRANSMISSION_PWD: Default password for transmission torrent client
  * TRANSMISSION_HOST: Default host for transmission torrent client
  * TRANSMISSION_PORT: Default port for transmission torrent client

The Transmission torrent client values must mutch those specified in the corresponding Dockerfile-back as well as the backend service port.

## Deployment
### Development enviroment
In order to get running a development enviroment, you just need to execute:
```
docker-compose -f development.yml up --build
```
A docker container will be running and every change that you make in the _front_ or _back_ folder will be automatically applied, so you can programme in a hot reload development enviroment.

### Production enviroment
In order to get running a prouction enviroment, you just need to execute:
```
docker-compose -f production.yml up --build
```

### Production scripts
You can make use of various [scripts](scripts) that can be applied to the production running containers. Following a sort description of each script functionality:
* [adduser.sh](scripts/adduser.sh): it adds a new user to the app, so it can be logged in.
* [removeuser.sh](scripts/removeuser.sh): removes an user from the app, so it can't login again.
* [restart_service.sh](scripts/restart_service.sh): force a restart of the backend service
* [create_apk.sh](scripts/create_apk.sh): creates an unsigned Android APK file to download and install in your mobile device. The file will be available in the Apache server (with the configured port) as "DownTorrent.apk"

## Testing

Testing is implemented for the backend using Mocha, Chai && Sinon.

Run the tests:
```
cd back
npm test
```

Testing coverage can be generated using Istanbul:
```
cd back
npm run coverage
```

## Roadmap
Some features to implement for improve the app in a near future. Feel free to contribute to the project in order to complete them:
* Create a Dockerfile to deploy the app in a simpler way and get it running instantly <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStLWRMwSAjaGCSxH_vO-G8JhgSlrWevy8gUqvz8WXce3Z6-_lBaQ"> <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStLWRMwSAjaGCSxH_vO-G8JhgSlrWevy8gUqvz8WXce3Z6-_lBaQ">
* Add real Authentication to the system, no using one based on the Ubuntu system users. Using a database and JSON Web Tokens for example.
* Review and improve the mobile version. For example: data tables are not loading information properly.
* Automatically upload the downloaded torrents to the S3 bucket. It can be done with [Transmission](https://www.npmjs.com/package/transmission#transmissionwaitforstateid-targetstate-callback).
* As only one instance of the bittorent client is running in the machine, all users can see all downloads. So, it would be ideal if each user only could see and manage its own torrents.
* Testing <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStLWRMwSAjaGCSxH_vO-G8JhgSlrWevy8gUqvz8WXce3Z6-_lBaQ">

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
