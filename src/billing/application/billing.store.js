import {computed, reactive} from "vue";
import {BillingApi} from "../infrastructure/billing-api.js";
import {PaymentGateway} from "../infrastructure/payment-gateway.js";
import {PaymentTransactionAssembler} from "../infrastructure/payment-transaction.assembler.js";
import {ReceiptAssembler} from "../infrastructure/receipt.assembler.js";
import {PaymentTransaction} from "../domain/model/payment-transaction.entity.js";
import {Receipt} from "../domain/model/receipt.entity.js";
import {SubscriptionPlan} from "../domain/model/subscription-plan.value-object.js";
import {PaymentMethod} from "../domain/model/payment-method.value-object.js";
import {ReceiptType} from "../domain/model/receipt-type.value-object.js";
import useIamStore from "../../iam/application/iam.store.js";

const billingApi = new BillingApi();
const paymentGateway = new PaymentGateway();

/**
 * Reactive state of the Payment & Billing bounded context.
 *
 * @type {{transactions: PaymentTransaction[], receipts: Receipt[], loaded: boolean, processing: boolean, errors: Error[]}}
 */
const state = reactive({
    transactions: [],
    receipts: [],
    loaded: false,
    processing: false,
    errors: []
});

/** @returns {?number} Identifier of the signed-in user. */
const currentUserId = () => useIamStore().currentUserId.value;

/** @type {import('vue').ComputedRef<PaymentTransaction[]>} Transactions of the signed-in user, newest first. */
const myTransactions = computed(() => state.transactions
    .filter(transaction => transaction.userId === currentUserId())
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));

/** @type {import('vue').ComputedRef<Receipt[]>} Receipts of the signed-in user, newest first. */
const myReceipts = computed(() => state.receipts
    .filter(receipt => receipt.userId === currentUserId())
    .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? '')));

/** @type {import('vue').ComputedRef<?PaymentTransaction>} Paid transaction that covers today. */
const activeSubscription = computed(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return myTransactions.value.find(transaction => transaction.covers(today)) ?? null;
});

/** @type {import('vue').ComputedRef<SubscriptionPlan>} Current plan of the signed-in user. */
const currentPlan = computed(() => activeSubscription.value?.plan ?? new SubscriptionPlan(SubscriptionPlan.FREE));

/** @type {import('vue').ComputedRef<?PaymentMethod>} Last payment method used. */
const lastPaymentMethod = computed(() => myTransactions.value[0]?.method ?? null);

/**
 * Loads payment transactions and receipts.
 *
 * @returns {Promise<void>}
 */
async function fetchBilling() {
    try {
        const [transactionsResponse, receiptsResponse] = await Promise.all([
            billingApi.getPaymentTransactions(),
            billingApi.getReceipts()
        ]);
        state.transactions = PaymentTransactionAssembler.toEntitiesFromResponse(transactionsResponse);
        state.receipts = ReceiptAssembler.toEntitiesFromResponse(receiptsResponse);
        state.loaded = true;
        state.errors = [];
    } catch (error) {
        state.errors.push(error);
    }
}

/**
 * Checks the publication limit of the current plan. Used by the Matchmaking context.
 *
 * @param {number} usedThisMonth - Publications created this month.
 * @returns {boolean} True when one more publication is allowed.
 */
function canPublish(usedThisMonth) {
    return currentPlan.value.allowsPublication(usedThisMonth);
}

/**
 * @param {number} transactionId - Transaction identifier.
 * @returns {Receipt|undefined} Receipt issued for the transaction.
 */
function getReceiptByTransactionId(transactionId) {
    return state.receipts.find(receipt => receipt.transactionId === transactionId);
}

/**
 * Executes the upgrade use case: charges the Pro plan, records the transaction and issues the receipt.
 *
 * @param {Object} form - Checkout form data.
 * @param {string} form.cardNumber - Card number.
 * @param {string} form.holderName - Card holder.
 * @param {string} form.expiry - Expiration (MM/YY).
 * @param {string} form.receiptType - "boleta" or "factura".
 * @param {string} form.customerName - Name or business name on the receipt.
 * @param {string} form.customerDocument - DNI or RUC on the receipt.
 * @returns {Promise<{transaction: PaymentTransaction, receipt: Receipt}>} Paid transaction and issued receipt.
 * @throws {Error} When the card is declined or the data is invalid.
 */
async function upgradeToPro(form) {
    if (!currentPlan.value.isFree) throw new Error('validation.plan-already-active');
    const receiptType = new ReceiptType(form.receiptType);
    if (!receiptType.acceptsDocument(form.customerDocument)) throw new Error(receiptType.value === ReceiptType.FACTURA ? 'validation.ruc-invalid' : 'validation.dni-invalid');
    if ((form.customerName ?? '').trim().length < 3) throw new Error('validation.customer-name-required');
    const method = PaymentMethod.fromCard({ number: form.cardNumber, holderName: form.holderName, expiry: form.expiry });
    const transaction = PaymentTransaction.create({ userId: currentUserId(), plan: new SubscriptionPlan(SubscriptionPlan.PRO), method });
    state.processing = true;
    try {
        const answer = await paymentGateway.charge(transaction.amount, transaction.method);
        if (answer.approved) transaction.markPaid(answer.authorizationCode); else transaction.markFailed();
        const transactionResponse = await billingApi.createPaymentTransaction(PaymentTransactionAssembler.toResourceFromEntity(transaction));
        const savedTransaction = PaymentTransactionAssembler.toEntityFromResource(transactionResponse.data);
        state.transactions.push(savedTransaction);
        if (!answer.approved) throw new Error('validation.card-declined');
        const nextNumber = state.receipts.filter(receipt => receipt.type.value === receiptType.value)
            .reduce((max, receipt) => Math.max(max, receipt.number), 0) + 1;
        const receipt = Receipt.issue({
            transaction: savedTransaction,
            type: receiptType,
            number: nextNumber,
            customerName: form.customerName,
            customerDocument: form.customerDocument
        });
        const receiptResponse = await billingApi.createReceipt(ReceiptAssembler.toResourceFromEntity(receipt));
        const savedReceipt = ReceiptAssembler.toEntityFromResource(receiptResponse.data);
        state.receipts.push(savedReceipt);
        return { transaction: savedTransaction, receipt: savedReceipt };
    } finally {
        state.processing = false;
    }
}

const billingStore = {
    state,
    myTransactions,
    myReceipts,
    activeSubscription,
    currentPlan,
    lastPaymentMethod,
    fetchBilling,
    canPublish,
    getReceiptByTransactionId,
    upgradeToPro
};

/**
 * Application service store for the Payment & Billing bounded context.
 * It manages subscription plans, payment transactions and electronic receipts.
 *
 * @returns {typeof billingStore} Store state, getters and actions.
 */
const useBillingStore = () => billingStore;

export default useBillingStore;
