import {FreightRequest} from "../domain/model/freight-request.entity.js";
import {TimeWindow} from "../domain/model/time-window.value-object.js";
import {Cargo} from "../domain/model/cargo.value-object.js";
import {CargoType} from "../domain/model/cargo-type.value-object.js";
import {RequestStatus} from "../domain/model/request-status.value-object.js";
import {Address} from "../../shared/domain/model/address.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";

/**
 * Maps freight request resources into domain aggregates and back.
 *
 * @class FreightRequestAssembler
 */
export class FreightRequestAssembler {
    /**
     * @param {Object} resource - Freight request resource payload.
     * @returns {FreightRequest} Freight request aggregate.
     */
    static toEntityFromResource(resource) {
        return new FreightRequest({
            id: resource.id,
            code: resource.code,
            merchantId: resource.merchantId,
            pickup: new Address(resource.pickup),
            delivery: new Address(resource.delivery),
            pickupDate: resource.pickupDate,
            pickupWindow: new TimeWindow(resource.pickupWindow),
            cargo: new Cargo({
                type: new CargoType(resource.cargo.type),
                weightKg: resource.cargo.weightKg,
                volumeM3: resource.cargo.volumeM3,
                description: resource.cargo.description
            }),
            offeredRate: resource.offeredRate ? new Money(resource.offeredRate) : null,
            status: new RequestStatus(resource.status),
            distanceKm: resource.distanceKm,
            createdAt: resource.createdAt
        });
    }

    /**
     * Parses freight request resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {FreightRequest[]} Freight request aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['freightRequests'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {FreightRequest} entity - Freight request aggregate.
     * @returns {Object} Freight request resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            code: entity.code,
            merchantId: entity.merchantId,
            pickup: { street: entity.pickup.street, district: entity.pickup.district },
            delivery: { street: entity.delivery.street, district: entity.delivery.district },
            pickupDate: entity.pickupDate,
            pickupWindow: { start: entity.pickupWindow.start, end: entity.pickupWindow.end },
            cargo: {
                type: entity.cargo.type.value,
                weightKg: entity.cargo.weightKg,
                volumeM3: entity.cargo.volumeM3,
                description: entity.cargo.description
            },
            offeredRate: entity.offeredRate ? { amount: entity.offeredRate.amount, currency: entity.offeredRate.currency } : null,
            status: entity.status.value,
            distanceKm: entity.distanceKm,
            createdAt: entity.createdAt
        };
    }
}
