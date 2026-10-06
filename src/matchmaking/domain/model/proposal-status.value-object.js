/**
 * Immutable value object that represents the negotiation status of a match proposal.
 *
 * @class ProposalStatus
 */
export class ProposalStatus {
    /** @type {string} Waiting for the counterpart to answer the first offer. */
    static PENDING = 'pending';

    /** @type {string} The counterpart proposed another rate. */
    static COUNTEROFFER = 'counteroffer';

    /** @type {string} Both parties agreed the rate; waiting for the merchant confirmation. */
    static ACCEPTED = 'accepted';

    /** @type {string} The merchant confirmed the match. */
    static MATCHED = 'matched';

    /** @type {string} One party rejected the proposal. */
    static REJECTED = 'rejected';

    /** @type {string} Closed because another carrier was matched or the request was cancelled. */
    static CLOSED = 'closed';

    /** @type {ReadonlyArray<string>} Supported statuses. */
    static VALUES = Object.freeze([
        ProposalStatus.PENDING,
        ProposalStatus.COUNTEROFFER,
        ProposalStatus.ACCEPTED,
        ProposalStatus.MATCHED,
        ProposalStatus.REJECTED,
        ProposalStatus.CLOSED
    ]);

    /**
     * @param {string} value - Status value.
     * @throws {Error} When the status is not supported.
     */
    constructor(value) {
        if (!ProposalStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Status value. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True while the negotiation can still change. */
    get isNegotiating() {
        return this._value === ProposalStatus.PENDING || this._value === ProposalStatus.COUNTEROFFER;
    }

    /** @returns {boolean} True while the proposal is not finished. */
    get isOpen() {
        return this.isNegotiating || this._value === ProposalStatus.ACCEPTED;
    }
}
