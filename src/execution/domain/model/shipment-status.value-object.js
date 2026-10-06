/**
 * Immutable value object that represents the execution status of a shipment.
 *
 * @class ShipmentStatus
 */
export class ShipmentStatus {
    /** @type {string} Match confirmed, waiting for pickup. */
    static MATCHED = 'matched';

    /** @type {string} The carrier picked up the goods. */
    static PICKED_UP = 'picked_up';

    /** @type {string} The vehicle is moving towards the delivery point. */
    static IN_TRANSIT = 'in_transit';

    /** @type {string} The carrier marked the shipment as delivered. */
    static DELIVERED = 'delivered';

    /** @type {string} The merchant confirmed the reception and the shipment is closed. */
    static CLOSED = 'closed';

    /** @type {string} The shipment was cancelled before pickup. */
    static CANCELLED = 'cancelled';

    /** @type {ReadonlyArray<string>} Supported statuses in lifecycle order. */
    static VALUES = Object.freeze([
        ShipmentStatus.MATCHED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.CLOSED,
        ShipmentStatus.CANCELLED
    ]);

    /**
     * @param {string} value - Status value.
     * @throws {Error} When the status is not supported.
     */
    constructor(value) {
        if (!ShipmentStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Status value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True while the shipment is being executed. */
    get isActive() {
        return [ShipmentStatus.MATCHED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT].includes(this._value);
    }

    /** @returns {boolean} True once the goods left the pickup point and before delivery. */
    get isMoving() {
        return this._value === ShipmentStatus.PICKED_UP || this._value === ShipmentStatus.IN_TRANSIT;
    }

    /** @returns {boolean} True once the goods were delivered. */
    get isDelivered() {
        return this._value === ShipmentStatus.DELIVERED || this._value === ShipmentStatus.CLOSED;
    }

    /** @returns {number} Completed step of the tracking stepper (1 matched … 4 delivered, 0 cancelled). */
    get step() {
        const steps = { matched: 1, picked_up: 2, in_transit: 3, delivered: 4, closed: 4, cancelled: 0 };
        return steps[this._value];
    }
}
