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
					<q-data-table :data="result_query" :config="config" :columns="columns_rarbg" @refresh="refresh">
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

import { Platform, Utils, Toast, Loading, Dialog } from 'quasar';
import moment from 'moment';
import prettyBytes from 'pretty-bytes';

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
			console.log("Error response", error.response);

			var self = this;
			var status, message;
			var error_title = self.$t("search.errors.title");

			if (error.message) message = error.message;
			if (error.status) status = error.status;

			if (error.response) {
				status = error.response.status;
				if (error.response.data && error.response.data.error){
					status = error.response.data.error.status || status;
					message = error.response.data.error.message;
					if (error.response.data.error.result){
						message = error.response.data.error.result;
					}
				} else {
					message = error.response.data;
				}
			}
			if (message && status) {
				self.showDialog(error_title, this.$t("search.errors.messages.base", [status,message]))
			} else {
				self.showDialog(error_title, error.message)
			}
		},
		query (event, done){
			var self = this;
			var query = self.search_query;
			self.showLoading(self.$t("spinners.searching"))
			self.url_query = self.$store.getters.getBackURL(Platform.is.cordova) + '/api/search/rarbg?q=' + query;
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
				message: self.$t("search.dialog.message",[torrent.title]),
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
							var torrentClient = self.$store.state.client;
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
			columns_rarbg: [
				{
					label: this.$t("search.table.fields.name"),
					field: 'title',
					width: '200px',
					sort: true
				},{
					label: this.$t("search.table.fields.size"),
					field: 'size',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return prettyBytes(value); }
				},{
					label: this.$t("search.table.fields.seeders"),
					field: 'seeders',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value); }
				},{
					label: this.$t("search.table.fields.leechers"),
					field: 'leechers',
					width: '50px',
					sort (a,b) { return (parseInt(a) - parseInt(b)) },
					format (value,row) { return parseInt(value); }
				},{
					label: this.$t("search.table.fields.date"),
					field: 'pubdate',
					width: '80px',
					format (value, row) { return moment(value).format("DD/MM/YYYY"); },
					sort (a,b) { return moment(a).diff(moment(b)); }
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
