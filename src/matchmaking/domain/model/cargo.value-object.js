import {CargoType} from "./cargo-type.value-object.js";

/**
 * Immutable value object that describes the goods of a freight request.
 *
 * @class Cargo
 */
export class Cargo {
    /**
     * Maximum weight accepted for a single freight request in kilograms.
     * @type {number}
     */
    static MAX_WEIGHT_KG = 30000;

    /**
     * @param {Object} params - Value object attributes.
     * @param {CargoType} params.type - Type of goods.
     * @param {number} params.weightKg - Weight in kilograms.
     * @param {number} [params.volumeM3=0] - Volume in cubic meters.
     * @param {string} [params.description=''] - Free description of the goods.
     * @throws {Error} When the weight or volume are out of range.
     */
    constructor({ type, weightKg, volumeM3 = 0, description = '' }) {
        if (!(type instanceof CargoType)) throw new Error('validation.cargo-type-invalid');
        const weight = Number(weightKg);
        const volume = Number(volumeM3 ?? 0);
        if (!Number.isFinite(weight) || weight <= 0 || weight > Cargo.MAX_WEIGHT_KG) throw new Error('validation.cargo-weight-invalid');
        if (!Number.isFinite(volume) || volume < 0) throw new Error('validation.cargo-volume-invalid');
        if ((description ?? '').length > 280) throw new Error('validation.description-too-long');
        this._type = type;
        this._weightKg = weight;
        this._volumeM3 = volume;
        this._description = (description ?? '').trim();
        Object.freeze(this);
    }

    /** @returns {CargoType} Type of goods. */
    get type() {
        return this._type;
    }

    /** @returns {number} Weight in kilograms. */
    get weightKg() {
        return this._weightKg;
    }

    /** @returns {number} Volume in cubic meters. */
    get volumeM3() {
        return this._volumeM3;
    }

    /** @returns {string} Description. */
    get description() {
        return this._description;
    }
}
