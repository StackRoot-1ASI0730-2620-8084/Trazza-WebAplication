/**
 * Immutable value object that represents the type of a Peruvian electronic payment receipt.
 * A boleta is issued to a person identified by DNI and a factura to a taxpayer identified by RUC.
 *
 * @class ReceiptType
 */
export class ReceiptType {
    /** @type {string} Boleta de venta electrónica. */
    static BOLETA = 'boleta';

    /** @type {string} Factura electrónica. */
    static FACTURA = 'factura';

    /** @type {Readonly<Record<string, {series: string, documentPattern: RegExp}>>} Rules per receipt type. */
    static RULES = Object.freeze({
        boleta: Object.freeze({ series: 'B001', documentPattern: /^\d{8}$/ }),
        factura: Object.freeze({ series: 'F001', documentPattern: /^(10|20)\d{9}$/ })
    });

    /**
     * @param {string} value - Receipt type value.
     * @throws {Error} When the receipt type is not supported.
     */
    constructor(value) {
        if (!Object.hasOwn(ReceiptType.RULES, value)) throw new Error('validation.receipt-type-invalid');
        this._value = value;
        Object.freeze(this);
    }

    /** @returns {string} Receipt type value. */
    get value() { return this._value; }

    /** @returns {string} Series of the receipt type. */
    get series() { return ReceiptType.RULES[this._value].series; }

    /**
     * @param {string} documentNumber - Customer document.
     * @returns {boolean} True when the document is valid for this receipt type (DNI for boleta, RUC for factura).
     */
    acceptsDocument(documentNumber) {
        return ReceiptType.RULES[this._value].documentPattern.test(documentNumber ?? '');
    }
}
