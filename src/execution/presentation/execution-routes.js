const activeTrip = () => import('./views/active-trip.vue');
const tripHistory = () => import('./views/trip-history.vue');
const shipmentTracking = () => import('./views/shipment-tracking.vue');
const shipmentHistory = () => import('./views/shipment-history.vue');

const executionRoutes = [
    { path: 'active-trip',       name: 'execution-active-trip',       component: activeTrip,       meta: { title: 'option.active-trip', roles: ['carrier'] } },
    { path: 'trip-history',      name: 'execution-trip-history',      component: tripHistory,      meta: { title: 'option.trip-history', roles: ['carrier'] } },
    { path: 'shipment-tracking', name: 'execution-shipment-tracking', component: shipmentTracking, meta: { title: 'option.shipment-tracking', roles: ['merchant'] } },
    { path: 'shipment-history',  name: 'execution-shipment-history',  component: shipmentHistory,  meta: { title: 'option.shipment-history', roles: ['merchant'] } }
];

export default executionRoutes;
