/**
 * Adapter of the external payment gateway. This implementation simulates the gateway for the mock environment:
 * every valid card is approved except cards ending in 0002, which are declined.
 *
 * @class PaymentGateway
 */
export class PaymentGateway {
    /** @type {string} Last four digits of the test card that is always declined. */
    static DECLINED_TEST_CARD = '0002';

    /**
     * Charges an amount to a tokenized payment method.
     *
     * @param {import('../../shared/domain/model/money.value-object.js').Money} amount - Amount to charge.
     * @param {import('../domain/model/payment-method.value-object.js').PaymentMethod} method - Payment method.
     * @returns {Promise<{approved: boolean, authorizationCode: ?string}>} Gateway answer.
     */
    charge(amount, method) {
        return new Promise(resolve => {
            setTimeout(() => {
                const approved = method.last4 !== PaymentGateway.DECLINED_TEST_CARD && amount.amount > 0;
                resolve({ approved, authorizationCode: approved ? `AUT-${Date.now().toString(36).toUpperCase()}` : null });
            }, 700);
        });
    }
}
