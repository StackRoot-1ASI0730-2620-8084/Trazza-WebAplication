const ratingList = () => import('./views/rating-list.vue');

const reputationRoutes = [
    { path: 'ratings', name: 'reputation-ratings', component: ratingList, meta: { title: 'option.ratings' } }
];

export default reputationRoutes;
