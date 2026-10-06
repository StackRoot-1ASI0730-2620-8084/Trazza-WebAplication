/**
 * Immutable value object that represents a Peruvian national identity document (DNI).
 *
 * @class Dni
 */
export class Dni {
    /**
     * Pattern of a DNI: exactly eight digits.
     * @type {RegExp}
     */
    static PATTERN = /^\d{8}$/;

    /**
     * @param {string} value - Raw DNI number.
     * @throws {Error} When the DNI does not have eight digits.
     */
    constructor(value) {
        const normalized = (value ?? '').toString().trim();
        if (!Dni.PATTERN.test(normalized)) throw new Error('validation.dni-invalid');
        this._value = normalized;
        Object.freeze(this);
    }

    /** @returns {string} DNI number. */
    get value() {
        return this._value;
    }
}
