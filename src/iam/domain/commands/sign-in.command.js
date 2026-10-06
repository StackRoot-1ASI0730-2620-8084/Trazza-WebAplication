import {Email} from "../model/email.value-object.js";

/**
 * Command that carries the credentials of a sign-in attempt.
 *
 * @class SignInCommand
 */
export class SignInCommand {
    /**
     * @param {Object} params - Command attributes.
     * @param {string} params.email - Registered e-mail.
     * @param {string} params.password - Password.
     * @throws {Error} When a field is missing or invalid.
     */
    constructor({ email, password }) {
        this._email = new Email(email);
        if (!password) throw new Error('validation.password-required');
        this._password = password;
        Object.freeze(this);
    }

    /** @returns {string} Normalized e-mail. */
    get email() {
        return this._email.value;
    }

    /** @returns {string} Password. */
    get password() {
        return this._password;
    }
}
