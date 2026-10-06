import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "./iam/presentation/iam-routes.js";
import matchmakingRoutes from "./matchmaking/presentation/matchmaking-routes.js";
import executionRoutes from "./execution/presentation/execution-routes.js";
import billingRoutes from "./billing/presentation/billing-routes.js";
import reputationRoutes from "./reputation/presentation/reputation-routes.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";
import i18n from "./i18n.js";

const dashboard = () => import('./shared/presentation/views/dashboard.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

const routes = [
    { path: '/dashboard',        name: 'dashboard',   component: dashboard,    meta: { title: 'option.dashboard' } },
    { path: '/iam',              name: 'iam',         children: iamRoutes },
    { path: '/matchmaking',      name: 'matchmaking', children: matchmakingRoutes },
    { path: '/execution',        name: 'execution',   children: executionRoutes },
    { path: '/billing',          name: 'billing',     children: billingRoutes },
    { path: '/reputation',       name: 'reputation',  children: reputationRoutes },
    { path: '/',                 redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*',  name: 'not-found',   component: pageNotFound, meta: { title: 'page-not-found.title', public: false } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
});

/**
 * Global navigation guard that updates the document title and delegates authentication and role checks to IAM.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @returns {{name: string}|boolean} True to allow navigation or a redirect location.
 */
router.beforeEach((to) => {
    const titleKey = to.meta['title'];
    document.title = titleKey ? `Trazza - ${i18n.global.t(titleKey)}` : 'Trazza';
    return authenticationGuard(to);
});

export default router;
