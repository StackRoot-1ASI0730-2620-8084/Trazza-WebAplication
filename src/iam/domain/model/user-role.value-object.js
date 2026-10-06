/**
 * Immutable value object that represents the role of a Trazza user.
 *
 * @class UserRole
 */
export class UserRole {
    /** @type {string} Carrier role: owns vehicles and publishes return routes. */
    static CARRIER = 'carrier';

    /** @type {string} Merchant role: publishes freight requests. */
    static MERCHANT = 'merchant';

    /** @type {ReadonlyArray<string>} Supported roles. */
    static VALUES = Object.freeze([UserRole.CARRIER, UserRole.MERCHANT]);

    /**
     * @param {string} value - Role value.
     * @throws {Error} When the role is not supported.
     */
    constructor(value) {
        if (!UserRole.VALUES.includes(value)) throw new Error('validation.role-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Role value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True for carriers. */
    get isCarrier() {
        return this._value === UserRole.CARRIER;
    }

    /** @returns {boolean} True for merchants. */
    get isMerchant() {
        return this._value === UserRole.MERCHANT;
    }
}
