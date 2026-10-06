export class ReceiptType {
    static BOLETA = 'boleta';

    static FACTURA = 'factura';

    static RULES = Object.freeze({
        boleta: Object.freeze({ series: 'B001', documentPattern: /^\d{8}$/ }),
        factura: Object.freeze({ series: 'F001', documentPattern: /^(10|20)\d{9}$/ })
    });

    constructor(value) {
        if (!Object.hasOwn(ReceiptType.RULES, value)) throw new Error('validation.receipt-type-invalid');
        this._value = value;
        Object.freeze(this);
    }

    get value() { return this._value; }

    get series() { return ReceiptType.RULES[this._value].series; }

    acceptsDocument(documentNumber) {
        return ReceiptType.RULES[this._value].documentPattern.test(documentNumber ?? '');
    }
}
