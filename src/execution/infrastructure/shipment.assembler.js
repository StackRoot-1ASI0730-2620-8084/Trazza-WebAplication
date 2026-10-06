import {Shipment} from "../domain/model/shipment.entity.js";
import {ShipmentStatus} from "../domain/model/shipment-status.value-object.js";
import {IncidentAssembler} from "./incident.assembler.js";
import {Address} from "../../shared/domain/model/address.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";
import {GeoLocation} from "../../shared/domain/model/geo-location.value-object.js";

/**
 * Maps shipment resources into domain aggregates and back.
 *
 * @class ShipmentAssembler
 */
export class ShipmentAssembler {
    /**
     * @param {Object} resource - Shipment resource payload.
     * @returns {Shipment} Shipment aggregate.
     */
    static toEntityFromResource(resource) {
        return new Shipment({
            id: resource.id,
            code: resource.code,
            proposalId: resource.proposalId,
            freightRequestId: resource.freightRequestId,
            returnRouteId: resource.returnRouteId,
            carrierId: resource.carrierId,
            carrierName: resource.carrierName,
            carrierPhone: resource.carrierPhone,
            vehicleLabel: resource.vehicleLabel,
            merchantId: resource.merchantId,
            merchantName: resource.merchantName,
            merchantPhone: resource.merchantPhone,
            pickup: new Address(resource.pickup),
            delivery: new Address(resource.delivery),
            pickupDate: resource.pickupDate,
            pickupWindow: resource.pickupWindow,
            cargoDescription: resource.cargoDescription,
            cargoType: resource.cargoType,
            weightKg: resource.weightKg,
            rate: new Money(resource.rate),
            status: new ShipmentStatus(resource.status),
            currentLocation: resource.currentLocation ? new GeoLocation(resource.currentLocation) : null,
            events: resource.events ?? [],
            incidents: (resource.incidents ?? []).map(incident => IncidentAssembler.toEntityFromResource(incident)),
            createdAt: resource.createdAt,
            pickedUpAt: resource.pickedUpAt,
            deliveredAt: resource.deliveredAt,
            closedAt: resource.closedAt
        });
    }

    /**
     * Parses shipment resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {Shipment[]} Shipment aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['shipments'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Shipment} entity - Shipment aggregate.
     * @returns {Object} Shipment resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            code: entity.code,
            proposalId: entity.proposalId,
            freightRequestId: entity.freightRequestId,
            returnRouteId: entity.returnRouteId,
            carrierId: entity.carrierId,
            carrierName: entity.carrierName,
            carrierPhone: entity.carrierPhone,
            vehicleLabel: entity.vehicleLabel,
            merchantId: entity.merchantId,
            merchantName: entity.merchantName,
            merchantPhone: entity.merchantPhone,
            pickup: { street: entity.pickup.street, district: entity.pickup.district },
            delivery: { street: entity.delivery.street, district: entity.delivery.district },
            pickupDate: entity.pickupDate,
            pickupWindow: entity.pickupWindow,
            cargoDescription: entity.cargoDescription,
            cargoType: entity.cargoType,
            weightKg: entity.weightKg,
            rate: { amount: entity.rate.amount, currency: entity.rate.currency },
            status: entity.status.value,
            currentLocation: entity.currentLocation
                ? { latitude: entity.currentLocation.latitude, longitude: entity.currentLocation.longitude }
                : null,
            events: entity.events.map(event => ({ type: event.type, occurredAt: event.occurredAt, details: { ...event.details } })),
            incidents: entity.incidents.map(incident => IncidentAssembler.toResourceFromEntity(incident)),
            createdAt: entity.createdAt,
            pickedUpAt: entity.pickedUpAt,
            deliveredAt: entity.deliveredAt,
            closedAt: entity.closedAt
        };
    }
}
