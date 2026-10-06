const signIn = () => import('./views/sign-in.vue');
const signUp = () => import('./views/sign-up.vue');
const profile = () => import('./views/profile.vue');
const vehicleList = () => import('./views/vehicle-list.vue');
const vehicleForm = () => import('./views/vehicle-form.vue');

const iamRoutes = [
    { path: 'sign-in',            name: 'iam-sign-in',      component: signIn,      meta: { title: 'sign-in.title', public: true } },
    { path: 'sign-up',            name: 'iam-sign-up',      component: signUp,      meta: { title: 'sign-up.title', public: true } },
    { path: 'profile',            name: 'iam-profile',      component: profile,     meta: { title: 'option.profile' } },
    { path: 'vehicles',           name: 'iam-vehicles',     component: vehicleList, meta: { title: 'option.vehicles', roles: ['carrier'] } },
    { path: 'vehicles/new',       name: 'iam-vehicle-new',  component: vehicleForm, meta: { title: 'vehicle.new-title', roles: ['carrier'] } },
    { path: 'vehicles/:id/edit',  name: 'iam-vehicle-edit', component: vehicleForm, meta: { title: 'vehicle.edit-title', roles: ['carrier'] } }
];

export default iamRoutes;
