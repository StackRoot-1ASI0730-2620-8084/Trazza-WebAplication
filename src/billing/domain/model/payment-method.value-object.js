/**
 * Immutable value object that represents a tokenized payment card. Only the brand and the last four digits are kept.
 *
 * @class PaymentMethod
 */
export class PaymentMethod {
    /** @type {ReadonlyArray<string>} Supported card brands. */
    static BRANDS = Object.freeze(['visa', 'mastercard', 'amex']);

    /**
     * @param {Object} params - Value object attributes.
     * @param {string} params.brand - Card brand.
     * @param {string} params.last4 - Last four digits.
     * @param {string} params.holderName - Card holder.
     * @param {string} params.expiry - Expiration date (MM/YY).
     * @throws {Error} When an attribute is invalid.
     */
    constructor({ brand, last4, holderName, expiry }) {
        if (!PaymentMethod.BRANDS.includes(brand)) throw new Error('validation.card-brand-invalid');
        if (!/^\d{4}$/.test(last4 ?? '')) throw new Error('validation.card-number-invalid');
        if ((holderName ?? '').trim().length < 3) throw new Error('validation.card-holder-required');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry ?? '')) throw new Error('validation.card-expiry-invalid');
        this._brand = brand;
        this._last4 = last4;
        this._holderName = holderName.trim().toUpperCase();
        this._expiry = expiry;
        Object.freeze(this);
    }

    /**
     * Creates a payment method from raw card data validating the number with the Luhn algorithm.
     *
     * @param {Object} params - Raw card data.
     * @param {string} params.number - Card number.
     * @param {string} params.holderName - Card holder.
     * @param {string} params.expiry - Expiration date (MM/YY).
     * @param {Date} [params.today=new Date()] - Reference date to validate the expiration.
     * @returns {PaymentMethod} Tokenized payment method.
     * @throws {Error} When the card number is invalid or the card expired.
     */
    static fromCard({ number, holderName, expiry, today = new Date() }) {
        const digits = (number ?? '').replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19 || !PaymentMethod.passesLuhn(digits)) throw new Error('validation.card-number-invalid');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry ?? '')) throw new Error('validation.card-expiry-invalid');
        const [month, year] = expiry.split('/').map(Number);
        const lastValidDay = new Date(2000 + year, month, 0, 23, 59, 59);
        if (lastValidDay < today) throw new Error('validation.card-expired');
        return new PaymentMethod({ brand: PaymentMethod.detectBrand(digits), last4: digits.slice(-4), holderName, expiry });
    }

    /**
     * @param {string} digits - Card number digits.
     * @returns {boolean} True when the number passes the Luhn checksum.
     */
    static passesLuhn(digits) {
        let sum = 0;
        let double = false;
        for (let index = digits.length - 1; index >= 0; index--) {
            let digit = Number(digits[index]);
            if (double) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            double = !double;
        }
        return sum % 10 === 0;
    }

    /**
     * @param {string} digits - Card number digits.
     * @returns {string} Card brand.
     * @throws {Error} When the brand is not supported.
     */
    static detectBrand(digits) {
        if (/^4/.test(digits)) return 'visa';
        if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
        if (/^3[47]/.test(digits)) return 'amex';
        throw new Error('validation.card-brand-invalid');
    }

    /** @returns {string} Card brand. */
    get brand() { return this._brand; }

    /** @returns {string} Last four digits. */
    get last4() { return this._last4; }

    /** @returns {string} Card holder. */
    get holderName() { return this._holderName; }

    /** @returns {string} Expiration date. */
    get expiry() { return this._expiry; }

    /** @returns {string} Masked label, for example "VISA •••• 4242". */
    get label() {
        return `${this._brand.toUpperCase()} •••• ${this._last4}`;
    }
}
