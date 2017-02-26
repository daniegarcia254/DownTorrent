<template>
	<q-layout>
		<!-- Main block start-->
		<div class="scroll" style="width: 100%">
			<div class="layout-padding">
				<div class="row">
					<q-search v-model="search_query"></q-search>
					<button class="query-button primary circular" @click="query">
						<i class="icon-32">arrow_forward</i>
					</button>
				</div>
				<div class="row" style="margin-top: 30px;">
					<q-data-table :data="result_query" :config="config" :columns="columns_thepiratebay" @refresh="refresh">
						<template slot="col-name" scope="cell">
							{{cell.data}}<q-tooltip>{{cell.data}}</q-tooltip>
							}
					  </template>
						<template slot="selection" scope="props">
							<button class="primary clear" @click="download(props)">
								<i>file_download</i>
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
		query (event, done){
			var self = this;
			self.showLoading('Searching...')
			self.url_query = location.protocol + '//' + location.hostname + ':10005/api?q=' + self.search_query;
			self.axios.get(encodeURI(self.url_query)).then((response) => {
				self.result_query = response.data
				Loading.hide()
				if (done) done()
			}, (err) => {
				console.log("Error searching", err);
				Loading.hide()
				if (done) done()
				self.errorHandling(err)
			})
		},
		download (props) {
			console.log("Download", props);
			var self = this;
			self.showLoading('Adding torrent...')
			var url = location.protocol + '//' + location.hostname + ':10005/api/download';
			var username = self.$store.state.username;
			self.axios.post(url, {
				torrent: props.rows[0].data,
				username: username
			})
			.then(function (response) {
				Loading.hide()
				if (response.data.error) {
					self.errorHandling(response.data.error)
				} else {
					console.log("Success downloading", response);
					self.showDialog('','The torrent has been successfully added.</br></br>');
				}
			})
			.catch(function (err) {
				console.log("Error downloading", err);
				Loading.hide()
				self.errorHandling(err)
			});
		},
		refresh (done) {
			this.query(null, done)
		}
	},
	created: function(){
		if (!this.$store.state.username && this.$localStorage.get('username')!=='') {
			var name = this.$localStorage.get('username')
			this.$store.commit('setUsername', { name })
		}
	},
	data: function () {
		return {
			search_query: '',
			result_query: [],
			url_query: '',
			config: {
				title: 'Search result',
				refresh: true,
				columnPicker: false,
				leftStickyColumns: 0,
				rightStickyColumns: 0,
				rowHeight: '50px',
				responsive: true,
				pagination: {
					rowsPerPage: 10,
					options: [5, 10, 15, 30, 50]
				},
				selection: 'single',
				messages: {
					noData: '<i>warning</i> No data available to show.',
					noDataAfterFiltering: '<i>warning</i> No results. Please refine your search terms.'
				}
			},
			columns_thepiratebay: [
				{
					label: 'Name',
					field: 'name',
					width: '200px',
					sort: true
				},{
					label: 'Size',
					field: 'size',
					width: '50px',
					sort (a,b) {
						var a_temp = escape(a).replace(/%A0/g,' ').split(' '),
								b_temp = escape(b).replace(/%A0/g,' ').split(' '),
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
					label: 'Seeders',
					field: 'seeders',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value) }
				},{
					label: 'Leechers',
					field: 'leechers',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value) }
				},{
					label: 'Date',
					field: 'uploadDate',
					width: '80px',
					format (value, row) {
						var temp_date = escape(value).replace(/%A0/g,' ').replace(/%3A/g,':').split(' '),
								month = temp_date[0].split('-')[0],
								day = temp_date[0].split('-')[1],
								isTime = temp_date[1].indexOf(':') !== -1,
								year = isTime ? new Date().getFullYear() : temp_date[1];

						var date = temp_date[0] === 'Today' ? moment() : moment([year,month,day].join('-'));

						return date.format("DD-MM-YYYY");
					},
					sort (a,b) {
						var a_temp_date = escape(a).replace(/%A0/g,' ').replace(/%3A/g,':').split(' '),
								a_month = a_temp_date[0].split('-')[0],
								a_day = a_temp_date[0].split('-')[1],
								a_isTime = a_temp_date[1].indexOf(':') !== -1,
								a_year = a_isTime ? new Date().getFullYear() : a_temp_date[1];
								
						var a_date = a_temp_date[0] === 'Today' ? moment() : moment([a_year,a_month,a_day].join('-'));

						var b_temp_date = escape(b).replace(/%A0/g,' ').replace(/%3A/g,':').split(' '),
								b_month = b_temp_date[0].split('-')[0],
								b_day = b_temp_date[0].split('-')[1],
								b_isTime = b_temp_date[1].indexOf(':') !== -1,
								b_year = b_isTime ? new Date().getFullYear() : b_temp_date[1];
								
						var b_date = b_temp_date[0] === 'Today' ? moment() : moment([b_year,b_month,b_day].join('-'));

						return a_date.diff(b_date);
					}
				}
			],
			pagination: true,
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
	.query-button
		height 35px !important
		width 45px !important
		margin-left 20px
		margin-right 10px
	.q-data-table-toolbar .q-search
		display: none
	.q-data-table-toolbar .q-picker-textfield
		display: none
	.layout-padding
		padding-bottom 50px !important
</style>
