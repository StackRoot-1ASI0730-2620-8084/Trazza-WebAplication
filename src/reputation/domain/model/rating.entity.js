import {Score} from "./score.value-object.js";
import {RatingTarget} from "./rating-target.value-object.js";

/**
 * Rating aggregate root. It records the evaluation one party gives to the other after a shipment.
 *
 * @class Rating
 */
export class Rating {
    /** @type {number} Maximum comment length. */
    static MAX_COMMENT_LENGTH = 300;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Rating identifier.
     * @param {number} params.shipmentId - Rated shipment identifier.
     * @param {number} params.raterId - User identifier of the rater.
     * @param {string} params.raterName - Display name of the rater.
     * @param {RatingTarget} params.target - Rated party.
     * @param {Score} params.score - Stars.
     * @param {string[]} [params.tags=[]] - Highlight tags.
     * @param {string} [params.comment=''] - Optional comment.
     * @param {?string} [params.createdAt=null] - Creation date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, shipmentId, raterId, raterName = '', target, score, tags = [], comment = '', createdAt = null }) {
        if (shipmentId === null || shipmentId === undefined) throw new Error('validation.shipment-required');
        if (raterId === null || raterId === undefined) throw new Error('validation.user-required');
        if (!(target instanceof RatingTarget)) throw new Error('validation.party-invalid');
        if (target.userId === raterId) throw new Error('validation.cannot-rate-yourself');
        if (!(score instanceof Score)) throw new Error('validation.score-invalid');
        const uniqueTags = [...new Set(tags ?? [])];
        if (!uniqueTags.every(tag => target.allowedTags.includes(tag))) throw new Error('validation.rating-tag-invalid');
        const text = (comment ?? '').trim();
        if (text.length > Rating.MAX_COMMENT_LENGTH) throw new Error('validation.description-too-long');
        this._id = id;
        this._shipmentId = shipmentId;
        this._raterId = raterId;
        this._raterName = raterName ?? '';
        this._target = target;
        this._score = score;
        this._tags = Object.freeze(uniqueTags);
        this._comment = text;
        this._createdAt = createdAt ?? new Date().toISOString();
    }

    /** @returns {?number} Rating identifier. */
    get id() { return this._id; }

    /** @returns {number} Shipment identifier. */
    get shipmentId() { return this._shipmentId; }

    /** @returns {number} Rater user identifier. */
    get raterId() { return this._raterId; }

    /** @returns {string} Rater name. */
    get raterName() { return this._raterName; }

    /** @returns {RatingTarget} Rated party. */
    get target() { return this._target; }

    /** @returns {Score} Score. */
    get score() { return this._score; }

    /** @returns {ReadonlyArray<string>} Tags. */
    get tags() { return this._tags; }

    /** @returns {string} Comment. */
    get comment() { return this._comment; }

    /** @returns {string} Creation date-time. */
    get createdAt() { return this._createdAt; }
}
