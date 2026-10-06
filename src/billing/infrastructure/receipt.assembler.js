import {Receipt} from "../domain/model/receipt.entity.js";
import {ReceiptType} from "../domain/model/receipt-type.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";

/**
 * Maps receipt resources into domain aggregates and back.
 *
 * @class ReceiptAssembler
 */
export class ReceiptAssembler {
    /**
     * @param {Object} resource - Receipt resource payload.
     * @returns {Receipt} Receipt aggregate.
     */
    static toEntityFromResource(resource) {
        return new Receipt({
            id: resource.id,
            transactionId: resource.transactionId,
            userId: resource.userId,
            type: new ReceiptType(resource.type),
            number: resource.number,
            customerName: resource.customerName,
            customerDocument: resource.customerDocument,
            total: new Money(resource.total),
            issuedAt: resource.issuedAt
        });
    }

    /**
     * Parses receipt resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {Receipt[]} Receipt aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['receipts'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Receipt} entity - Receipt aggregate.
     * @returns {Object} Receipt resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            transactionId: entity.transactionId,
            userId: entity.userId,
            type: entity.type.value,
            series: entity.type.series,
            number: entity.number,
            customerName: entity.customerName,
            customerDocument: entity.customerDocument,
            total: { amount: entity.total.amount, currency: entity.total.currency },
            issuedAt: entity.issuedAt
        };
    }
}
