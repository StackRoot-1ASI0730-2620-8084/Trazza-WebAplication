/**
 * Immutable value object that represents a normalized e-mail address.
 *
 * @class Email
 */
export class Email {
    /**
     * Pattern used to validate e-mail addresses.
     * @type {RegExp}
     */
    static PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /**
     * @param {string} value - Raw e-mail address.
     * @throws {Error} When the e-mail format is invalid.
     */
    constructor(value) {
        const normalized = (value ?? '').trim().toLowerCase();
        if (!Email.PATTERN.test(normalized)) throw new Error('validation.email-invalid');
        this._value = normalized;
        Object.freeze(this);
    }

    /** @returns {string} Normalized e-mail address. */
    get value() {
        return this._value;
    }

    /**
     * @param {Email} other - E-mail to compare.
     * @returns {boolean} True when both e-mails are equal.
     */
    equals(other) {
        return other instanceof Email && other.value === this._value;
    }
}
