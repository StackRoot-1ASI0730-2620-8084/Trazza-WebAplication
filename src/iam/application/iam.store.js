import {computed, reactive} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {SESSION_TOKEN_KEY} from "../infrastructure/iam.interceptor.js";
import {Phone} from "../domain/model/phone.value-object.js";
import useProfileStore from "./profile.store.js";

const iamApi = new IamApi();

/**
 * Key used to persist the signed-in user resource in the browser storage.
 * @type {string}
 */
const SESSION_USER_KEY = 'trazza.session.user';

/**
 * Reactive state of the IAM bounded context.
 *
 * @type {{currentUser: ?import('../domain/model/user.entity.js').User, errors: Error[], processing: boolean}}
 */
const state = reactive({
    currentUser: null,
    errors: [],
    processing: false
});

/** @type {import('vue').ComputedRef<boolean>} Whether a user is signed in. */
const isSignedIn = computed(() => state.currentUser !== null);

/** @type {import('vue').ComputedRef<?string>} Role of the signed-in user. */
const currentRole = computed(() => state.currentUser?.role.value ?? null);

/** @type {import('vue').ComputedRef<?number>} Identifier of the signed-in user. */
const currentUserId = computed(() => state.currentUser?.id ?? null);

/** @type {import('vue').ComputedRef<boolean>} Whether the signed-in user is a carrier. */
const isCarrier = computed(() => currentRole.value === 'carrier');

/** @type {import('vue').ComputedRef<boolean>} Whether the signed-in user is a merchant. */
const isMerchant = computed(() => currentRole.value === 'merchant');

/**
 * Stores the session of a user in memory and in the browser storage.
 *
 * @param {import('../domain/model/user.entity.js').User} user - Authenticated user.
 * @returns {void}
 */
function startSession(user) {
    state.currentUser = user;
    localStorage.setItem(SESSION_TOKEN_KEY, btoa(`${user.id}:${user.email.value}:${Date.now()}`));
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(UserAssembler.toResourceFromEntity(user)));
}

/**
 * Restores a previous session from the browser storage.
 *
 * @returns {void}
 */
function restoreSession() {
    const serializedUser = localStorage.getItem(SESSION_USER_KEY);
    if (!serializedUser || !localStorage.getItem(SESSION_TOKEN_KEY)) return;
    try {
        state.currentUser = UserAssembler.toEntityFromResource(JSON.parse(serializedUser));
    } catch (error) {
        signOut();
    }
}

/**
 * Executes the sign-in use case.
 *
 * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Authenticated user.
 * @throws {Error} When the credentials are not valid.
 */
async function signIn(signInCommand) {
    state.processing = true;
    try {
        const users = UserAssembler.toEntitiesFromResponse(await iamApi.signIn(signInCommand));
        if (users.length !== 1) throw new Error('validation.invalid-credentials');
        startSession(users[0]);
        state.errors = [];
        return users[0];
    } catch (error) {
        state.errors.push(error);
        throw error;
    } finally {
        state.processing = false;
    }
}

/**
 * Executes the sign-up use case: registers the user, creates its profile and opens a session.
 *
 * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
 * @returns {Promise<import('../domain/model/user.entity.js').User>} Registered user.
 * @throws {Error} When the e-mail is already registered.
 */
async function signUp(signUpCommand) {
    state.processing = true;
    try {
        const existingUsers = await iamApi.findUsersByEmail(signUpCommand.email);
        if (existingUsers.data.length > 0) throw new Error('validation.email-already-registered');
        const response = await iamApi.signUp(signUpCommand);
        const user = UserAssembler.toEntityFromResource(response.data);
        await useProfileStore().createProfileForUser(user, signUpCommand);
        startSession(user);
        state.errors = [];
        return user;
    } catch (error) {
        state.errors.push(error);
        throw error;
    } finally {
        state.processing = false;
    }
}

/**
 * Updates the contact data of the signed-in user.
 *
 * @param {Object} params - New contact data.
 * @param {string} params.fullName - Full name.
 * @param {string} params.phone - Mobile phone.
 * @returns {Promise<void>}
 */
async function updateCurrentUser({ fullName, phone }) {
    const user = state.currentUser;
    user.updateContact({ fullName, phone: new Phone(phone) });
    const resource = UserAssembler.toResourceFromEntity(user);
    await iamApi.updateUser(resource);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(resource));
}

/**
 * Clears the active session and local authentication artifacts.
 *
 * @returns {void}
 */
function signOut() {
    state.currentUser = null;
    state.errors = [];
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
}

restoreSession();

const iamStore = {
    state,
    isSignedIn,
    currentRole,
    currentUserId,
    isCarrier,
    isMerchant,
    signIn,
    signUp,
    signOut,
    updateCurrentUser
};

/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication commands and exposes the UI-facing session state.
 *
 * @returns {typeof iamStore} Store state, getters and actions.
 */
const useIamStore = () => iamStore;

export default useIamStore;
