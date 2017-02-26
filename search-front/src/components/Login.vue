<template>
	<q-layout>
		<!-- Header start -->
		<div slot="header" class="toolbar">
			<button v-if="showBack" class="hide-on-drawer-visible" v-go-back=" '/' ">
				<i class="icon-32">arrow_back</i>
			</button>
			<q-toolbar-title :padding="1">
				{{ $route.name }}
			</q-toolbar-title>
		</div>
		<!-- Header end -->

		<!-- Main block start-->
		<div v-if="!showBack" class="scroll" style="width: 100%">
			<div class="layout-padding">
				<div class="row">
					<div class="text-center auto">
						<p class="caption user-label">Insert your system username</p>
					</div>
				</div>
				<div class="row">
					<div class="text-center auto">
						<input class="user-input" v-model="username">
					</div>
				</div>
				<div class="row">
					<div class="text-center auto">
						<button class="primary circular big login-btn" :disabled="(username.length === 0) ? true : false" @click="login()">
							Go
						</button>
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
import router from '../router'

export default {
	data: function () {
		return {
			username: ''
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
			if (error.response) {
				var status = error.response.status,
						data = error.response.data;
				this.showDialog('Error', 'There has been an error (status: '+status+')</br></br>'+data)
			} if (error.message && error.status) {
				this.showDialog('Error', 'There has been an error (status: '+error.status+')</br></br>'+error.message)
			} else {
				this.showDialog('Error', error.message);
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
					router.push({ path: 'search'})
				}
			}, (err) => {
				console.log("Error login", err);
				Loading.hide()
				if (done) done()
				self.errorHandling(err)
			})
		}
	},
	created: function(){
		if (!this.$store.state.username && this.$localStorage.get('username')!=='') {
			var name = this.$localStorage.get('username')
			this.$store.commit('setUsername', { name })
			this.username = name;
		}
	},
	computed: {
		showBack () {
			return this.$route.path !== '/';
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
</style>
