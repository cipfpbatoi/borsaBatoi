<template>
        <div>
        <div v-for="(error,i) in errors" :key="i">
            <v-alert v-model="error.show" :type="error.type" dismissible>
                {{ error.msg }}
            </v-alert>
        </div>
              <v-card>
  <v-form @submit.prevent="submit" ref="form" v-model="valid" lazy-validation>
            <v-card-title class="grey lighten-4 py-4 title">
              Inicia sessió
            </v-card-title>
            <v-card-text>
            <v-text-field
                autofocus
                v-model="item.email" 
                label="e-Mail" 
                title="e-Mail" 
                required
                :rules="emailRules"
            >
            </v-text-field>
            <v-text-field
                v-model="item.password" 
                :append-icon="show ? 'visibility' : 'visibility_off'"
                :type="show ? 'text' : 'password'"
                @click:append="show = !show"
                hint="Al menys 6 caràcters"
                label="Contrasenya" 
                title="Contrasenya" 
                required
            >
            </v-text-field>
            <p><a href="#">He oblidat la meua contrasenya</a></p>
            </v-card-text>
            <v-card-actions>
    <help-button v-if="helpPage" :page="helpPage"></help-button>
    <v-spacer></v-spacer>
    <v-btn type="submit" :disabled="!valid">Login</v-btn>
    <v-btn @click.stop="registerUser">Registrar-se</v-btn>

            </v-card-actions>
  </v-form>
              </v-card>

    </div>    
</template>

<script>
import API from '../lib/API';
import utilsMixin from '../mixins/utils.js';
import formRulesMixin from '../mixins/formRules.js';
import HelpButton from '../components/base/HelpButton';

export default {
  mixins: [utilsMixin, formRulesMixin],
  components: {HelpButton },
      data() { 
          return {
            helpPage: "login",
            item: {},
            password2: '',
            show: false,
            }
      },
    created() {
      this.$emit('setTitle', 'Inicia sessió');
    },
      methods: {
          submit() {
            API.loginUser(this.item)
            .then(resp => {
              if (resp.data.access_token) {
                this.setToken(resp.data);
                if (resp.data.rol==7) this.$router.push('/ofertas-alum')
                else this.$router.push('/ofertas')
              } else {
                this.msgErr('ERROR, no s\'ha pogut loguejar: '+resp.data);
              }
            }) // store the token in localstorage
            .catch(err => {
              if (err.response && err.response.status==401) {
                this.msgErr('Error 401: El email o la contraseña no son correctos');
              } else {
                this.msgErr(err?.message || err);
                this.msgErr(err.response.data);
                if (err?.response?.data?.errors) {
                  for (const clave in err.response.data.errors) {
                    this.msgErr(clave+ ': ' + err.response.data.errors[clave]);
                  }
                } else {
                  this.msgErr('Error desconegut al loguejar: ' + err);
                }
              }
            }); // if the request fails, remove any possible user token if possible
          },
          registerUser() {
            this.$router.push('/register');
          },
      }    
}
</script>
