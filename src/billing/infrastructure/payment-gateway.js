export class PaymentGateway {
    static DECLINED_TEST_CARD = '0002';

    charge(amount, method) {
        return new Promise(resolve => {
            setTimeout(() => {
                const approved = method.last4 !== PaymentGateway.DECLINED_TEST_CARD && amount.amount > 0;
                resolve({ approved, authorizationCode: approved ? `AUT-${Date.now().toString(36).toUpperCase()}` : null });
            }, 700);
        });
    }
}
