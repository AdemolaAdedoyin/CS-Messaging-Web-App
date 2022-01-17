import { createApp } from "vue";
import VueChatScroll from "vue-chat-scroll";
import App from "./App.vue";
import router from "./router";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

createApp(App).use(VueChatScroll).use(router).mount("#app");
