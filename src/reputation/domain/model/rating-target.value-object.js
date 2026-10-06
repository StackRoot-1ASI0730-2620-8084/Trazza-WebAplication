/**
 * Immutable value object that identifies the party being rated.
 *
 * @class RatingTarget
 */
export class RatingTarget {
    /** @type {Readonly<Record<string, ReadonlyArray<string>>>} Highlight tags available per rated role. */
    static TAGS = Object.freeze({
        carrier: Object.freeze(['on_time', 'careful_with_goods', 'friendly', 'good_communication']),
        merchant: Object.freeze(['on_time_pickup', 'accurate_load_info', 'friendly', 'good_communication'])
    });

    /**
     * @param {Object} params - Value object attributes.
     * @param {number} params.userId - Rated user identifier.
     * @param {string} params.role - Rated role ("carrier" or "merchant").
     * @param {string} [params.name=''] - Display name snapshot.
     * @throws {Error} When the user or role are invalid.
     */
    constructor({ userId, role, name = '' }) {
        if (userId === null || userId === undefined) throw new Error('validation.user-required');
        if (!Object.hasOwn(RatingTarget.TAGS, role)) throw new Error('validation.party-invalid');
        this._userId = userId;
        this._role = role;
        this._name = name ?? '';
        Object.freeze(this);
    }

    /** @returns {number} Rated user identifier. */
    get userId() { return this._userId; }

    /** @returns {string} Rated role. */
    get role() { return this._role; }

    /** @returns {string} Display name. */
    get name() { return this._name; }

    /** @returns {ReadonlyArray<string>} Tags allowed for this target. */
    get allowedTags() {
        return RatingTarget.TAGS[this._role];
    }
}
