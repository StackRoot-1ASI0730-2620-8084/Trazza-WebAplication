import {Money} from "../../../shared/domain/model/money.value-object.js";
import {ReceiptType} from "./receipt-type.value-object.js";

/**
 * Receipt aggregate root. It represents the electronic receipt (boleta or factura) issued for a paid transaction.
 *
 * @class Receipt
 */
export class Receipt {
    /** @type {number} Peruvian general sales tax rate (IGV). */
    static IGV_RATE = 0.18;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Receipt identifier.
     * @param {number} params.transactionId - Paid transaction identifier.
     * @param {number} params.userId - Customer user identifier.
     * @param {ReceiptType} params.type - Receipt type.
     * @param {number} params.number - Correlative number inside the series.
     * @param {string} params.customerName - Customer name or business name.
     * @param {string} params.customerDocument - DNI for boleta, RUC for factura.
     * @param {Money} params.total - Total amount including IGV.
     * @param {string} params.issuedAt - Issue date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, transactionId, userId, type, number, customerName, customerDocument, total, issuedAt }) {
        if (transactionId === null || transactionId === undefined) throw new Error('validation.transaction-required');
        if (userId === null || userId === undefined) throw new Error('validation.user-required');
        if (!(type instanceof ReceiptType)) throw new Error('validation.receipt-type-invalid');
        if (!Number.isInteger(Number(number)) || Number(number) <= 0) throw new Error('validation.receipt-number-invalid');
        if ((customerName ?? '').trim().length < 3) throw new Error('validation.customer-name-required');
        if (!type.acceptsDocument(customerDocument)) throw new Error(type.value === ReceiptType.FACTURA ? 'validation.ruc-invalid' : 'validation.dni-invalid');
        if (!(total instanceof Money) || total.amount <= 0) throw new Error('validation.money-invalid');
        this._id = id;
        this._transactionId = transactionId;
        this._userId = userId;
        this._type = type;
        this._number = Number(number);
        this._customerName = customerName.trim();
        this._customerDocument = customerDocument;
        this._total = total;
        this._issuedAt = issuedAt;
    }

    /**
     * Factory that issues a receipt for a paid transaction.
     *
     * @param {Object} params - Issue data.
     * @param {import('./payment-transaction.entity.js').PaymentTransaction} params.transaction - Paid transaction.
     * @param {ReceiptType} params.type - Receipt type.
     * @param {number} params.number - Next correlative number of the series.
     * @param {string} params.customerName - Customer name.
     * @param {string} params.customerDocument - Customer document.
     * @returns {Receipt} Issued receipt.
     * @throws {Error} When the transaction is not paid.
     */
    static issue({ transaction, type, number, customerName, customerDocument }) {
        if (!transaction.status.isPaid) throw new Error('validation.transaction-not-paid');
        return new Receipt({
            transactionId: transaction.id,
            userId: transaction.userId,
            type,
            number,
            customerName,
            customerDocument,
            total: transaction.amount,
            issuedAt: new Date().toISOString()
        });
    }

    /** @returns {?number} Receipt identifier. */
    get id() { return this._id; }

    /** @returns {number} Transaction identifier. */
    get transactionId() { return this._transactionId; }

    /** @returns {number} User identifier. */
    get userId() { return this._userId; }

    /** @returns {ReceiptType} Type. */
    get type() { return this._type; }

    /** @returns {number} Correlative number. */
    get number() { return this._number; }

    /** @returns {string} Customer name. */
    get customerName() { return this._customerName; }

    /** @returns {string} Customer document. */
    get customerDocument() { return this._customerDocument; }

    /** @returns {Money} Total including IGV. */
    get total() { return this._total; }

    /** @returns {string} Issue date-time. */
    get issuedAt() { return this._issuedAt; }

    /** @returns {string} Full receipt code, for example "F001-00000012". */
    get code() {
        return `${this._type.series}-${String(this._number).padStart(8, '0')}`;
    }

    /** @returns {Money} Taxable base without IGV. */
    get subtotal() {
        return new Money({ amount: this._total.amount / (1 + Receipt.IGV_RATE), currency: this._total.currency });
    }

    /** @returns {Money} IGV amount. */
    get igv() {
        return new Money({ amount: this._total.amount - this.subtotal.amount, currency: this._total.currency });
    }
}
