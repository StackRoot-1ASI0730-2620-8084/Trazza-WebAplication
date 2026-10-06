/**
 * Immutable value object that represents an amount of money in a supported currency.
 *
 * @class Money
 */
export class Money {
    /**
     * Supported ISO 4217 currency codes and their display symbols.
     * @type {Readonly<Record<string, string>>}
     */
    static CURRENCIES = Object.freeze({ PEN: 'S/' });

    /**
     * @param {Object} params - Value object attributes.
     * @param {number} params.amount - Non-negative amount.
     * @param {string} [params.currency='PEN'] - ISO 4217 currency code.
     * @throws {Error} When the amount is negative or the currency is not supported.
     */
    constructor({ amount, currency = 'PEN' }) {
        const value = Number(amount);
        if (amount === null || amount === '' || !Number.isFinite(value) || value < 0) throw new Error('validation.money-invalid');
        if (!Object.hasOwn(Money.CURRENCIES, currency)) throw new Error('validation.currency-invalid');
        this._amount = Math.round(value * 100) / 100;
        this._currency = currency;
        Object.freeze(this);
    }

    /**
     * Creates a zero amount in the given currency.
     *
     * @param {string} [currency='PEN'] - ISO 4217 currency code.
     * @returns {Money} Zero money.
     */
    static zero(currency = 'PEN') {
        return new Money({ amount: 0, currency });
    }

    /** @returns {number} Amount rounded to two decimals. */
    get amount() {
        return this._amount;
    }

    /** @returns {string} ISO 4217 currency code. */
    get currency() {
        return this._currency;
    }

    /** @returns {string} Formatted amount, for example "S/ 180" or "S/ 39.90". */
    get formatted() {
        const decimals = Number.isInteger(this._amount) ? 0 : 2;
        return `${Money.CURRENCIES[this._currency]} ${this._amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}`;
    }

    /**
     * @param {Money} other - Money to add.
     * @returns {Money} New money with the sum.
     * @throws {Error} When currencies differ.
     */
    add(other) {
        this._assertSameCurrency(other);
        return new Money({ amount: this._amount + other.amount, currency: this._currency });
    }

    /**
     * @param {number} factor - Non-negative factor.
     * @returns {Money} New money multiplied by the factor.
     */
    multiply(factor) {
        return new Money({ amount: this._amount * factor, currency: this._currency });
    }

    /**
     * @param {Money} other - Money to compare.
     * @returns {boolean} True when amount and currency are equal.
     */
    equals(other) {
        return other instanceof Money && other.amount === this._amount && other.currency === this._currency;
    }

    /**
     * @param {Money} other - Money to compare.
     * @returns {boolean} True when this amount is greater than the other.
     */
    isGreaterThan(other) {
        this._assertSameCurrency(other);
        return this._amount > other.amount;
    }

    /**
     * @param {Money} other - Money to validate.
     * @throws {Error} When the other value is not money in the same currency.
     * @private
     */
    _assertSameCurrency(other) {
        if (!(other instanceof Money) || other.currency !== this._currency) throw new Error('validation.currency-mismatch');
    }
}
