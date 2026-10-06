/**
 * Immutable value object that represents a Peruvian taxpayer number (RUC).
 *
 * @class Ruc
 */
export class Ruc {
    /**
     * Pattern of a RUC: eleven digits starting with 10 (natural person) or 20 (company).
     * @type {RegExp}
     */
    static PATTERN = /^(10|20)\d{9}$/;

    /**
     * @param {string} value - Raw RUC number.
     * @throws {Error} When the RUC format is invalid.
     */
    constructor(value) {
        const normalized = (value ?? '').toString().trim();
        if (!Ruc.PATTERN.test(normalized)) throw new Error('validation.ruc-invalid');
        this._value = normalized;
        Object.freeze(this);
    }

    /** @returns {string} RUC number. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True when the RUC belongs to a company (prefix 20). */
    get isCompany() {
        return this._value.startsWith('20');
    }
}
