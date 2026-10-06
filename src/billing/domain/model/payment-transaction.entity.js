import {Money} from "../../../shared/domain/model/money.value-object.js";
import {SubscriptionPlan} from "./subscription-plan.value-object.js";
import {PaymentMethod} from "./payment-method.value-object.js";
import {PaymentStatus} from "./payment-status.value-object.js";

/**
 * Payment transaction aggregate root. It represents the charge of a subscription period.
 *
 * @class PaymentTransaction
 */
export class PaymentTransaction {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Transaction identifier.
     * @param {number} params.userId - Paying user identifier.
     * @param {SubscriptionPlan} params.plan - Purchased plan.
     * @param {Money} params.amount - Charged amount.
     * @param {PaymentMethod} params.method - Payment method.
     * @param {PaymentStatus} params.status - Status.
     * @param {?string} [params.authorizationCode=null] - Gateway authorization code.
     * @param {?string} [params.createdAt=null] - Creation date-time.
     * @param {?string} [params.paidAt=null] - Approval date-time.
     * @param {?string} [params.periodStart=null] - First day of the paid period (YYYY-MM-DD).
     * @param {?string} [params.periodEnd=null] - Last day of the paid period (YYYY-MM-DD).
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, userId, plan, amount, method, status, authorizationCode = null, createdAt = null,
                    paidAt = null, periodStart = null, periodEnd = null }) {
        if (userId === null || userId === undefined) throw new Error('validation.user-required');
        if (!(plan instanceof SubscriptionPlan)) throw new Error('validation.plan-invalid');
        if (!(amount instanceof Money)) throw new Error('validation.money-invalid');
        if (!amount.equals(plan.price)) throw new Error('validation.amount-mismatch');
        if (!(method instanceof PaymentMethod)) throw new Error('validation.card-number-invalid');
        if (!(status instanceof PaymentStatus)) throw new Error('validation.status-invalid');
        this._id = id;
        this._userId = userId;
        this._plan = plan;
        this._amount = amount;
        this._method = method;
        this._status = status;
        this._authorizationCode = authorizationCode;
        this._createdAt = createdAt;
        this._paidAt = paidAt;
        this._periodStart = periodStart;
        this._periodEnd = periodEnd;
    }

    /**
     * Factory that starts the charge of a paid plan.
     *
     * @param {Object} params - Creation data.
     * @param {number} params.userId - Paying user identifier.
     * @param {SubscriptionPlan} params.plan - Plan to purchase.
     * @param {PaymentMethod} params.method - Payment method.
     * @returns {PaymentTransaction} Pending transaction.
     * @throws {Error} When the plan is free.
     */
    static create({ userId, plan, method }) {
        if (plan.isFree) throw new Error('validation.plan-free-not-chargeable');
        return new PaymentTransaction({
            userId,
            plan,
            amount: plan.price,
            method,
            status: new PaymentStatus(PaymentStatus.PENDING),
            createdAt: new Date().toISOString()
        });
    }

    /** @returns {?number} Transaction identifier. */
    get id() { return this._id; }

    /** @returns {number} User identifier. */
    get userId() { return this._userId; }

    /** @returns {SubscriptionPlan} Plan. */
    get plan() { return this._plan; }

    /** @returns {Money} Amount. */
    get amount() { return this._amount; }

    /** @returns {PaymentMethod} Payment method. */
    get method() { return this._method; }

    /** @returns {PaymentStatus} Status. */
    get status() { return this._status; }

    /** @returns {?string} Authorization code. */
    get authorizationCode() { return this._authorizationCode; }

    /** @returns {?string} Creation date-time. */
    get createdAt() { return this._createdAt; }

    /** @returns {?string} Approval date-time. */
    get paidAt() { return this._paidAt; }

    /** @returns {?string} First day of the period. */
    get periodStart() { return this._periodStart; }

    /** @returns {?string} Last day of the period. */
    get periodEnd() { return this._periodEnd; }

    /**
     * Marks the transaction as approved and sets a one-month subscription period.
     *
     * @param {string} authorizationCode - Gateway authorization code.
     * @param {Date} [now=new Date()] - Approval date.
     * @returns {void}
     * @throws {Error} When the transaction is not pending.
     */
    markPaid(authorizationCode, now = new Date()) {
        if (!this._status.isPending) throw new Error('validation.transaction-not-pending');
        if (!authorizationCode) throw new Error('validation.authorization-required');
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        this._status = new PaymentStatus(PaymentStatus.PAID);
        this._authorizationCode = authorizationCode;
        this._paidAt = now.toISOString();
        this._periodStart = now.toLocaleDateString('en-CA');
        this._periodEnd = end.toLocaleDateString('en-CA');
    }

    /**
     * Marks the transaction as declined.
     *
     * @returns {void}
     * @throws {Error} When the transaction is not pending.
     */
    markFailed() {
        if (!this._status.isPending) throw new Error('validation.transaction-not-pending');
        this._status = new PaymentStatus(PaymentStatus.FAILED);
    }

    /**
     * @param {string} today - ISO local date.
     * @returns {boolean} True when the transaction is paid and covers the given date.
     */
    covers(today) {
        return this._status.isPaid && this._periodStart <= today && today <= this._periodEnd;
    }
}
