import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import { useUserStore } from "./stores/user";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);

const userStore = useUserStore();
userStore.initFromSession();

app.mount("#app");
