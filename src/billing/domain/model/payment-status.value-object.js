export class PaymentStatus {
    static PENDING = 'pending';

    static PAID = 'paid';

    static FAILED = 'failed';

    static VALUES = Object.freeze([PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED]);

    constructor(value) {
        if (!PaymentStatus.VALUES.includes(value)) throw new Error('validation.status-invalid');
        this._value = value;
        Object.freeze(this);
    }

    get value() { return this._value; }

    get isPaid() { return this._value === PaymentStatus.PAID; }

    get isPending() { return this._value === PaymentStatus.PENDING; }
}
