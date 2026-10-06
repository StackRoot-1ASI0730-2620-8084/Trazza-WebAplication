import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const paymentTransactionsEndpointPath = import.meta.env.VITE_PAYMENT_TRANSACTIONS_ENDPOINT_PATH;
const receiptsEndpointPath = import.meta.env.VITE_RECEIPTS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Payment & Billing bounded context endpoints.
 *
 * @class BillingApi
 * @extends BaseApi
 */
export class BillingApi extends BaseApi {
    /** Creates endpoint clients for payment transactions and receipts. */
    constructor() {
        super();
        this._paymentTransactionsEndpoint = new BaseEndpoint(this, paymentTransactionsEndpointPath);
        this._receiptsEndpoint = new BaseEndpoint(this, receiptsEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every payment transaction. */
    getPaymentTransactions() {
        return this._paymentTransactionsEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Payment transaction resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created transaction.
     */
    createPaymentTransaction(resource) {
        return this._paymentTransactionsEndpoint.create(resource);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every receipt. */
    getReceipts() {
        return this._receiptsEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Receipt resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created receipt.
     */
    createReceipt(resource) {
        return this._receiptsEndpoint.create(resource);
    }
}
