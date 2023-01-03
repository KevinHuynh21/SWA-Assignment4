import { createRouter, createWebHistory } from "vue-router";

import { checkAuthentication } from "../services/auth.service";

const authGuard = () => {
  if (!checkAuthentication()) {
    router.push({ path: "/login" });
    return false;
  }
  return true;
};

const loggedInGuard = () => {
  if (checkAuthentication()) {
    router.push({ path: "/profile" });
    return false;
  }
  return true;
};

const routes = [
  {
    path: "/",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    beforeEnter: [loggedInGuard],
    // meta: {
    //   requiresAuth: true
    // },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    beforeEnter: [loggedInGuard],
    // meta: {
    //   requiresAuth: true
    // },
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/ProfileView.vue"),
    beforeEnter: [authGuard],
    // meta: {
    //   requiresAuth: false,
    // },
  },
  {
    path: "/signup",
    name: "signup",
    component: () => import("../views/SignupView.vue"),
    beforeEnter: [loggedInGuard],
    // meta: {
    //   requiresAuth: true
    // },
  },
  {
    path: "/play",
    name: "play",
    component: () => import("../views/GameView.vue"),
    beforeEnter: [authGuard],
    // meta: {
    //   requiresAuth: false,
    // },
  },
  {
    path: "/scores",
    name: "scores",
    component: () => import("../views/ScoresView.vue"),
    beforeEnter: [authGuard],
    // meta: {
    //   requiresAuth: false,
    // },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
