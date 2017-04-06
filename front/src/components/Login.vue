<template>
	<q-layout>
		<!-- Header start -->
		<div slot="header" class="toolbar">
			<button v-if="showMenu" @click="$refs.leftDrawer.open()">
				<i class="icon-32">menu</i>
			</button>
			<q-toolbar-title :padding="1">
				{{ $t($route.name+'.title') }}
			</q-toolbar-title>
			<button v-if="showGoInfo" @click="goInfo()">
				<i class="icon-32">file_download</i>
			</button>
			<button v-if="showGoDownloadLinks" @click="goDownloadLinks()">
				<i class="icon-32">cloud_download</i>
			</button>
		</div>
		<!-- Header end -->

		<!-- Left side Drawer -->
		<q-drawer swipe-only ref="leftDrawer" v-if="showMenu">
			<div class="list no-border">
				<q-drawer-link icon="home" to="/" exact>{{ $t("login.title") }}</q-drawer-link>
				<hr/>
				<q-drawer-link icon="search" to="/search" exact>{{ $t("search.title") }}</q-drawer-link>
				<q-drawer-link icon="file_download" to="/info" exact>{{ $t("info.title") }}</q-drawer-link>
				<q-drawer-link icon="cloud_download" to="/links" exact>{{ $t("links.title") }}</q-drawer-link>
			</div>
		</q-drawer>

		<!-- Main block start-->
		<div v-if="showLogin" class="scroll" style="width: 100%">
			<div class="layout-padding">
				<div class="row">
					<div class="text-center auto">
						<p class="caption user-label">{{ $t("login.message") }}</p>
					</div>
				</div>
				<div class="row">
					<div class="text-center auto">
						<input class="user-input" v-model="username" v-on:keypress.enter="login()">
					</div>
				</div>
				<div class="row">
					<div class="text-center auto">
						<button class="primary circular big login-btn" :disabled="(username.length === 0) ? true : false" @click="login()">
							{{ $t("login.button") }}
						</button>
					</div>
				</div>
				<div class="row" id="row-language-select">
					<div class="text-center auto">
						<p class="caption">{{ $t("login.selectLanguage") }}</p>
						<q-select type="radio" v-model="language" :options="languages" @input="changeLanguage"></q-select>
					</div>
				</div>
			</div>
		</div>
		<!-- Man block end-->

		<!--- Content -->
		<router-view class="layout-view"></router-view>

	</q-layout>
</template>

<script>

import { Platform, Utils, Toast, Loading, Dialog } from 'quasar'
import Vue from 'vue'

export default {
	data: function () {
		return {
			username: '',
			language: 'en',
			languages:[
				{
					label: this.$t("languages.english"),
					value: 'en'
				},
				{
					label: this.$t("languages.spanish"),
					value: 'es'
				}
			]
		}
	},
	localStorage: {
		username: {
			type: String,
			default: ''
		}
	},
	methods: {
		showLoading (message){
			Loading.show({
				message: message,
				messageColor: '#000000',
				spinner: 'circles',
				spinnerSize: 32,
				spinnerColor: '#3636363'
			})
		},
		showDialog(title, message) {
			Dialog.create({
				title: title,
				message: message
			})
		},
		errorHandling(error){
			var error_title = this.$t("login.errors.title");
			if (error.response) {
				var status = error.response.status,
						data = error.response.data;
				this.showDialog(error_title, this.$t("login.errors.messages.base", [status,data]))
			} if (error.message && error.status) {
				this.showDialog(error_title, this.$t("login.errors.messages.base", [error.status,error.message]))
			} else {
				this.showDialog(error_title, error.message);
			}
		},
		login (){
			var self = this,
				name = self.username
			self.showLoading('')
			self.url_login = location.protocol + '//' + location.hostname + ':10005/api/user/login/' + name;
			self.axios.get(encodeURI(self.url_login)).then((response) => {
				Loading.hide()
				if (response.data.error) {
					self.errorHandling(response.data.error)
				} else {
					console.log("Success login", response);
					self.$store.commit('setUsername', { name })
					self.$localStorage.set('username', name)
					self.$router.push({ path: 'search'})
				}
			}, (err) => {
				console.log("Error login", err);
				Loading.hide()
				if (done) done()
				self.errorHandling(err)
			})
		},
		changeLanguage (value) {
			console.log("Change language to", arguments, Vue.config.lang);
			Vue.config.lang = value;
			this.$store.commit('setLanguage', { value })
			this.$localStorage.set('language', value)
			this.language = value
		},
		goInfo () {
			this.$router.push({ path: 'info'})
		},
		goDownloadLinks () {
			this.$router.push({ path: 'links'})
		}
	},
	created: function(){
		if (!this.$store.state.username && this.$localStorage.get('username')!=='') {
			var name = this.$localStorage.get('username')
			this.$store.commit('setUsername', { name })
			this.username = name;
		}
		if (!this.$store.state.language && !this.$localStorage.get('language')) {
			var lang = 'en';
			Vue.config.lang = lang
			this.$store.commit('setLanguage', { lang })
			this.$localStorage.set('language', lang)
			this.language = lang
		} else if (this.$store.state.language !== null) {
			var lang = this.$store.state.language
			Vue.config.lang = lang
			this.$localStorage.set('language', lang)
			this.language = lang
		} else if (this.$localStorage.get('language') !== '') {
			var lang = this.$localStorage.get('language')
			Vue.config.lang = lang
			this.$store.commit('setLanguage', { lang })
			this.language = lang
		}
	},
	computed: {
		showMenu () {
			return this.$route.path !== '/';
		},
		showLogin () {
			return this.$route.path === '/';
		},
		showGoInfo () {
			return this.$route.path === '/search';
		},
		showGoDownloadLinks () {
			return this.$route.path === '/info';
		}
	}
}
</script>

<style lang="styl">
	.user-label
		font-size 20px
		margin-top 50px
	.user-input
		font-size 20px !important
		color grey
		text-align center
	.login-btn
		margin-top 50px
	.toolbar-title
		text-align center
		font-size 25px
	#row-language-select
		margin-top 50px
</style>
