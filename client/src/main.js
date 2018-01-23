// === DEFAULT / CUSTOM STYLE ===
// WARNING! always comment out ONE of the two require() calls below.
// 1. use next line to activate CUSTOM STYLE (./src/themes)
require(`./themes/app.${__THEME}.styl`)
// 2. or, use next line to activate DEFAULT QUASAR STYLE
// require(`quasar/dist/quasar.${__THEME}.css`)
// ==============================

import Vue from 'vue'
import Quasar from 'quasar'
import Platform from 'quasar'
import axios from 'axios'
import VueAxios from 'vue-axios'
import store from './store/store'
import VueLocalStorage from 'vue-localstorage'
import VueSocketio from 'vue-socket.io'
import router from './router'

Vue.use(VueLocalStorage)

Vue.use(VueAxios, axios)

// Install Quasar Framework
Vue.use(Quasar)

// Configure server URL
var server_port = SERVER_PORT_VALUE;
var server_url_cordova = SERVER_URL_CORDOVA;
var socket_url = location.protocol + '//' + location.hostname + ':' + server_port;

if (Platform.Platform.is.cordova) {
	socket_url = server_url_cordova + ':' + server_port;
}

// Start socket
Vue.use(VueSocketio, socket_url, store);

// Start app
Quasar.start(() => {
	/* eslint-disable no-new */
	new Vue({
		el: '#search-app',
		router,
		store,
		render: h => h(require('./App'))
	})
})
