import {Money} from "../../../shared/domain/model/money.value-object.js";
import {ReceiptType} from "./receipt-type.value-object.js";

export class Receipt {
    static IGV_RATE = 0.18;

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

    get id() { return this._id; }

    get transactionId() { return this._transactionId; }

    get userId() { return this._userId; }

    get type() { return this._type; }

    get number() { return this._number; }

    get customerName() { return this._customerName; }

    get customerDocument() { return this._customerDocument; }

    get total() { return this._total; }

    get issuedAt() { return this._issuedAt; }

    get code() {
        return `${this._type.series}-${String(this._number).padStart(8, '0')}`;
    }

    get subtotal() {
        return new Money({ amount: this._total.amount / (1 + Receipt.IGV_RATE), currency: this._total.currency });
    }

    get igv() {
        return new Money({ amount: this._total.amount - this.subtotal.amount, currency: this._total.currency });
    }
}
