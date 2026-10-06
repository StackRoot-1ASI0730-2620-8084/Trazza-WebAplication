/**
 * Immutable value object that represents the category of an incident.
 *
 * @class IncidentType
 */
export class IncidentType {
    /** @type {ReadonlyArray<string>} Supported incident types. */
    static VALUES = Object.freeze(['damaged_goods', 'missing_items', 'delay', 'vehicle_breakdown', 'wrong_address', 'other']);

    /**
     * @param {string} value - Incident type value.
     * @throws {Error} When the type is not supported.
     */
    constructor(value) {
        if (!IncidentType.VALUES.includes(value)) throw new Error('validation.incident-type-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Incident type value. */
    get value() {
        return this._value;
    }
}
