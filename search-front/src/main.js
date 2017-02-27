// === DEFAULT / CUSTOM STYLE ===
// WARNING! always comment out ONE of the two require() calls below.
// 1. use next line to activate CUSTOM STYLE (./src/themes)
require(`./themes/app.${__THEME}.styl`)
// 2. or, use next line to activate DEFAULT QUASAR STYLE
// require(`quasar/dist/quasar.${__THEME}.css`)
// ==============================

import Vue from 'vue'
import Quasar from 'quasar'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import store from './store/store'
import VueLocalStorage from 'vue-localstorage'
import VueSocketio from 'vue-socket.io'

Vue.use(VueSocketio, location.protocol + '//' + location.hostname+':10005');


 
Vue.use(VueLocalStorage)

Vue.use(VueAxios, axios)

Vue.use(Quasar) // Install Quasar Framework

Quasar.start(() => {
	/* eslint-disable no-new */
	new Vue({
		el: '#search-app',
		router,
		store,
		render: h => h(require('./App'))
	})
})
