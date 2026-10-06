import useIamStore from "../application/iam.store.js";

/**
 * Navigation guard that protects private routes and enforces the role declared in route metadata.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @returns {{name: string}|boolean} True to allow navigation or a redirect location.
 */
export const authenticationGuard = (to) => {
    const store = useIamStore();
    const isPublic = to.meta?.public === true;
    if (!store.isSignedIn.value) return isPublic ? true : { name: 'iam-sign-in' };
    if (isPublic) return { name: 'dashboard' };
    const allowedRoles = to.meta?.roles;
    if (Array.isArray(allowedRoles) && !allowedRoles.includes(store.currentRole.value)) return { name: 'dashboard' };
    return true;
};
