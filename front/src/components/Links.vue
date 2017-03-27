<template>
	<q-layout>
		<!-- Main block start-->
		<div class="scroll" style="width: 100%">
			<div class="layout-padding">
				<div class="row" style="margin-top: 30px;">
					<q-data-table :data="links_result" :config="config" :columns="columns" @refresh="refresh">
						<template slot="col-key" scope="cell">
							{{cell.data}}<q-tooltip>{{cell.data}}</q-tooltip>
						</template>
						<template slot="selection" scope="props">
							<button class="primary clear" @click="confirmDelete(props)">
								<i>delete</i>
							</button>
							<button class="primary clear" @click="openLink(props)">
								<i>cloud_download</i>
							</button>
						</template>
					</q-data-table>
				</div>
			</div>
		</div>
		<!-- Man block end-->
	</q-layout>
</template>

<script>

import { Platform, Utils, Toast, Loading, Dialog } from 'quasar'
import router from '../router'

export default {
	methods: {
		getLinks: function(done){
			var self = this,
				username = self.$store.state.username
			self.showLoading('')
			var url = location.protocol + '//' + location.hostname + ':10005/api/links/' + username;
			self.axios.get(encodeURI(url)).then((response) => {
				Loading.hide()
				if (done) done()
				if (response.data.error) {
					self.errorHandling(response.data.error)
				} else {
					console.log("Success getting links", response);
					self.links_result = response.data;
				}
			}, (err) => {
				console.log("Error getting links", err);
				Loading.hide()
				if (done) done()
				self.errorHandling(err)
			})
		},
		confirmDelete: function(props){
			var self = this,
				username = self.$store.state.username,
				fileObject = props.rows[0].data,
				file = fileObject.Key.split('/')[1]

			Dialog.create({
				title: self.$t("links.dialog-delete.title"),
				message: self.$t("links.dialog-delete.message",[file]),
				buttons: [
					{
						label: self.$t("links.dialog-delete.cancelBtn"),
						classes: 'tertiary',
						style: 'width: 100px; margin-right: 30px;'
					},
					{
						label: self.$t("links.dialog-delete.okBtn"),
						classes: 'positive',
						style: 'width: 100px; margin-right: 40px;',
						handler () {
							self.deleteS3Object(username, file);
						}
					}
				]
			})
		},
		deleteS3Object: function(username, file){
			var self = this;
			self.showLoading('')
			var url = location.protocol + '//' + location.hostname + ':10005/api/links/' + username + '/' + file;
			self.axios.delete(encodeURI(url)).then((response) => {
				Loading.hide()
				self.refresh()
				if (response.data.error) {
					self.errorHandling(response.data.error)
				} else {
					console.log("Success deleting links object", response)
					Toast.create({
						html: self.$t("links.success.deleting"),
						timeout: 5000
					})
				}
			}, (err) => {
				console.log("Error deleting link object", err);
				Loading.hide()
				self.errorHandling(err)
				self.refresh()
			})
		},
		openLink: function(props){
			var self = this,
				username = self.$store.state.username,
				fileObject = props.rows[0].data,
				file = fileObject.Key.split('/')[1]

			self.showLoading('')
			var url = location.protocol + '//' + location.hostname + ':10005/api/links/' + username + '/' + file;
			self.axios.get(encodeURI(url)).then((response) => {
				Loading.hide()
				self.refresh()
				if (response.data.error) {
					self.errorHandling(response.data.error)
				} else {
					console.log("Success opening link", response);
					Utils.openURL(response.data)
				}
			}, (err) => {
				console.log("Error opening link", err);
				Loading.hide()
				self.refresh()
				self.errorHandling(err)
			})
		},
		errorHandling(error){
			var error_title = this.$t("links.errors.title");
			if (error.response) {
				var status = error.response.status,
						data = error.response.data;
				this.showDialog(error_title, this.$t("links.errors.messages.base", [status,data]))
			} else if (error.message && error.status) {
				this.showDialog(error_title, this.$t("links.errors.messages.base", [error.status,error.message]))
			} else {
				this.showDialog(error_title, error.message);
			}
		},
		refresh: function(done) {
			this.getLinks(done)
		},
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
		}
	},
	created: function(){
		if (!this.$store.state.username && this.$localStorage.get('username')!=='') {
			var name = this.$localStorage.get('username')
			this.$store.commit('setUsername', { name })
		}
		this.getLinks(null)
	},
	data: function () {
		return {
			links_result: [],
			config: {
				title: this.$t("info.table.title"),
				refresh: true,
				columnPicker: false,
				leftStickyColumns: 0,
				rightStickyColumns: 0,
				rowHeight: 'auto',
				responsive: true,
				selection: 'single',
				pagination: {
					rowsPerPage: 10,
					options: [5, 10, 15, 30]
				},
				messages: {
					noData: this.$t("links.table.noData")
				}
			},
			columns: [
				{
					label: this.$t("links.table.fields.name"),
					field: 'Key',
					width: '180px',
					sort: true,
					format (value, row) {
			      return value.split('/')[1]
			    }
				},{
					label: this.$t("links.table.fields.lastModified"),
					field: 'LastModified',
					width: '80px'
				},{
					label: this.$t("links.table.fields.size"),
					field: 'Size',
					width: '50px',
					sort: true
				}
			],
			pagination: true,
			rowHeight: 'auto',
			bodyHeightProp: 'auto',
			bodyHeight: 'auto'
		}
	},
	watch: {
		pagination (value) {
			if (!value) {
				this.oldPagination = Utils.clone(this.config.pagination)
				this.pagination = false
				return
			}
			this.config.pagination = this.oldPagination
		}
	}
}
</script>

<style lang="styl">
	.icon-32
		font-size 32px
	.toolbar-title
		text-align center
		font-size 25px
	.layout-padding
		padding-bottom 50px !important
	.scroll
		width: 100%;
	.q-data-table
		width 100%
	.q-data-table table tr
		height 56px !important
</style>
