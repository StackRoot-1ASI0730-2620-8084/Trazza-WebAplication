/**
 * Immutable value object that represents a star score from 1 to 5.
 *
 * @class Score
 */
export class Score {
    /** @type {number} Lowest score. */
    static MIN = 1;

    /** @type {number} Highest score. */
    static MAX = 5;

    /**
     * @param {number} value - Number of stars.
     * @throws {Error} When the score is not an integer between 1 and 5.
     */
    constructor(value) {
        const stars = Number(value);
        if (!Number.isInteger(stars) || stars < Score.MIN || stars > Score.MAX) throw new Error('validation.score-invalid');
        this._value = stars;
        Object.freeze(this);
    }

    /** @returns {number} Number of stars. */
    get value() {
        return this._value;
    }

    /** @returns {boolean} True for 4 or 5 stars. */
    get isPositive() {
        return this._value >= 4;
    }
}
