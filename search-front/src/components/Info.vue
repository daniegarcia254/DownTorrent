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

import { Platform, Utils, Toast, Loading, Dialog } from 'quasar'
import moment from 'moment'

export default {
	sockets:{
		connect: function(){
			console.log('socket connected')
		},
		info: function(torrents){
			console.log('sockets: info',torrents)
			this.info_result = torrents;
		},
		pause: function(data){
			console.log('sockets: pause',data)
			this.$socket.emit('getInfo')
		},
		resume: function(data){
			console.log('sockets: resume',data)
			this.$socket.emit('getInfo')
		},
		delete: function(data){
			console.log('sockets: delete',data)
			this.$socket.emit('getInfo')
		},
		closeInfoSocket: function(data){
			console.log('sockets: info closed',data)
		},
		onmessage: function (data) {
			console.log('onmessage',data)
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
			var torrentId = props.rows[0].data.id
			this.$socket.emit('pause', torrentId)
		},
		resumeTorrent (props){
			console.log("resume", props)
			var torrentId = props.rows[0].data.id
			this.$socket.emit('resume', torrentId)
		},
		deleteTorrent (props){
			console.log("delete", props)
			var torrentId = props.rows[0].data.id
			var torrentStatus = props.rows[0].data.status
			this.$socket.emit('delete', {id: torrentId, status: torrentStatus})
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
			search_query: '',
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
					noData: '<i>warning</i> No data available to show.',
					noDataAfterFiltering: '<i>warning</i> No results. Please refine your search terms.'
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
