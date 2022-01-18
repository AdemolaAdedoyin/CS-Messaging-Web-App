import { createRouter, createWebHistory } from "vue-router";
// import Home from "../views/Home.vue";
import login from "../views/Login.vue";
import chat from "../views/Chat.vue";
import csChat from "../views/Cs-Chat.vue";

const routes = [
  {
    path: "/",
    name: "login",
    component: login,
  },
  {
    path: "/chat",
    name: "chat",
    component: chat,
    props: true,
    beforeEnter: (to, from, next) => {
      if (to.params.name) {
        next();
      } else {
        next({ name: "login" });
      }
    },
  },
  {
    path: "/rep/chat",
    name: "rep-chat",
    component: csChat,
    props: true,
    beforeEnter: (to, from, next) => {
      if (to.params.repName) {
        next();
      } else {
        next({ name: "login" });
      }
    },
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
