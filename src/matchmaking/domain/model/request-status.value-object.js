/**
 * Immutable value object that represents the lifecycle status of a freight request.
 *
 * @class RequestStatus
 */
export class RequestStatus {
    /** @type {string} Saved but not visible to carriers. */
    static DRAFT = 'draft';

    /** @type {string} Published and receiving offers. */
    static OPEN = 'open';

    /** @type {string} A carrier was confirmed for the load. */
    static MATCHED = 'matched';

    /** @type {string} Cancelled by the merchant. */
    static CANCELLED = 'cancelled';

    /** @type {ReadonlyArray<string>} Supported statuses. */
    static VALUES = Object.freeze([RequestStatus.DRAFT, RequestStatus.OPEN, RequestStatus.MATCHED, RequestStatus.CANCELLED]);

    /**
     * @param {string} value - Status value.
     * @throws {Error} When the status is not supported.
     */
    constructor(value) {
        if (!RequestStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Status value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True when the request is published and receiving offers. */
    get isOpen() {
        return this._value === RequestStatus.OPEN;
    }

    /** @returns {boolean} True when the request is a draft. */
    get isDraft() {
        return this._value === RequestStatus.DRAFT;
    }
}
