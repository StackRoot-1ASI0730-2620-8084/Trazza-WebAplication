/**
 * Immutable value object that represents a category of goods.
 *
 * @class CargoType
 */
export class CargoType {
    /** @type {ReadonlyArray<string>} Supported cargo types. */
    static VALUES = Object.freeze(['general', 'textiles', 'food', 'fragile', 'hardware', 'electronics']);

    /**
     * @param {string} value - Cargo type value.
     * @throws {Error} When the cargo type is not supported.
     */
    constructor(value) {
        if (!CargoType.VALUES.includes(value)) throw new Error('validation.cargo-type-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Cargo type value. */
    get value() {
        return this._value;
    }

    /**
     * @param {CargoType} other - Cargo type to compare.
     * @returns {boolean} True when both types are equal.
     */
    equals(other) {
        return other instanceof CargoType && other.value === this._value;
    }
}
