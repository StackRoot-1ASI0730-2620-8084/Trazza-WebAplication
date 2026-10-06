import {Rating} from "../domain/model/rating.entity.js";
import {Score} from "../domain/model/score.value-object.js";
import {RatingTarget} from "../domain/model/rating-target.value-object.js";

/**
 * Maps rating resources into domain aggregates and back.
 *
 * @class RatingAssembler
 */
export class RatingAssembler {
    /**
     * @param {Object} resource - Rating resource payload.
     * @returns {Rating} Rating aggregate.
     */
    static toEntityFromResource(resource) {
        return new Rating({
            id: resource.id,
            shipmentId: resource.shipmentId,
            raterId: resource.raterId,
            raterName: resource.raterName,
            target: new RatingTarget({ userId: resource.targetId, role: resource.targetRole, name: resource.targetName }),
            score: new Score(resource.score),
            tags: resource.tags,
            comment: resource.comment,
            createdAt: resource.createdAt
        });
    }

    /**
     * Parses rating resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {Rating[]} Rating aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['ratings'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Rating} entity - Rating aggregate.
     * @returns {Object} Rating resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id ?? undefined,
            shipmentId: entity.shipmentId,
            raterId: entity.raterId,
            raterName: entity.raterName,
            targetId: entity.target.userId,
            targetRole: entity.target.role,
            targetName: entity.target.name,
            score: entity.score.value,
            tags: [...entity.tags],
            comment: entity.comment,
            createdAt: entity.createdAt
        };
    }
}
