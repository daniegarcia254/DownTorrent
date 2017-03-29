<template>
	<q-layout>
		<!-- Main block start-->
		<div class="scroll" style="width: 100%">
			<div class="layout-padding">
				<div class="row" style="margin-top: 30px;">
					<q-data-table :data="info_result" :config="config" :columns="columns" @refresh="refresh">
						<template slot="col-name" scope="cell">
							{{cell.data}}<q-tooltip>{{cell.data}}</q-tooltip>
						</template>
						<template slot="col-progress" scope="cell">
							<q-progress
								v-if="cell.row.status === 'Downloading'"
								:percentage="cell.data"
								class="stripe animate positive" style="height: 15px">
							</q-progress>
							<q-progress
								v-if="cell.row.status === 'Error'"
								:percentage="cell.data"
								class="stripe negative" style="height: 15px">
							</q-progress>
							<q-progress
								v-if="cell.row.status === 'Completed'"
								:percentage="cell.data"
								class="stripe positive" style="height: 15px">
							</q-progress>
							<q-progress
								v-if="cell.row.status !== 'Downloading' && cell.row.status !== 'Error' && cell.row.status !== 'Completed'"
								:percentage="cell.data"
								class="stripe warning" style="height: 15px">
							</q-progress>
						</template>
						<template slot="selection" scope="props">
							<button class="primary clear" @click="deleteTorrent(props)" v-if="props.rows[0]">
								<i>delete</i>
							</button>
							<button class="primary clear" @click="pauseTorrent(props)" v-if="props.rows[0] && (props.rows[0].data.status === 'Downloading' || props.rows[0].data.status === 'Checking')">
								<i>pause</i>
							</button>
							<button class="primary clear" @click="resumeTorrent(props)" v-if="props.rows[0] && props.rows[0].data.status === 'Paused'">
								<i>play_arrow</i>
							</button>
							<button class="primary clear" @click="scan(props)" v-if="props.rows[0] && (props.rows[0].data.status === 'Seeding' || props.rows[0].data.status === 'Completed')">
								<i>remove_red_eye</i>
							</button>
							<button class="primary clear" @click="upload(props)" v-if="props.rows[0] && (props.rows[0].data.status === 'Seeding' || props.rows[0].data.status === 'Completed')">
								<i>cloud_upload</i>
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
	sockets:{
		connect: function(){
			console.log('socket connected')
		},
		info: function(torrents){
			if (torrents.error) {
				console.log('sockets: info error',torrents)
				this.showError(torrents.error, this.$t("info.errors.actions.load"), true)
				this.closeInfoSocket()
			} else {
				//console.log('sockets: info',torrents)
				this.info_result = torrents;
			}
		},
		pause: function(data){
			console.log('sockets: pause',data)
			var self = this;
			if (data.error) {
				console.log('sockets: pause error',data)
				this.showError(data.error, this.$t("info.errors.actions.pause"), false)
				this.getInfo()
			} else {
				this.getInfo()
				Toast.create({
					html: self.$t("info.success.pauseTorrent"),
					timeout: 5000
				})
			}
		},
		resume: function(data){
			console.log('sockets: resume',data)
			var self = this;
			if (data.error) {
				console.log('sockets: resume error',data)
				this.showError(data.error, this.$t("info.errors.actions.resume"), false)
				this.getInfo()
			} else {
				this.getInfo()
				Toast.create({
					html: self.$t("info.success.resumeTorrent"),
					timeout: 5000
				})
			}
		},
		delete: function(data){
			console.log('sockets: delete',data);
			var self = this;
			if (data.error) {
				console.log('sockets: delete error',data)
				this.showError(data.error, this.$t("info.errors.actions.delete"), false)
				this.getInfo()
			} else {
				this.getInfo()
				Toast.create({
					html: self.$t("info.success.deleteTorrent"),
					timeout: 5000
				})
			}
		},
		scan: function(data){
			console.log('sockets: scan',data);
			var self = this;
			self.getInfo()
			if (self.progressDialog !== null) self.progressDialog.close();
			if (data.error) {
				self.showError(data.error, self.$t("info.errors.actions.scan"), false)
			} else {
				console.log("Success scanning", data);
				if (data.bad_files && data.bad_files.length > 0) {
					Toast.create({
						html: self.$t("info.success.scanVirusDeleted"),
						timeout: 5000
					})
				} else {
					Toast.create({
						html: self.$t("info.success.scanVirus"),
						timeout: 5000
					})
				}
			}
		},
		upload: function(data){
			console.log('sockets: upload',data);
			var self = this;
			self.getInfo();
			if (self.progressDialog !== null) self.progressDialog.close();
			if (data.error) {
				self.showError(data.error, self.$t("info.errors.actions.upload"), false)
			} else {
				console.log("Success uploading", data);
				Toast.create({
					html: self.$t("info.success.uploadTorrent"),
					timeout: 5000
				})
				self.$router.push({ path: 'links'})
			}
		},
		progress: function(data){
			this.progress.model = parseFloat(data.progress);
		},
		closeInfoSocket: function(data){
			console.log('sockets: info closed',data)
		}
	},
	methods: {
		getInfo: function(val){
			var client = this.$store.state.client;
			this.$socket.emit('getInfo', client)
		},
		startInfoInterval: function(val){
			var client = this.$store.state.client;
			this.$socket.emit('startInfoInterval', client)
		},
		closeInfoSocket: function(val){
			this.$socket.emit('closeInfoSocket', val)
		},
		refresh: function(done) {
			this.closeInfoSocket()
			this.getInfo()
			this.startInfoInterval()
			done();
		},
		pauseTorrent: function(props){
			console.log("pause", props)
			var torrent = props.rows[0].data;
			this.showConfirmDialog('pause', torrent, {id: torrent.id});
		},
		resumeTorrent: function(props){
			console.log("resume", props)
			var torrent = props.rows[0].data;
			this.showConfirmDialog('resume', torrent, {id: torrent.id});
		},
		deleteTorrent: function(props){
			console.log("delete", props)
			var torrent = props.rows[0].data;
			if (torrent.status === 'Completed' || torrent.status === 'Seeding') {
				this.showConfirmDeleteDialog(torrent, {id: torrent.id, status: torrent.status});
			} else {
				this.showConfirmDialog('delete', torrent, {id: torrent.id, status: torrent.status});
			}
		},
		scan: function(props){
			console.log("scan", props)
			var self = this;
			var torrent = props.rows[0].data;
			var username = self.$store.state.username;
			self.showConfirmDialog('scan', torrent, {username: username, torrent: torrent});
		},
		upload: function(props) {
			console.log("upload", props)
			var self = this;
			var torrent = props.rows[0].data;
			var username = self.$store.state.username;
			self.showConfirmDialog('upload', torrent, {username: username, torrent: torrent});
		},
		showError: function(error, action, ret) {
			var message = this.$t("info.errors.messages.base",[action,error.status,error.message]);
			this.showDialog(this.$t("info.errors.title"), message, ret);
		},
		showDialog: function(title, message, ret) {
			var self = this;
			Dialog.create({
				title: title,
				message: message,
				buttons: [
					{
						label: self.$t("info.dialog.okBtn"),
						handler () {
							if (ret === true) router.push({ path: 'search'})
						}
					}
				]
			})
		},
		showConfirmDialog(action, torrent, data) {
			var self = this;
			Dialog.create({
				title: self.$t("info.dialog.title"),
				message: self.$t("info.dialog.message",[self.$t("info.dialog.actions."+action),torrent.name]),
				buttons: [
					{
						label: self.$t("info.dialog.cancelBtn"),
						classes: 'tertiary',
						style: 'width: 100px; margin-right: 30px;'
					},
					{
						label: self.$t("info.dialog.okBtn"),
						classes: 'positive',
						style: 'width: 100px; margin-right: 40px;',
						handler () {
							if (action === 'delete' && self.$store.state.client === 'transmission') {
								data['client'] = self.$store.state.client;
								data['remove_data'] = true;
								self.$socket.emit(action, data)
							}
							else {
								data['client'] = self.$store.state.client;
								self.$socket.emit(action, data)
							}
							if (action === 'upload' || action === 'scan') {
								self.showProgressDialog(action);
							}
						}
					}
				]
			})
		},
		showConfirmDeleteDialog(torrent, data) {
			var self = this;
			Dialog.create({
				title: self.$t("info.dialog-delete.title"),
				message: self.$t("info.dialog-delete.message",[torrent.name]),
				buttons: [
					{
						label: self.$t("info.dialog-delete.deleteBtn"),
						classes: 'warning',
						style: 'width: 220px; margin-right: 30px;',
						handler () {
							data['client'] = self.$store.state.client;
							self.$socket.emit('delete', data)
						}
					},
					{
						label: self.$t("info.dialog-delete.deleteAllBtn"),
						classes: 'negative',
						style: 'width: 220px; margin-right: 40px;',
						handler () {
							data['client'] = self.$store.state.client;
							data['remove_data'] = true;
							self.$socket.emit('delete', data)
						}
					},
					{
						label: self.$t("info.dialog-delete.cancelBtn"),
						classes: 'tertiary',
						style: 'width: 100px; margin-right: 30px;'
					}
				]
			})
		},
		showProgressDialog (action) {
			var self = this;
			var progress = this.progress;
			var dialogObject = {
				title: self.$t("info.dialog-"+action+".title"),
				message: self.$t("info.dialog-"+action+".message"),
				buttons: [],
				progress,
				noBackdropDismiss: true,
				noEscDismiss: true
			}
			if (action === 'scan') {
				dialogObject.progress = { indeterminate: true }
			}
			self.progressDialog = Dialog.create(dialogObject)
		},
		showLoading (message){
			Loading.show({
				message: message,
				messageColor: '#000000',
				spinner: 'circles',
				spinnerSize: 32,
				spinnerColor: '#3636363'
			})
		}
	},
	created: function(){
		if (!this.$store.state.username && this.$localStorage.get('username')!=='') {
			var name = this.$localStorage.get('username')
			this.$store.commit('setUsername', { name })
		}
		this.closeInfoSocket()
		this.getInfo()
		this.startInfoInterval()
	},
	destroyed: function(){
		this.closeInfoSocket()
	},
	data: function () {
		return {
			info_result: [],
			progressDialog: null,
			progress: {
				model: 0
			},
			config: {
				title: this.$t("info.table.title"),
				refresh: true,
				columnPicker: false,
				leftStickyColumns: 0,
				rightStickyColumns: 0,
				rowHeight: 'auto',
				responsive: true,
				selection: 'single',
				messages: {
					noData: this.$t("info.table.noData")
				}
			},
			sizeColumnDeluge: {
				label: this.$t("info.table.fields.size"),
				field: 'size',
				width: '50px',
				format (value,row) {
					return [value.value,value.measure].join(' ')
				},
				sort (a,b) {
					var a_temp = a.split(' '),
							b_temp = b.split(' '),
							a_value = parseFloat(a_temp[0]),
							b_value = parseFloat(b_temp[0])

					switch (a_temp[1]) {
						case 'MiB': a_value = a_value * 1024; break;
						case 'GiB': a_value = a_value * 1024 * 1024; break;
					}
					switch (b_temp[1]) {
						case 'MiB': b_value = b_value * 1024; break;
						case 'GiB': b_value = b_value * 1024 * 1024; break;
					}

					return a_value - b_value;
				}
			},
			columnsData: [
				{
					label: this.$t("info.table.fields.name"),
					field: 'name',
					width: '180px',
					sort: true
				},{
					label: this.$t("info.table.fields.size"),
					field: 'size',
					width: '50px'
				},{
					label: this.$t("info.table.fields.status"),
					field: 'status',
					width: '50px',
					sort: true
				},{
					label: this.$t("info.table.fields.progress"),
					field: 'progress',
					width: '150px',
					sort: false
				},{
					label: this.$t("info.table.fields.speed"),
					field: 'speed',
					width: '50px',
					sort: false
				},{
					label: this.$t("info.table.fields.eta"),
					field: 'eta',
					width: '50px',
					sort: false
				}
			],
			pagination: false,
			rowHeight: 'auto',
			bodyHeightProp: 'auto',
			bodyHeight: 'auto'
		}
	},
	computed: {
		columns: {
			get () {
				switch(this.$store.state.client) {
					case 'deluge': {
						this.columnsData[1] = this.sizeColumnDeluge;
						return this.columnsData;
						break;
					}
					case 'transmission':
					default: {
						return this.columnsData;
						break;
					}
				}
			}
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
