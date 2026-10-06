import {Money} from "../../../shared/domain/model/money.value-object.js";

export class SubscriptionPlan {
    static FREE = 'free';

    static PRO = 'pro';

    static CATALOG = Object.freeze({
        free: Object.freeze({ price: 0, monthlyPublications: 5 }),
        pro: Object.freeze({ price: 39.9, monthlyPublications: null })
    });

    constructor(code) {
        if (!Object.hasOwn(SubscriptionPlan.CATALOG, code)) throw new Error('validation.plan-invalid');
        this._code = code;
        Object.freeze(this);
    }

    get code() {
        return this._code;
    }

    get price() {
        return new Money({ amount: SubscriptionPlan.CATALOG[this._code].price });
    }

    get monthlyPublications() {
        return SubscriptionPlan.CATALOG[this._code].monthlyPublications;
    }

    get isFree() {
        return this._code === SubscriptionPlan.FREE;
    }

    allowsPublication(usedThisMonth) {
        return this.monthlyPublications === null || usedThisMonth < this.monthlyPublications;
    }
}
