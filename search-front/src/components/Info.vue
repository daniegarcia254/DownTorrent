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
							<button class="primary clear" @click="pauseTorrent(props)" v-if="props.rows[0] && props.rows[0].data.status === 'Downloading'">
								<i>pause</i>
							</button>
							<button class="primary clear" @click="resumeTorrent(props)" v-if="props.rows[0] && props.rows[0].data.status === 'Paused'">
								<i>play_arrow</i>
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

import { Utils, Toast, Loading, Dialog } from 'quasar'
import router from '../router'

export default {
	sockets:{
		connect: function(){
			console.log('socket connected')
		},
		info: function(torrents){
			if (torrents.error) {
				console.log('sockets: info error',torrents)
				this.showSocketError(torrents.error, 'loading torrents info', true)
				this.$socket.emit('closeInfoSocket', null)
			} else {
				console.log('sockets: info',torrents)
				this.info_result = torrents;
			}
		},
		pause: function(data){
			console.log('sockets: pause',data)
			if (data.error) {
				console.log('sockets: pause error',data)
				this.showSocketError(data.error, 'pausing torrent', false)
				this.$socket.emit('getInfo')
			} else {
				this.$socket.emit('getInfo')
				Toast.create({
					html: 'Torrent successfully paused',
					timeout: 5000
				})
			}
		},
		resume: function(data){
			console.log('sockets: resume',data)
			if (data.error) {
				console.log('sockets: resume error',data)
				this.showSocketError(data.error, 'resuming torrent', false)
				this.$socket.emit('getInfo')
			} else {
				this.$socket.emit('getInfo')
				Toast.create({
					html: 'Torrent successfully resumed',
					timeout: 5000
				})
			}
		},
		delete: function(data){
			console.log('sockets: delete',data)
			if (data.error) {
				console.log('sockets: delete error',data)
				this.showSocketError(data.error, 'deleting torrent', false)
				this.$socket.emit('getInfo')
			} else {
				this.$socket.emit('getInfo')
				Toast.create({
					html: 'Torrent successfully deleted',
					timeout: 5000
				})
			}
		},
		closeInfoSocket: function(data){
			console.log('sockets: info closed',data)
		}
	},
	methods: {
		getInfo: function(val){
			this.$socket.emit('getInfo', val)
		},
		startInfoInterval: function(val){
			this.$socket.emit('startInfoInterval', val)
		},
		closeInfoSocket: function(val){
			this.$socket.emit('closeInfoSocket', val)
		},
		refresh (done) {
			this.$socket.emit('closeInfoSocket')
			this.$socket.emit('getInfo')
			this.$socket.emit('startInfoInterval')
			done();
		},
		pauseTorrent (props){
			console.log("pause", props)
			var torrent = props.rows[0].data;
			this.showConfirmDialog('pause', torrent, torrent.id);
		},
		resumeTorrent (props){
			console.log("resume", props)
			var torrent = props.rows[0].data;
			this.showConfirmDialog('resume', torrent, torrent.id);
		},
		deleteTorrent (props){
			console.log("delete", props)
			var torrent = props.rows[0].data;
			this.showConfirmDialog('delete', torrent, {id: torrent.id, status: torrent.status});
		},
		showSocketError(error, action, ret) {
			this.showSocketErrorDialog('Error', 'There has been an error '+ action +' (status: '+error.status+')</br></br>'+error.message + '<br><br>Please, try again', ret)
		},
		showSocketErrorDialog(title, message, ret) {
			Dialog.create({
				title: title,
				message: message,
				buttons: [
					{
						label: 'Ok',
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
				title: 'Confirm',
				message: 'Are you sure you want to ' + action + ' torrent ' + torrent.name + ' ?',
				style: 'width: 320px',
				buttons: [
					{
						label: 'Cancel',
						classes: 'tertiary',
						style: 'width: 100px; margin-right: 30px;'
					},
					{
						label: 'OK',
						classes: 'positive',
						style: 'width: 100px; margin-right: 40px;',
						handler () {
							self.$socket.emit(action, data)
						}
					}
				]
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
			config: {
				title: 'Download info',
				refresh: true,
				columnPicker: false,
				leftStickyColumns: 0,
				rightStickyColumns: 0,
				rowHeight: '50px',
				responsive: true,
				selection: 'single',
				messages: {
					noData: '<i>warning</i> No data available to show.'
				}
			},
			columns: [
				{
					label: 'Name',
					field: 'name',
					width: '200px',
					sort: true
				},{
					label: 'Size',
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
				},{
					label: 'Status',
					field: 'status',
					width: '50px',
					sort: true
				},{
					label: 'Progress',
					field: 'progress',
					width: '150px',
					sort: false
				},{
					label: 'Speed',
					field: 'speed',
					width: '50px',
					sort: false
				},{
					label: 'ETA',
					field: 'eta',
					width: '50px',
					sort: false
				}
			],
			pagination: false,
			rowHeight: 50,
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
		},
		rowHeight (value) {
			this.config.rowHeight = value + 'px'
		},
		bodyHeight (value) {
			let style = {}
			if (this.bodyHeightProp !== 'auto') {
				style[this.bodyHeightProp] = value + 'px'
			}
			this.config.bodyStyle = style
		},
		bodyHeightProp (value) {
			let style = {}
			if (value !== 'auto') {
				style[value] = this.bodyHeight + 'px'
			}
			this.config.bodyStyle = style
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
	.q-data-table table tr
		height 56px !important
</style>
