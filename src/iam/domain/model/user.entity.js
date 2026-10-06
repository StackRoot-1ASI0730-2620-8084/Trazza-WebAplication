import {Email} from "./email.value-object.js";
import {Phone} from "./phone.value-object.js";
import {UserRole} from "./user-role.value-object.js";

/**
 * User aggregate root of the IAM & Profiles bounded context.
 *
 * @class User
 */
export class User {
    /**
     * Minimum length accepted for the full name.
     * @type {number}
     */
    static MIN_NAME_LENGTH = 3;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - User identifier.
     * @param {string} params.fullName - Full name of the person or legal representative.
     * @param {Email} params.email - Unique e-mail address.
     * @param {Phone} params.phone - Mobile phone.
     * @param {UserRole} params.role - Role of the user.
     * @param {?string} [params.createdAt=null] - ISO creation date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, fullName, email, phone, role, createdAt = null }) {
        const normalizedName = (fullName ?? '').trim();
        if (normalizedName.length < User.MIN_NAME_LENGTH) throw new Error('validation.full-name-required');
        if (!(email instanceof Email)) throw new Error('validation.email-invalid');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        if (!(role instanceof UserRole)) throw new Error('validation.role-invalid');
        this._id = id;
        this._fullName = normalizedName;
        this._email = email;
        this._phone = phone;
        this._role = role;
        this._createdAt = createdAt;
    }

    /** @returns {?number} User identifier. */
    get id() {
        return this._id;
    }

    /** @returns {string} Full name. */
    get fullName() {
        return this._fullName;
    }

    /** @returns {Email} E-mail. */
    get email() {
        return this._email;
    }

    /** @returns {Phone} Phone. */
    get phone() {
        return this._phone;
    }

    /** @returns {UserRole} Role. */
    get role() {
        return this._role;
    }

    /** @returns {?string} ISO creation date-time. */
    get createdAt() {
        return this._createdAt;
    }

    /** @returns {boolean} True for carriers. */
    get isCarrier() {
        return this._role.isCarrier;
    }

    /** @returns {boolean} True for merchants. */
    get isMerchant() {
        return this._role.isMerchant;
    }

    /**
     * Updates the contact information of the user.
     *
     * @param {Object} params - New contact data.
     * @param {string} params.fullName - New full name.
     * @param {Phone} params.phone - New phone.
     * @returns {void}
     * @throws {Error} When the new data is invalid.
     */
    updateContact({ fullName, phone }) {
        const normalizedName = (fullName ?? '').trim();
        if (normalizedName.length < User.MIN_NAME_LENGTH) throw new Error('validation.full-name-required');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        this._fullName = normalizedName;
        this._phone = phone;
    }
}
