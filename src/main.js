import './assets/main.css'

// 正确的方式：命名导入
import { VueUiXy, VueUiDonut, VueUiVerticalBar, VueUiGauge, VueUiTable } from 'vue-data-ui'
import 'vue-data-ui/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.component('VueUiXy', VueUiXy)
app.component('VueUiDonut', VueUiDonut)
app.component('VueUiVerticalBar', VueUiVerticalBar)
app.component('VueUiGauge', VueUiGauge)
app.component('VueUiTable', VueUiTable)

app.use(createPinia())
app.use(router)

app.mount('#app')
