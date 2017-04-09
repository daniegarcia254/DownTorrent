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

// Configure	backend service URL
var backend_port = BACKEND_PORT_VALUE;
var backend_url_cordova = BACKEND_URL_CORDOVA;
var socket_url = location.protocol + '//' + location.hostname + ':' + backend_port;

if (Platform.Platform.is.cordova) {
	socket_url = backend_url_cordova + ':' + backend_port;
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
