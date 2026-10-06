/**
 * Immutable value object that represents the load capacity of a vehicle.
 *
 * @class LoadCapacity
 */
export class LoadCapacity {
    /**
     * Maximum payload accepted for urban freight vehicles in kilograms.
     * @type {number}
     */
    static MAX_WEIGHT_KG = 30000;

    /**
     * Maximum cargo volume accepted in cubic meters.
     * @type {number}
     */
    static MAX_VOLUME_M3 = 120;

    /**
     * @param {Object} params - Value object attributes.
     * @param {number} params.weightKg - Payload in kilograms.
     * @param {number} params.volumeM3 - Cargo volume in cubic meters.
     * @throws {Error} When the weight or the volume are out of range.
     */
    constructor({ weightKg, volumeM3 }) {
        const weight = Number(weightKg);
        const volume = Number(volumeM3);
        if (!Number.isFinite(weight) || weight <= 0 || weight > LoadCapacity.MAX_WEIGHT_KG) throw new Error('validation.capacity-weight-invalid');
        if (!Number.isFinite(volume) || volume <= 0 || volume > LoadCapacity.MAX_VOLUME_M3) throw new Error('validation.capacity-volume-invalid');
        this._weightKg = weight;
        this._volumeM3 = volume;
        Object.freeze(this);
    }

    /** @returns {number} Payload in kilograms. */
    get weightKg() {
        return this._weightKg;
    }

    /** @returns {number} Cargo volume in cubic meters. */
    get volumeM3() {
        return this._volumeM3;
    }

    /**
     * @param {number} weightKg - Requested weight.
     * @param {number} [volumeM3=0] - Requested volume.
     * @returns {boolean} True when the requested load fits.
     */
    canHold(weightKg, volumeM3 = 0) {
        return weightKg <= this._weightKg && volumeM3 <= this._volumeM3;
    }
}
