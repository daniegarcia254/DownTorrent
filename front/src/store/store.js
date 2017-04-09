import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// root state object.
// each Vuex instance is just a single state tree.
const state = {
	username: '',
	lastQuery: '',
	language: null,
	client: 'transmission',
	backend_port: BACKEND_PORT_VALUE,
	backend_url: BACKEND_URL_VALUE,
	lastSearchResult: []
}

// mutations are operations that actually mutates the state.
// each mutation handler gets the entire state tree as the
// first argument, followed by additional payload arguments.
// mutations must be synchronous and can be recorded by plugins
// for debugging purposes.
const mutations = {
	setUsername (state, { name }) {
		state.username = name;
	},
	setLanguage (state, { lang }) {
		state.language = lang;
	},
	setLastQuery (state, { query }) {
		state.lastQuery = query;
	},
	setLastSearchResult (state, { result }) {
		state.lastSearchResult = result;
	}
}

// actions are functions that causes side effects and can involve
// asynchronous operations.
const actions = {

}

// getters are functions
const getters = {
	getBackURL: (state,getters) => (isCordova)  => {
		if (isCordova) return state.backend_url + ':' + state.backend_port;
		else return location.protocol + '//' + location.hostname  +  ':' + state.backend_port;
	}
}

// A Vuex instance is created by combining the state, mutations, actions,
// and getters.
const store = new Vuex.Store({
	state,
	getters,
	actions,
	mutations
})

export default store
