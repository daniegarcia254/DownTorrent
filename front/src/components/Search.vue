<template>
	<q-layout>
		<!-- Main block start-->
		<div class="scroll">
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
			var error_title = this.$t("search.errors.title");
			if (error.response) {
				var status = error.response.status,
						data = error.response.data;
				this.showDialog(error_title, this.$t("search.errors.messages.base", [status,data]))
			} else if (error.message && error.status) {
				this.showDialog(error_title, this.$t("search.errors.messages.base", [error.status,error.message]))
			} else {
				this.showDialog(error_title, error.message)
			}
		},
		query (event, done){
			var self = this;
			var query = self.search_query;
			self.showLoading(self.$t("spinners.searching"))
			self.url_query = self.$store.getters.getBackURL(Platform.is.cordova) + '/api/search/piratebay?q=' + query;
			self.axios.get(encodeURI(self.url_query)).then((response) => {
				var result = response.data
				self.result_query = result
				self.$store.commit('setLastQuery', { query })
				this.$store.commit('setLastSearchResult', { result })
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
			var torrent = props.rows[0].data;
			var self = this;
			Dialog.create({
				title: self.$t("search.dialog.title"),
				message: self.$t("search.dialog.message",[torrent.name]),
				buttons: [
					{
						label: self.$t("search.dialog.cancelBtn"),
						classes: 'tertiary',
						style: 'width: 100px; margin-right: 30px;'
					},
					{
						label: self.$t("search.dialog.okBtn"),
						classes: 'positive',
						style: 'width: 100px; margin-right: 40px;',
						handler () {
							console.log("Download", props);
							self.showLoading(self.$t("spinners.addTorrent"))
							var torrentClient = self.$store.state.client
							var url = self.$store.getters.getBackURL(Platform.is.cordova) + '/api/'+torrentClient+'/download';
							var username = self.$store.state.username;
							self.axios.post(url, {
								torrent: torrent,
								username: username
							})
							.then(function (response) {
								Loading.hide()
								if (response.data.error) {
									self.errorHandling(response.data.error)
								} else {
									console.log("Success downloading", response);
									Toast.create({
										html: self.$t("search.success.addTorrent"),
										timeout: 5000
									})
								}
							})
							.catch(function (err) {
								console.log("Error downloading", err);
								Loading.hide()
								self.errorHandling(err)
							});
						}
					}
				]
			})
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
		if (this.$store.state.lastQuery && this.$store.state.lastQuery!=='') {
			this.search_query = this.$store.state.lastQuery
		}
		if (this.$store.state.lastSearchResult && this.$store.state.lastSearchResult.length > 0) {
			this.result_query = this.$store.state.lastSearchResult
		}
	},
	data: function () {
		return {
			search_query: '',
			result_query: [],
			url_query: '',
			config: {
				title: this.$t("search.table.title"),
				refresh: true,
				columnPicker: false,
				leftStickyColumns: 0,
				rightStickyColumns: 0,
				rowHeight: '50px',
				responsive: true,
				selection: 'single',
				pagination: {
					rowsPerPage: 10,
					options: [5, 10, 15, 30, 50]
				},
				messages: {
					noData: this.$t("search.table.noData")
				}
			},
			columns_thepiratebay: [
				{
					label: this.$t("search.table.fields.name"),
					field: 'name',
					width: '200px',
					sort: true
				},{
					label: this.$t("search.table.fields.size"),
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
					label: this.$t("search.table.fields.seeders"),
					field: 'seeders',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value) }
				},{
					label: this.$t("search.table.fields.leechers"),
					field: 'leechers',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value) }
				},{
					label: this.$t("search.table.fields.date"),
					field: 'uploadDate',
					width: '80px',
					format (value, row) {
						var temp_date = escape(value).replace(/%A0/g,' ').replace(/%3A/g,':').replace('Y-day','Yday').split(' '),
								month = temp_date[0].split('-')[0],
								day = temp_date[0].split('-')[1],
								isTime = temp_date[1].indexOf(':') !== -1,
								year = isTime ? new Date().getFullYear() : temp_date[1];

						var date = temp_date[0] === 'Today' ? moment() : moment([year,month,day].join('-'));
						if (temp_date[0] === 'Yday') date = moment().subtract(1, 'days');

						return date.format("DD-MM-YYYY");
					},
					sort (a,b) {
						var a_temp_date = escape(a).replace(/%A0/g,' ').replace(/%3A/g,':').replace('Y-day','Yday').split(' '),
								a_month = a_temp_date[0].split('-')[0],
								a_day = a_temp_date[0].split('-')[1],
								a_isTime = a_temp_date[1].indexOf(':') !== -1,
								a_year = a_isTime ? new Date().getFullYear() : a_temp_date[1];

						var a_date = a_temp_date[0] === 'Today' ? moment() : moment([a_year,a_month,a_day].join('-'));
						if (a_temp_date[0] === 'Yday') a_date = moment().subtract(1, 'days');

						var b_temp_date = escape(b).replace(/%A0/g,' ').replace(/%3A/g,':').replace('Y-day','Yday').split(' '),
								b_month = b_temp_date[0].split('-')[0],
								b_day = b_temp_date[0].split('-')[1],
								b_isTime = b_temp_date[1].indexOf(':') !== -1,
								b_year = b_isTime ? new Date().getFullYear() : b_temp_date[1];

						var b_date = b_temp_date[0] === 'Today' ? moment() : moment([b_year,b_month,b_day].join('-'));
						if (b_temp_date[0] === 'Yday') b_date = moment().subtract(1, 'days');

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
	.scroll
		width: 100%;
	.q-data-table
		width 100%
	.q-data-table-toolbar .q-search
		display: none
	.q-data-table-toolbar .q-picker-textfield
		display: none
	.layout-padding
		padding-bottom 50px !important
</style>
