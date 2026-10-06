import {Money} from "../../../shared/domain/model/money.value-object.js";

/**
 * Immutable value object that represents a Trazza subscription plan.
 * Trazza charges only its own subscription; freight rates are agreed between the parties without commission.
 *
 * @class SubscriptionPlan
 */
export class SubscriptionPlan {
    /** @type {string} Free plan code. */
    static FREE = 'free';

    /** @type {string} Pro plan code. */
    static PRO = 'pro';

    /** @type {Readonly<Record<string, {price: number, monthlyPublications: ?number}>>} Plan catalog. */
    static CATALOG = Object.freeze({
        free: Object.freeze({ price: 0, monthlyPublications: 5 }),
        pro: Object.freeze({ price: 39.9, monthlyPublications: null })
    });

    /**
     * @param {string} code - Plan code.
     * @throws {Error} When the plan does not exist.
     */
    constructor(code) {
        if (!Object.hasOwn(SubscriptionPlan.CATALOG, code)) throw new Error('validation.plan-invalid');
        this._code = code;
        Object.freeze(this);
    }

    /** @returns {string} Plan code. */
    get code() {
        return this._code;
    }

    /** @returns {Money} Monthly price. */
    get price() {
        return new Money({ amount: SubscriptionPlan.CATALOG[this._code].price });
    }

    /** @returns {?number} Monthly publications allowed, null when unlimited. */
    get monthlyPublications() {
        return SubscriptionPlan.CATALOG[this._code].monthlyPublications;
    }

    /** @returns {boolean} True for the free plan. */
    get isFree() {
        return this._code === SubscriptionPlan.FREE;
    }

    /**
     * @param {number} usedThisMonth - Publications already created this month.
     * @returns {boolean} True when one more publication is allowed.
     */
    allowsPublication(usedThisMonth) {
        return this.monthlyPublications === null || usedThisMonth < this.monthlyPublications;
    }
}
