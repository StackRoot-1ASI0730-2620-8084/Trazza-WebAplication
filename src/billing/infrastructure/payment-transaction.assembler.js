import {PaymentTransaction} from "../domain/model/payment-transaction.entity.js";
import {SubscriptionPlan} from "../domain/model/subscription-plan.value-object.js";
import {PaymentMethod} from "../domain/model/payment-method.value-object.js";
import {PaymentStatus} from "../domain/model/payment-status.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";

export class PaymentTransactionAssembler {
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

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['paymentTransactions'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

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
