import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the IAM endpoints.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    /** Creates the endpoint client for users. */
    constructor() {
        super();
        this._usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }

    /**
     * Validates the credentials of a sign-in command against the users collection.
     *
     * @param {import('../domain/commands/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the matching users.
     */
    signIn(signInCommand) {
        return this._usersEndpoint.getAll({ email: signInCommand.email, password: signInCommand.password });
    }

    /**
     * Finds users registered with an e-mail.
     *
     * @param {string} email - Normalized e-mail.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the matching users.
     */
    findUsersByEmail(email) {
        return this._usersEndpoint.getAll({ email });
    }

    /**
     * Registers a new user from a sign-up command.
     *
     * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created user.
     */
    signUp(signUpCommand) {
        return this._usersEndpoint.create({
            fullName: signUpCommand.fullName,
            email: signUpCommand.email,
            phone: signUpCommand.phone,
            role: signUpCommand.role,
            password: signUpCommand.password,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * @param {number} id - User identifier.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the user.
     */
    getUserById(id) {
        return this._usersEndpoint.getById(id);
    }

    /**
     * Partially updates a user keeping its credentials.
     *
     * @param {Object} resource - User resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated user.
     */
    updateUser(resource) {
        return this._usersEndpoint.getById(resource.id)
            .then(response => this._usersEndpoint.update(resource.id, { ...response.data, ...resource }));
    }
}
