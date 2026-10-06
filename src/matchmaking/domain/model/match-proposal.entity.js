import {Money} from "../../../shared/domain/model/money.value-object.js";
import {Detour} from "./detour.value-object.js";
import {ProposalStatus} from "./proposal-status.value-object.js";

/**
 * Match proposal aggregate root. It models the negotiation of a rate between a carrier and a merchant
 * for a freight request served through a return route.
 *
 * @class MatchProposal
 */
export class MatchProposal {
    /** @type {ReadonlyArray<string>} Roles that take part in the negotiation. */
    static PARTIES = Object.freeze(['carrier', 'merchant']);

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Proposal identifier.
     * @param {number} params.freightRequestId - Freight request identifier.
     * @param {number} params.returnRouteId - Return route identifier.
     * @param {number} params.carrierId - Carrier user identifier.
     * @param {number} params.merchantId - Merchant user identifier.
     * @param {string} params.initiatedBy - Party that opened the negotiation.
     * @param {Money} params.currentRate - Rate currently on the table.
     * @param {?Money} [params.previousRate=null] - Rate proposed before the last counteroffer.
     * @param {string} params.lastOfferBy - Party that made the current offer.
     * @param {ProposalStatus} params.status - Negotiation status.
     * @param {Detour} params.detour - Detour of the load for the route.
     * @param {?string} [params.createdAt=null] - ISO creation date-time.
     * @param {?string} [params.updatedAt=null] - ISO last update date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, freightRequestId, returnRouteId, carrierId, merchantId, initiatedBy, currentRate,
                    previousRate = null, lastOfferBy, status, detour, createdAt = null, updatedAt = null }) {
        if (freightRequestId === null || freightRequestId === undefined) throw new Error('validation.request-required');
        if (returnRouteId === null || returnRouteId === undefined) throw new Error('validation.route-required');
        if (carrierId === null || carrierId === undefined) throw new Error('validation.carrier-required');
        if (merchantId === null || merchantId === undefined) throw new Error('validation.merchant-required');
        if (carrierId === merchantId) throw new Error('validation.same-parties');
        if (!MatchProposal.PARTIES.includes(initiatedBy) || !MatchProposal.PARTIES.includes(lastOfferBy)) throw new Error('validation.party-invalid');
        if (!(currentRate instanceof Money) || currentRate.amount <= 0) throw new Error('validation.rate-positive');
        if (previousRate !== null && !(previousRate instanceof Money)) throw new Error('validation.money-invalid');
        if (!(status instanceof ProposalStatus)) throw new Error('validation.status-invalid');
        if (!(detour instanceof Detour)) throw new Error('validation.detour-invalid');
        this._id = id;
        this._freightRequestId = freightRequestId;
        this._returnRouteId = returnRouteId;
        this._carrierId = carrierId;
        this._merchantId = merchantId;
        this._initiatedBy = initiatedBy;
        this._currentRate = currentRate;
        this._previousRate = previousRate;
        this._lastOfferBy = lastOfferBy;
        this._status = status;
        this._detour = detour;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
    }

    /**
     * Factory that opens a negotiation. When the carrier offers exactly the rate published by the merchant
     * the proposal starts as accepted and only waits for the merchant confirmation.
     *
     * @param {Object} params - Creation data.
     * @param {import('./freight-request.entity.js').FreightRequest} params.freightRequest - Open freight request.
     * @param {import('./return-route.entity.js').ReturnRoute} params.returnRoute - Active return route.
     * @param {Money} params.rate - Proposed rate.
     * @param {string} params.by - Party that opens the negotiation.
     * @param {Detour} params.detour - Detour of the load.
     * @returns {MatchProposal} New proposal.
     * @throws {Error} When the request is not open, the route is not active or the load does not fit.
     */
    static create({ freightRequest, returnRoute, rate, by, detour }) {
        if (!freightRequest.status.isOpen) throw new Error('validation.request-not-open');
        if (!returnRoute.status.isActive) throw new Error('validation.route-not-active');
        if (!returnRoute.canCarry(freightRequest.cargo.weightKg, freightRequest.cargo.volumeM3)) throw new Error('validation.route-capacity-insufficient');
        const acceptsPublishedRate = by === 'carrier' && freightRequest.offeredRate !== null && freightRequest.offeredRate.equals(rate);
        const now = new Date().toISOString();
        return new MatchProposal({
            freightRequestId: freightRequest.id,
            returnRouteId: returnRoute.id,
            carrierId: returnRoute.carrierId,
            merchantId: freightRequest.merchantId,
            initiatedBy: by,
            currentRate: rate,
            lastOfferBy: by,
            status: new ProposalStatus(acceptsPublishedRate ? ProposalStatus.ACCEPTED : ProposalStatus.PENDING),
            detour,
            createdAt: now,
            updatedAt: now
        });
    }

    /** @returns {?number} Proposal identifier. */
    get id() { return this._id; }

    /** @returns {number} Freight request identifier. */
    get freightRequestId() { return this._freightRequestId; }

    /** @returns {number} Return route identifier. */
    get returnRouteId() { return this._returnRouteId; }

    /** @returns {number} Carrier user identifier. */
    get carrierId() { return this._carrierId; }

    /** @returns {number} Merchant user identifier. */
    get merchantId() { return this._merchantId; }

    /** @returns {string} Party that opened the negotiation. */
    get initiatedBy() { return this._initiatedBy; }

    /** @returns {Money} Current rate. */
    get currentRate() { return this._currentRate; }

    /** @returns {?Money} Previous rate. */
    get previousRate() { return this._previousRate; }

    /** @returns {string} Party that made the current offer. */
    get lastOfferBy() { return this._lastOfferBy; }

    /** @returns {ProposalStatus} Status. */
    get status() { return this._status; }

    /** @returns {Detour} Detour. */
    get detour() { return this._detour; }

    /** @returns {?string} Creation date-time. */
    get createdAt() { return this._createdAt; }

    /** @returns {?string} Last update date-time. */
    get updatedAt() { return this._updatedAt; }

    /**
     * @param {string} party - "carrier" or "merchant".
     * @returns {boolean} True when the party has to answer the current offer.
     */
    isAwaiting(party) {
        return this._status.isNegotiating && this._lastOfferBy !== party;
    }

    /**
     * Accepts the rate proposed by the counterpart.
     *
     * @param {string} by - Party that accepts.
     * @returns {void}
     * @throws {Error} When the party cannot answer the current offer.
     */
    accept(by) {
        this._assertCanAnswer(by);
        this._status = new ProposalStatus(ProposalStatus.ACCEPTED);
        this._touch();
    }

    /**
     * Answers the current offer with another rate.
     *
     * @param {Money} rate - New rate.
     * @param {string} by - Party that counters.
     * @returns {void}
     * @throws {Error} When the party cannot answer or the rate is the same.
     */
    counter(rate, by) {
        this._assertCanAnswer(by);
        if (!(rate instanceof Money) || rate.amount <= 0) throw new Error('validation.rate-positive');
        if (rate.equals(this._currentRate)) throw new Error('validation.counteroffer-same-rate');
        this._previousRate = this._currentRate;
        this._currentRate = rate;
        this._lastOfferBy = by;
        this._status = new ProposalStatus(ProposalStatus.COUNTEROFFER);
        this._touch();
    }

    /**
     * Rejects the proposal.
     *
     * @param {string} by - Party that rejects.
     * @returns {void}
     * @throws {Error} When the proposal is already finished.
     */
    reject(by) {
        if (!MatchProposal.PARTIES.includes(by)) throw new Error('validation.party-invalid');
        if (!this._status.isOpen) throw new Error('validation.proposal-closed');
        this._status = new ProposalStatus(ProposalStatus.REJECTED);
        this._touch();
    }

    /**
     * Confirms the match. Only the merchant can confirm an accepted proposal.
     *
     * @param {string} by - Party that confirms.
     * @returns {void}
     * @throws {Error} When the party is not the merchant or the proposal is not accepted.
     */
    confirm(by) {
        if (by !== 'merchant') throw new Error('validation.only-merchant-confirms');
        if (this._status.value !== ProposalStatus.ACCEPTED) throw new Error('validation.proposal-not-accepted');
        this._status = new ProposalStatus(ProposalStatus.MATCHED);
        this._touch();
    }

    /**
     * Closes an open proposal because another carrier was matched or the request was cancelled.
     *
     * @returns {void}
     */
    close() {
        if (!this._status.isOpen) return;
        this._status = new ProposalStatus(ProposalStatus.CLOSED);
        this._touch();
    }

    /**
     * @param {string} by - Party that answers.
     * @returns {void}
     * @throws {Error} When the party is invalid, the negotiation is over or it is not its turn.
     * @private
     */
    _assertCanAnswer(by) {
        if (!MatchProposal.PARTIES.includes(by)) throw new Error('validation.party-invalid');
        if (!this._status.isNegotiating) throw new Error('validation.proposal-closed');
        if (by === this._lastOfferBy) throw new Error('validation.not-your-turn');
    }

    /**
     * Updates the last modification date-time.
     *
     * @returns {void}
     * @private
     */
    _touch() {
        this._updatedAt = new Date().toISOString();
    }
}
