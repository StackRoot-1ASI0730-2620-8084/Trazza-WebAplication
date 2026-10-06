/**
 * Immutable value object that represents the status of a payment transaction.
 *
 * @class PaymentStatus
 */
export class PaymentStatus {
    /** @type {string} Sent to the payment gateway. */
    static PENDING = 'pending';

    /** @type {string} Approved by the payment gateway. */
    static PAID = 'paid';

    /** @type {string} Declined by the payment gateway. */
    static FAILED = 'failed';

    /** @type {ReadonlyArray<string>} Supported statuses. */
    static VALUES = Object.freeze([PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED]);

    /**
     * @param {string} value - Status value.
     * @throws {Error} When the status is not supported.
     */
    constructor(value) {
        if (!PaymentStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Status value. */
    get value() { return this._value; }

    /** @returns {boolean} True when the payment was approved. */
    get isPaid() { return this._value === PaymentStatus.PAID; }

    /** @returns {boolean} True while waiting for the gateway. */
    get isPending() { return this._value === PaymentStatus.PENDING; }
}
