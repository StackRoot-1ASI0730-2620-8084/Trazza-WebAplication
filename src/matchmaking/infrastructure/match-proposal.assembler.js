import {MatchProposal} from "../domain/model/match-proposal.entity.js";
import {ProposalStatus} from "../domain/model/proposal-status.value-object.js";
import {Detour} from "../domain/model/detour.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";

/**
 * Maps match proposal resources into domain aggregates and back.
 *
 * @class MatchProposalAssembler
 */
export class MatchProposalAssembler {
    /**
     * @param {Object} resource - Match proposal resource payload.
     * @returns {MatchProposal} Match proposal aggregate.
     */
    static toEntityFromResource(resource) {
        return new MatchProposal({
            id: resource.id,
            freightRequestId: resource.freightRequestId,
            returnRouteId: resource.returnRouteId,
            carrierId: resource.carrierId,
            merchantId: resource.merchantId,
            initiatedBy: resource.initiatedBy,
            currentRate: new Money(resource.currentRate),
            previousRate: resource.previousRate ? new Money(resource.previousRate) : null,
            lastOfferBy: resource.lastOfferBy,
            status: new ProposalStatus(resource.status),
            detour: new Detour(resource.detour),
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt
        });
    }

    /**
     * Parses match proposal resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {MatchProposal[]} Match proposal aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['matchProposals'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {MatchProposal} entity - Match proposal aggregate.
     * @returns {Object} Match proposal resource payload.
     */
    static toResourceFromEntity(entity) {
        const toMoneyResource = money => money ? { amount: money.amount, currency: money.currency } : null;
        return {
            id: entity.id ?? undefined,
            freightRequestId: entity.freightRequestId,
            returnRouteId: entity.returnRouteId,
            carrierId: entity.carrierId,
            merchantId: entity.merchantId,
            initiatedBy: entity.initiatedBy,
            currentRate: toMoneyResource(entity.currentRate),
            previousRate: toMoneyResource(entity.previousRate),
            lastOfferBy: entity.lastOfferBy,
            status: entity.status.value,
            detour: { distanceKm: entity.detour.distanceKm, durationMinutes: entity.detour.durationMinutes },
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
}
