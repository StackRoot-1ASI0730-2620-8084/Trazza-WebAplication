import {Money} from "../../../shared/domain/model/money.value-object.js";
import {SubscriptionPlan} from "./subscription-plan.value-object.js";
import {PaymentMethod} from "./payment-method.value-object.js";
import {PaymentStatus} from "./payment-status.value-object.js";

export class PaymentTransaction {
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

    get id() { return this._id; }

    get userId() { return this._userId; }

    get plan() { return this._plan; }

    get amount() { return this._amount; }

    get method() { return this._method; }

    get status() { return this._status; }

    get authorizationCode() { return this._authorizationCode; }

    get createdAt() { return this._createdAt; }

    get paidAt() { return this._paidAt; }

    get periodStart() { return this._periodStart; }

    get periodEnd() { return this._periodEnd; }

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

    markFailed() {
        if (!this._status.isPending) throw new Error('validation.transaction-not-pending');
        this._status = new PaymentStatus(PaymentStatus.FAILED);
    }

    covers(today) {
        return this._status.isPaid && this._periodStart <= today && today <= this._periodEnd;
    }
}
