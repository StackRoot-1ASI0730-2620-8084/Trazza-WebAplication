import {Incident} from "../domain/model/incident.entity.js";
import {IncidentType} from "../domain/model/incident-type.value-object.js";

/**
 * Maps incident resources nested in shipments into domain entities and back.
 *
 * @class IncidentAssembler
 */
export class IncidentAssembler {
    /**
     * @param {Object} resource - Incident resource payload.
     * @returns {Incident} Incident entity.
     */
    static toEntityFromResource(resource) {
        return new Incident({
            id: resource.id,
            type: new IncidentType(resource.type),
            description: resource.description,
            reporterId: resource.reporterId,
            reporterRole: resource.reporterRole,
            reportedAt: resource.reportedAt,
            status: resource.status
        });
    }

    /**
     * @param {Incident} entity - Incident entity.
     * @returns {Object} Incident resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            type: entity.type.value,
            description: entity.description,
            reporterId: entity.reporterId,
            reporterRole: entity.reporterRole,
            reportedAt: entity.reportedAt,
            status: entity.status
        };
    }
}
