/**
 * Immutable value object that represents a Peruvian vehicle license plate.
 *
 * @class LicensePlate
 */
export class LicensePlate {
    /**
     * Pattern of a plate after normalization, for example "ABC-123".
     * @type {RegExp}
     */
    static PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;

    /**
     * @param {string} value - Raw plate, with or without hyphen.
     * @throws {Error} When the plate format is invalid.
     */
    constructor(value) {
        const compact = (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const normalized = compact.length === 6 ? `${compact.slice(0, 3)}-${compact.slice(3)}` : compact;
        if (!LicensePlate.PATTERN.test(normalized)) throw new Error('validation.plate-invalid');
        this._value = normalized;
        Object.freeze(this);
    }

    /** @returns {string} Normalized plate. */
    get value() {
        return this._value;
    }

    /**
     * @param {LicensePlate} other - Plate to compare.
     * @returns {boolean} True when both plates are equal.
     */
    equals(other) {
        return other instanceof LicensePlate && other.value === this._value;
    }
}
