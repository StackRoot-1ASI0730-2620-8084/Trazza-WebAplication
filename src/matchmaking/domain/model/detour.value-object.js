/**
 * Immutable value object that represents the extra distance and time a carrier travels to serve a load.
 *
 * @class Detour
 */
export class Detour {
    /**
     * @param {Object} params - Value object attributes.
     * @param {number} params.distanceKm - Extra distance in kilometers.
     * @param {number} params.durationMinutes - Extra time in minutes.
     * @throws {Error} When a value is negative.
     */
    constructor({ distanceKm, durationMinutes }) {
        const distance = Number(distanceKm);
        const duration = Number(durationMinutes);
        if (!Number.isFinite(distance) || distance < 0) throw new Error('validation.detour-invalid');
        if (!Number.isFinite(duration) || duration < 0) throw new Error('validation.detour-invalid');
        this._distanceKm = Math.round(distance * 10) / 10;
        this._durationMinutes = Math.round(duration);
        Object.freeze(this);
    }

    /** @returns {number} Extra distance in kilometers. */
    get distanceKm() {
        return this._distanceKm;
    }

    /** @returns {number} Extra time in minutes. */
    get durationMinutes() {
        return this._durationMinutes;
    }

    /** @returns {string} Label, for example "+1.8 km (+12 min)". */
    get label() {
        return `+${this._distanceKm} km (+${this._durationMinutes} min)`;
    }

    /**
     * @param {number} maxDistanceKm - Maximum detour accepted by the carrier.
     * @returns {boolean} True when the detour is within the limit.
     */
    isWithin(maxDistanceKm) {
        return this._distanceKm <= maxDistanceKm;
    }
}
