const planBilling = () => import('./views/plan-billing.vue');

const billingRoutes = [
    { path: 'plan', name: 'billing-plan', component: planBilling, meta: { title: 'option.plan-billing' } }
];

export default billingRoutes;
