/**
 * Immutable value object that represents the lifecycle status of a return route.
 *
 * @class RouteStatus
 */
export class RouteStatus {
    /** @type {string} The route accepts new loads. */
    static ACTIVE = 'active';

    /** @type {string} The route has no free capacity left. */
    static MATCHED = 'matched';

    /** @type {string} The carrier closed the route. */
    static CLOSED = 'closed';

    /** @type {ReadonlyArray<string>} Supported statuses. */
    static VALUES = Object.freeze([RouteStatus.ACTIVE, RouteStatus.MATCHED, RouteStatus.CLOSED]);

    /**
     * @param {string} value - Status value.
     * @throws {Error} When the status is not supported.
     */
    constructor(value) {
        if (!RouteStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Status value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True when the route accepts new loads. */
    get isActive() {
        return this._value === RouteStatus.ACTIVE;
    }
}
