import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./app/router";
import { i18n } from "./i18n";
import "virtual:uno.css";
import "./styles/theme.css";

createApp(App).use(router).use(i18n).mount("#app");
