const API_URL = 'http://borsaTreball.my/api/';

import axios from 'axios'

function checkAuth() {
    return (sessionStorage.expires_at &&
        new Date(sessionStorage.expires_at)>new Date())
}

function json2urlencoded(json) {
    let pairs = [];
    for (var prop in json) {
        if (json.hasOwnProperty(prop)) {
            var k = encodeURIComponent(prop),
                v = encodeURIComponent(json[prop]);
            pairs.push( k + "=" + v);
        }
    }
    return pairs.join("&");
}
export default {
    getConfig(type, auth) {
        let config={
            headers: {
                'Content-Type': type=='json'?
                    'application/json':
                    'application/x-www-form-urlencoded'
            }
        }
        if (auth) config.headers.Authorization=
            sessionStorage.token_type+' '+sessionStorage.access_token;
        return config;
    },
    getTable(table, query) {
        console.log('pido datos');
        if (!checkAuth() && table!='menu') {
            console.error('pido datos');
//            this.$router.push('/login');
            return new Promise((resolve,reject)=>{
                reject(new Error('No estás validado'))
            });
        }
        if (query) {
            return axios.get(API_URL + table + '?' + json2urlencoded(query), this.getConfig('json', true));
        } else {
            return axios.get(API_URL + table, this.getConfig('json', true));
        }
    },
    getItem(table, id) {
        return axios.get(API_URL + table + '/' + id, this.getConfig('json', true));
    },
    delItem(table, id) {
        return axios.delete(API_URL + table + '/' + id, this.getConfig('json', true));
    },
    saveItem(table, item) {
        return axios.post(API_URL + table, item, this.getConfig('json', true));
    },
    updateItem(table, id, item) {
        return axios.put(API_URL + table + '/' + id, item, this.getConfig('json', true));
    },
    updateInteresado(idOferta, interesado) {
        return axios.put(API_URL + 'ofertas/' + idOferta + '/alumno', {interesado: interesado}, this.getConfig('json', true));
    },
    getUser(item) {
        return axios.post(API_URL + 'auth/login', json2urlencoded(item), this.getConfig('urlencoded'));
    },
    saveUser(item) {
        return axios.post(API_URL + 'auth/signup', json2urlencoded(item), this.getConfig('urlencoded'));
    },
    logoutUser() {
        return axios.get(API_URL + 'auth/logout', this.getConfig('urlencoded', true));
    },
    sendMail(mail) {
        return axios.post(API_URL + '/mail', mail, this.getConfig('json', true));
    }
}