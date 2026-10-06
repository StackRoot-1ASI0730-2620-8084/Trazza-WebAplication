/**
 * Immutable value object that represents a Peruvian mobile phone number.
 *
 * @class Phone
 */
export class Phone {
    /**
     * Pattern for a Peruvian mobile number without country code.
     * @type {RegExp}
     */
    static PATTERN = /^9\d{8}$/;

    /**
     * @param {string} value - Raw phone number, with or without the +51 prefix.
     * @throws {Error} When the phone is not a valid Peruvian mobile number.
     */
    constructor(value) {
        const digits = (value ?? '').replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '');
        if (!Phone.PATTERN.test(digits)) throw new Error('validation.phone-invalid');
        this._value = digits;
        Object.freeze(this);
    }

    /** @returns {string} Nine-digit mobile number. */
    get value() {
        return this._value;
    }

    /** @returns {string} International format, for example "+51 987 654 321". */
    get formatted() {
        return `+51 ${this._value.slice(0, 3)} ${this._value.slice(3, 6)} ${this._value.slice(6)}`;
    }
}
