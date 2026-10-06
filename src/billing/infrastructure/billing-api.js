import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const paymentTransactionsEndpointPath = import.meta.env.VITE_PAYMENT_TRANSACTIONS_ENDPOINT_PATH;
const receiptsEndpointPath = import.meta.env.VITE_RECEIPTS_ENDPOINT_PATH;

export class BillingApi extends BaseApi {
    constructor() {
        super();
        this._paymentTransactionsEndpoint = new BaseEndpoint(this, paymentTransactionsEndpointPath);
        this._receiptsEndpoint = new BaseEndpoint(this, receiptsEndpointPath);
    }

    getPaymentTransactions() {
        return this._paymentTransactionsEndpoint.getAll();
    }

    createPaymentTransaction(resource) {
        return this._paymentTransactionsEndpoint.create(resource);
    }

    getReceipts() {
        return this._receiptsEndpoint.getAll();
    }

    createReceipt(resource) {
        return this._receiptsEndpoint.create(resource);
    }
}
