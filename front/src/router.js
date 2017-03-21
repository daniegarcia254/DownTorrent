import Vue from 'vue'
import VueRouter from 'vue-router'
import locales from './statics/locales.json'
import VueI18n from 'vue-i18n'

Vue.use(VueRouter)

// Install and init i18n
Vue.use(VueI18n)

var lang = 'en';
Vue.config.lang = 'en'
Vue.config.fallbackLang = 'en'

Object.keys(locales).forEach(function (lang) {
  Vue.locale(lang, locales[lang])
})

//Export router
function load (component) {
	return () => System.import(`components/${component}.vue`)
}

export default new VueRouter({
	/*
	 * NOTE! VueRouter "history" mode DOESN'T works for Cordova builds,
	 * it is only to be used only for websites.
	 *
	 * If you decide to go with "history" mode, please also open /config/index.js
	 * and set "build.publicPath" to something other than an empty string.
	 * Example: '/' instead of current ''
	 *
	 * If switching back to default "hash" mode, don't forget to set the
	 * build publicPath back to '' so Cordova builds work again.
	 */

	routes: [{
		path: '/',
		name: Vue.t('login.title'),
		component: load('Login'),
		children: [{
			path: 'search',
			name: 'search',
			component: load('Search')
		},{
			path: 'info',
			name: 'info',
			component: load('Info')
		},{
			path: 'links',
			name: 'links',
			component: load('Links')
		}]
		},{
		path: '*',
		component: load('Error404')
	}]
})
