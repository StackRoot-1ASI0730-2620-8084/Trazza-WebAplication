import {CarrierProfile} from "../domain/model/carrier-profile.entity.js";
import {Dni} from "../domain/model/dni.value-object.js";
import {Phone} from "../domain/model/phone.value-object.js";
import {VehicleAssembler} from "./vehicle.assembler.js";

/**
 * Maps carrier profile resources into domain aggregates and back.
 *
 * @class CarrierProfileAssembler
 */
export class CarrierProfileAssembler {
    /**
     * @param {Object} resource - Carrier profile resource payload.
     * @returns {CarrierProfile} Carrier profile aggregate.
     */
    static toEntityFromResource(resource) {
        return new CarrierProfile({
            id: resource.id,
            userId: resource.userId,
            fullName: resource.fullName,
            dni: new Dni(resource.dni),
            phone: new Phone(resource.phone),
            verified: resource.verified,
            vehicles: (resource.vehicles ?? []).map(vehicle => VehicleAssembler.toEntityFromResource(vehicle))
        });
    }

    /**
     * Parses carrier profile resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {CarrierProfile[]} Carrier profile aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['carrierProfiles'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {CarrierProfile} entity - Carrier profile aggregate.
     * @returns {Object} Carrier profile resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            fullName: entity.fullName,
            dni: entity.dni.value,
            phone: entity.phone.value,
            verified: entity.verified,
            vehicles: entity.vehicles.map(vehicle => VehicleAssembler.toResourceFromEntity(vehicle))
        };
    }
}
