import {PaymentTransaction} from "../domain/model/payment-transaction.entity.js";
import {SubscriptionPlan} from "../domain/model/subscription-plan.value-object.js";
import {PaymentMethod} from "../domain/model/payment-method.value-object.js";
import {PaymentStatus} from "../domain/model/payment-status.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";

/**
 * Maps payment transaction resources into domain aggregates and back.
 *
 * @class PaymentTransactionAssembler
 */
export class PaymentTransactionAssembler {
    /**
     * @param {Object} resource - Payment transaction resource payload.
     * @returns {PaymentTransaction} Payment transaction aggregate.
     */
    static toEntityFromResource(resource) {
        return new PaymentTransaction({
            id: resource.id,
            userId: resource.userId,
            plan: new SubscriptionPlan(resource.plan),
            amount: new Money(resource.amount),
            method: new PaymentMethod(resource.method),
            status: new PaymentStatus(resource.status),
            authorizationCode: resource.authorizationCode,
            createdAt: resource.createdAt,
            paidAt: resource.paidAt,
            periodStart: resource.periodStart,
            periodEnd: resource.periodEnd
        });
    }

    /**
     * Parses payment transaction resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {PaymentTransaction[]} Payment transaction aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['paymentTransactions'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {PaymentTransaction} entity - Payment transaction aggregate.
     * @returns {Object} Payment transaction resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            userId: entity.userId,
            plan: entity.plan.code,
            amount: { amount: entity.amount.amount, currency: entity.amount.currency },
            method: {
                brand: entity.method.brand,
                last4: entity.method.last4,
                holderName: entity.method.holderName,
                expiry: entity.method.expiry
            },
            status: entity.status.value,
            authorizationCode: entity.authorizationCode,
            createdAt: entity.createdAt,
            paidAt: entity.paidAt,
            periodStart: entity.periodStart,
            periodEnd: entity.periodEnd
        };
    }
}
