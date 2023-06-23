<template>
  <div>
    <div v-for="(error,i) in errors" :key="i">
      <v-alert v-model="error.show" :type="error.type" dismissible>{{ error.msg }}</v-alert>
    </div>

    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="search"
          label="Filtrar taula"
          single-line
          hide-details
        ></v-text-field>

        <v-spacer></v-spacer>
        <v-btn
          v-if="imEmpresa || imResponsable && !isArxiu"
          top
          right
          color="indigo"
          dark
          @click="dialogNewOferta"
        >
          <v-icon>add</v-icon>
        </v-btn>
      </v-card-title>
      <v-data-table
        :items="items"
        no-data-text="No hi ha dades disponibles"
        rows-per-page-text="Registres per pàgina"
        :headers="headers"
        :search="search"
        class="elevation-1"
      >
        <template slot="headerCell" slot-scope="props">
          <v-tooltip bottom>
            <span slot="activator">{{ props.header.text }}</span>
            <span>{{ props.header.text }}</span>
          </v-tooltip>
        </template>

        <template slot="items" slot-scope="props">
          <tr color="red">
            <td>
              <v-chip
                :color="props.item.validada?'teal':'red'"
                @dblclick.stop="openDialogValidar(props.item)"
                :title="(props.item.activa?'Activa':'No activa')+' / '
            +(props.item.validada?'Validada':'No validada')"
              >
                <yes-no-icon :value="props.item.activa"></yes-no-icon>
              </v-chip>
            </td>
            <td>{{ nomEmpresa(props.item.id_empresa) }}</td>
            <td>{{ props.item.puesto }}</td>
            <td>{{ props.item.tipo_contrato }}</td>
            <td>
              <ciclo-chip
                v-for="ciclo in props.item.ciclos"
                :key="ciclo.id_ciclo"
                :ciclo="ciclo"
                :nomCiclo="nomCiclo(ciclo.id_ciclo)"
                :descCiclo="descCiclo(ciclo.id_ciclo)"
              ></ciclo-chip>
            </td>
            <td class="justify-center layout px-0">
              <v-btn
                icon
                class="mx-0"
                @click="props.expanded = !props.expanded"
                title="Alumnes interessats"
              >
                <v-icon>{{ props.expanded?'remove':'people' }}</v-icon>
              </v-btn>
              <div v-if="imEmpresa || imResponsable">
                <v-btn icon class="mx-0" @click="preOpenDialog(props.item)">
                  <v-icon>{{ isArxiu?'remove_red_eye':'edit' }}</v-icon>
                </v-btn>
                <v-btn v-if="!isArxiu" icon class="mx-0" @click="deleteItem(props.item)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </template>
        <v-alert
          slot="no-results"
          :value="true"
          color="error"
          icon="warning"
        >La cerca de "{{ search }}" no dona cap resultat</v-alert>

        <template slot="expand" slot-scope="props">
          <v-card flat>
            <v-card-title>CANDIDATS INTERESSATS:</v-card-title>
            <v-card-text>
              <div v-for="alum in props.item.alumnos" :key="alum.id">
                <strong>
                  <a
                    target="_blank"
                    :href="alum.cv_enlace"
                    :title="alum.cv_enlace"
                  >{{ alum.nombre+' '+alum.apellidos }}</a>
                </strong>
                &mdash;
                <strong>e-mail:</strong>
                {{ alum.email }}
                &mdash;
                <strong>Tel.:</strong>
                {{ alum.telefono }}
              </div>
            </v-card-text>
          </v-card>
          <v-divider></v-divider>
        </template>

        <template class="text-sm-left" slot="actions-prepend">
          <help-button v-if="helpPage" :page="helpPage"></help-button>
        </template>
        <template
          slot="pageText"
          slot-scope="props"
        >Registres del {{ props.pageStart }} al {{ props.pageStop }} de {{ props.itemsLength }}</template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" width="800px" @keydown.esc="closeDialog">
      <v-card>
        <v-card-title class="grey lighten-4 py-4 title">{{ isNew?'Nova':'Editar' }} oferta</v-card-title>
        <v-container grid-list-sm class="pa-4">
          <v-layout row wrap>
            <v-flex xs1>
              <v-text-field label="Id" placeholder="Id" v-model="editItem.id" readonly></v-text-field>
            </v-flex>
            <v-flex xs2>
              <v-checkbox 
                v-model="editItem.activa" 
                label="Activa" 
                placeholder="Activa"
                :disabled="isArxiu"
              ></v-checkbox>
            </v-flex>
            <v-flex xs3>
              <v-checkbox
                v-model="editItem.validada"
                label="Validada"
                placeholder="Validada"
                disabled
              ></v-checkbox>
            </v-flex>
            <v-flex xs6>
              <v-select
                :disabled="isArxiu"
                :readonly="!imResponsable"
                label="Descripció"
                placeholder="Empresa"
                :items="empresas"
                v-model="editItem.id_empresa"
                item-text="nombre"
                item-value="id"
                required
                single-line
                @change="rellenaContacto"
              ></v-select>
            </v-flex>
            <v-flex xs2>
              <v-text-field
                :disabled="isArxiu"
                label="Telèfon"
                placeholder="Telèfon"
                v-model="editItem.telefono"
                counter="25"
                :rules="required25Rules"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs4>
              <v-text-field
                :disabled="isArxiu"
                label="E-mail"
                placeholder="E-mail"
                v-model="editItem.email"
                counter="50"
                :rules="required50Rules"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs3>
              <v-text-field
                :disabled="isArxiu"
                label="Persona de contacte"
                placeholder="Persona de contacte"
                v-model="editItem.contacto"
                counter="50"
                :rules="required50Rules"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs3>
              <v-checkbox
                :disabled="isArxiu"
                v-model="editItem.mostrar_contacto"
                label="Mostrar contacte"
                :hint="'Els interessats '+(editItem.mostrar_contacto?'':'NO ')+'podran veure el mail, tfn. i persona de contacte'"
                persistent-hint
              ></v-checkbox>
            </v-flex>
            <v-flex xs8></v-flex>
            <v-flex xs12>
              <v-text-field
                :disabled="isArxiu"
                label="Lloc de treball"
                placeholder="Lloc de treball"
                v-model="editItem.puesto"
                counter="50"
                :rules="required50Rules"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs12>
              <v-textarea
                :disabled="isArxiu"
                label="Descripció"
                placeholder="Descripció"
                counter="800"
                v-model="editItem.descripcion"
                required
              ></v-textarea>
            </v-flex>
            <v-flex xs12>
              <v-text-field
                :disabled="isArxiu"
                label="Tipus de contracte"
                placeholder="Tipus de contracte"
                v-model="editItem.tipo_contrato"
                counter="50"
                :rules="required50Rules"
                required
              ></v-text-field>
            </v-flex>
            <!-- Ciclos -->
            <v-flex xs9>
              <v-select
                :disabled="isArxiu"
                :items="ciclos"
                v-model="editItem.ciclos"
                item-text="ciclo"
                item-value="id"
                label="Cicles demanats"
                multiple
                chips
                hint="Els aspirants han de tindre algú d'quests cicles"
                persistent-hint
              ></v-select>
            </v-flex>
            <v-flex xs3>
              <v-checkbox
                :disabled="isArxiu"
                v-model="editItem.estudiando"
                label="Inclou estudiants"
                title="Inclou també als alumnes que encara estan estudiant algun d'aquests cicles"
                persistent-hint
              ></v-checkbox>
              <v-text-field
                label="Any màxim"
                title="Només alumnes que hagen acabat els estudis amb posterioritat a aquest any"
                placeholder="d'acabar el cicle"
                v-model="editItem.any"
                mask="####"
                :disabled="!editItem.ciclos || editItem.ciclos.length==0 || isArxiu"
              ></v-text-field>
            </v-flex>
            <v-flex v-if="editItem.validada" xs12>
              <v-textarea
                :disabled="isArxiu"
                label="Resultat"
                placeholder="Per favor, quan finalitze el procés indica ací el resultat de l'oferta (si s'ha cobert o no i per què)"
                v-model="editItem.resultat"
              ></v-textarea>
            </v-flex>
          </v-layout>
        </v-container>
        <v-card-actions>
          <help-button
            v-if="helpPage"
            :page="helpPage+(isNew?'#crear-una-nova-oferta':'#editar-una-oferta')"
          ></help-button>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="!isArxiu" 
            :disabled="!valid"
            flat color="primary" 
            @click="addItem"
          >Guardar</v-btn>
          <v-btn flat @click="closeDialog">{{ isArxiu?'Tancar':'Cancel·lar' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog validar -->
    <v-layout row justify-center>
      <v-dialog v-model="dialogValidar" persistent max-width="290" @keydown.esc="dialogValidar = false">
        <v-card>
          <v-card-title class="headline">{{ ofertaValidar.validada?'Invalidar':'Validar'}} Oferta</v-card-title>
          <v-card-text>
            Vas a {{ ofertaValidar.validada?'in':''}}validar l'oferta '
            <strong>{{ ofertaValidar.puesto }}</strong>
            '. ¿Deseas continuar?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" flat @click.native="validaOferta">Aceptar</v-btn>
            <v-btn color="green darken-1" flat @click.native="dialogValidar = false">Cancel·lar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
    <!-- <ofertas-validar-dialog :dialogValidar.sync="dialogValidar" :ofertaValidar="ofertaValidar">
    </ofertas-validar-dialog> -->
  </div>
</template>

<script>
import API from "../lib/API";
import formRulesMixin from "../mixins/formRules.js";
import utilsMixin from "../mixins/utils.js";
import YesNoIcon from "../components/base/YesNoIcon";
import HelpButton from "../components/base/HelpButton";
import CicloChip from "../components/base/CicloChip";
// import OfertasValidarDialog from './OfertasValidarDialog';

export default {
  mixins: [formRulesMixin, utilsMixin],
  components: {
    YesNoIcon,
    HelpButton,
    CicloChip,
    // OfertasValidarDialog
  },
  data: () => ({
    helpPage: "ofertas",
    headers: [
      { text: "Activa", value: "activa" },
      { text: "Empresa", value: "id_empresa" },
      { text: "Lloc de treball", value: "puesto" },
      { text: "Contracte", value: "tipo_contrato" },
      { text: "Cicles", value: "cicles" },
      { text: "Accions", value: "id_empresa" }
    ],
    empresas: [],
    ciclos: [],
    // Dialog validar
    dialogValidar: false,
    ofertaValidar: {}
  }),
  mounted() {
    this.$emit("setTitle", this.isArxiu?"Ofertes arxivades":"Manteniment d'Ofertes");
    this.loadData();
    this.editItem.ciclos = [];
    this.editItem.archivada = 0;
    this.editItem.estudiando = 0;
  },
  computed: {
        isArxiu () {
            return this.$route.path === '/ofertas-arxiu';
        },
        table() {
          return this.isArxiu?'ofertas-arxiu':'ofertas';
        }
  },
  beforeRouteUpdate (to, from, next) {
    this.$emit("setTitle", this.isArxiu?"Ofertes arxivades":"Manteniment d'Ofertes");
    this.loadData();
    this.editItem.ciclos = [];
    this.editItem.archivada = 0;
    this.editItem.estudiando = 0;
    next();
  },
  methods: {
    loadData() {
      //      this.loadItems();
      API.getTable(this.table, this.$route.query)
        .then(resp => (this.items = resp.data.data))
        .catch(err => this.msgErr(err));
      API.getTable("empresas")
        .then(
          resp =>
            (this.empresas = resp.data.data.map(empresa => {
              return {
                id: empresa.id,
                nombre: empresa.nombre,
                contacto: empresa.contacto,
                telefono: empresa.telefono,
                email: empresa.email
              };
            }))
        )
        .catch(err => this.msgErr(err));
      API.getTable("ciclos")
        .then(
          resp =>
            (this.ciclos = resp.data.data.map(ciclo => {
              return {
                id: ciclo.id,
                ciclo: ciclo.ciclo,
                descrip: ciclo.vCiclo,
                dept: ciclo.Dept,
                familia: ciclo.vDept
              };
            }))
        )
        .catch(err => this.msgErr(err));
    },
    preOpenDialog(item) {
      let itemCiclos = { ...item };
      itemCiclos.ciclos = itemCiclos.ciclos.map(ciclo => ciclo.id_ciclo);
      this.openDialog(itemCiclos);
    },
    nomEmpresa(id) {
      return (id && this.empresas.length)?
        this.empresas.find(empresa => empresa.id == id).nombre
        :'';
    },
    nomCiclo(id) {
      return id && this.ciclos.length
        ? this.ciclos.find(ciclo => ciclo.id == id).ciclo
        : "";
    },
    descCiclo(id) {
      return id && this.ciclos.length
        ? this.ciclos.find(ciclo => ciclo.id == id).descrip
        : "";
    },
    rellenaContacto() {
      let newEmpresa = this.empresas.find(empresa => empresa.id == this.editItem.id_empresa);
      for (let campo of ["telefono", "email", "contacto"])
        this.editItem[campo] = newEmpresa[campo];
    },
    dialogNewOferta() {
      let defaultItem = {
        activa: true,
        mostrar_contacto: true,
        ciclos: []
      };
      this.openDialog(defaultItem);
      if (this.imEmpresa) {
        this.editItem.id_empresa = this.myId;
        this.rellenaContacto(this.myId);
      } else if (this.$route.query && this.$route.query.id_empresa) {
        this.editItem.id_empresa = Number(this.$route.query.id_empresa);
        this.rellenaContacto();
      }
    },
    openDialogValidar(oferta) {
      if (this.imResponsable) {
        if (oferta.activa || oferta.validada) {
          // Si la oferta está activa puede validarse o invalidarse
          // Si no está activa sólo puede invalidarse
          this.ofertaValidar = { ...oferta };
          this.dialogValidar = true;
        }
      }
    },
    validaOferta() {
      this.editItem = this.ofertaValidar;
      this.editIndex = this.items.findIndex(
        elem => elem.id == this.editItem.id
      );
      // La cambiamos la validación
      API.updateOfertaValida(this.editItem.id, !this.editItem.validada)
      .then(resp=>this.items[this.editIndex].validada=resp.data.data.validada)
      .catch(err=>this.msgErr(err))
      this.dialogValidar = false;
    },
    deleteItem(oferta) {
      // Las ofertas no se borran, se archivan
      if (
        confirm(
          "Segur que vols arxivar definitivament l'oferta '" +
            oferta.puesto +
            "' de l'empresa '" +
            this.nomEmpresa(oferta.id_empresa) +
            "'?"
        )
      ) {
        // La marcamos como archivada
        this.editIndex = this.items.indexOf(oferta);
        this.editItem = { ...oferta };
        this.editItem.archivada = true;
        // Y guardamos la modificación
        this.addItem();
        this.items = this.items.filter(elem => elem.id != oferta.id);
      }
    }
  }
};
</script>
