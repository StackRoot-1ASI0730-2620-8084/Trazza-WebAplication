export class PaymentMethod {
    static BRANDS = Object.freeze(['visa', 'mastercard', 'amex']);

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

    static fromCard({ number, holderName, expiry, today = new Date() }) {
        const digits = (number ?? '').replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19 || !PaymentMethod.passesLuhn(digits)) throw new Error('validation.card-number-invalid');
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry ?? '')) throw new Error('validation.card-expiry-invalid');
        const [month, year] = expiry.split('/').map(Number);
        const lastValidDay = new Date(2000 + year, month, 0, 23, 59, 59);
        if (lastValidDay < today) throw new Error('validation.card-expired');
        return new PaymentMethod({ brand: PaymentMethod.detectBrand(digits), last4: digits.slice(-4), holderName, expiry });
    }

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

    static detectBrand(digits) {
        if (/^4/.test(digits)) return 'visa';
        if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
        if (/^3[47]/.test(digits)) return 'amex';
        throw new Error('validation.card-brand-invalid');
    }

    get brand() { return this._brand; }

    get last4() { return this._last4; }

    get holderName() { return this._holderName; }

    get expiry() { return this._expiry; }

    get label() {
        return `${this._brand.toUpperCase()} •••• ${this._last4}`;
    }
}
