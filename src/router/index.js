import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { userApi } from "../api/user";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/rouge",
      name: "rouge",
      component: () => import("../views/RougeView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/services/basic",
      name: "services-basic",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/services/pro",
      name: "services-pro",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/services/enterprise",
      name: "services-enterprise",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/pricing/budget",
      name: "pricing-budget",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/pricing/standard",
      name: "pricing-standard",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/pricing/premium",
      name: "pricing-premium",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/saas",
      name: "products-saas",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/crm",
      name: "products-crm",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/erp",
      name: "products-erp",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/server",
      name: "products-server",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/network",
      name: "products-network",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/products/consulting",
      name: "products-consulting",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/support/help",
      name: "support-help",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/support/docs",
      name: "support-docs",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/support/contact",
      name: "support-contact",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/GenericView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to, from) => {
  const requiresAuth = to.meta.requiresAuth;
  const token = sessionStorage.getItem("token");

  if (requiresAuth && !token) {
    return { name: "login" };
  }

  if (requiresAuth && token) {
    try {
      const result = await userApi.verifyToken(token);

      if (!result.success) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        return { name: "login" };
      }

      sessionStorage.setItem("username", result.data.username);
    } catch (error) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      return { name: "login" };
    }
  }

  if (!requiresAuth && token && to.path !== "/home") {
    return { name: "login" };
  }
});

export default router;
