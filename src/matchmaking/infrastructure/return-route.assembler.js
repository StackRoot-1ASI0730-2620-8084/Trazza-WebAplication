import {ReturnRoute} from "../domain/model/return-route.entity.js";
import {TimeWindow} from "../domain/model/time-window.value-object.js";
import {CargoType} from "../domain/model/cargo-type.value-object.js";
import {RouteStatus} from "../domain/model/route-status.value-object.js";
import {Address} from "../../shared/domain/model/address.value-object.js";

/**
 * Maps return route resources into domain aggregates and back.
 *
 * @class ReturnRouteAssembler
 */
export class ReturnRouteAssembler {
    /**
     * @param {Object} resource - Return route resource payload.
     * @returns {ReturnRoute} Return route aggregate.
     */
    static toEntityFromResource(resource) {
        return new ReturnRoute({
            id: resource.id,
            carrierId: resource.carrierId,
            vehicleId: resource.vehicleId,
            vehicleLabel: resource.vehicleLabel,
            origin: new Address(resource.origin),
            destination: new Address(resource.destination),
            departureDate: resource.departureDate,
            timeWindow: new TimeWindow(resource.timeWindow),
            availableWeightKg: resource.availableWeightKg,
            availableVolumeM3: resource.availableVolumeM3,
            maxDetourKm: resource.maxDetourKm,
            acceptedCargoTypes: resource.acceptedCargoTypes.map(type => new CargoType(type)),
            status: new RouteStatus(resource.status),
            distanceKm: resource.distanceKm,
            durationMinutes: resource.durationMinutes,
            createdAt: resource.createdAt
        });
    }

    /**
     * Parses return route resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {ReturnRoute[]} Return route aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['returnRoutes'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {ReturnRoute} entity - Return route aggregate.
     * @returns {Object} Return route resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            carrierId: entity.carrierId,
            vehicleId: entity.vehicleId,
            vehicleLabel: entity.vehicleLabel,
            origin: { street: entity.origin.street, district: entity.origin.district },
            destination: { street: entity.destination.street, district: entity.destination.district },
            departureDate: entity.departureDate,
            timeWindow: { start: entity.timeWindow.start, end: entity.timeWindow.end },
            availableWeightKg: entity.availableWeightKg,
            availableVolumeM3: entity.availableVolumeM3,
            maxDetourKm: entity.maxDetourKm,
            acceptedCargoTypes: entity.acceptedCargoTypes.map(type => type.value),
            status: entity.status.value,
            distanceKm: entity.distanceKm,
            durationMinutes: entity.durationMinutes,
            createdAt: entity.createdAt
        };
    }
}
