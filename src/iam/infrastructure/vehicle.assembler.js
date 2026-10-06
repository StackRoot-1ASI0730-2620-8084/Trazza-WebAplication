import {Vehicle} from "../domain/model/vehicle.entity.js";
import {LicensePlate} from "../domain/model/license-plate.value-object.js";
import {LoadCapacity} from "../domain/model/load-capacity.value-object.js";

/**
 * Maps vehicle resources nested in carrier profiles into domain entities and back.
 *
 * @class VehicleAssembler
 */
export class VehicleAssembler {
    /**
     * @param {Object} resource - Vehicle resource payload.
     * @returns {Vehicle} Vehicle entity.
     */
    static toEntityFromResource(resource) {
        return new Vehicle({
            id: resource.id,
            plate: new LicensePlate(resource.plate),
            brandModel: resource.brandModel,
            bodyType: resource.bodyType,
            capacity: new LoadCapacity({ weightKg: resource.capacityKg, volumeM3: resource.volumeM3 }),
            active: resource.active
        });
    }

    /**
     * @param {Vehicle} entity - Vehicle entity.
     * @returns {Object} Vehicle resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            plate: entity.plate.value,
            brandModel: entity.brandModel,
            bodyType: entity.bodyType,
            capacityKg: entity.capacity.weightKg,
            volumeM3: entity.capacity.volumeM3,
            active: entity.active
        };
    }
}
