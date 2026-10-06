import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const returnRoutesEndpointPath = import.meta.env.VITE_RETURN_ROUTES_ENDPOINT_PATH;
const freightRequestsEndpointPath = import.meta.env.VITE_FREIGHT_REQUESTS_ENDPOINT_PATH;
const matchProposalsEndpointPath = import.meta.env.VITE_MATCH_PROPOSALS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Matchmaking & Routing bounded context endpoints.
 *
 * @class MatchmakingApi
 * @extends BaseApi
 */
export class MatchmakingApi extends BaseApi {
    /** Creates endpoint clients for return routes, freight requests and match proposals. */
    constructor() {
        super();
        this._returnRoutesEndpoint = new BaseEndpoint(this, returnRoutesEndpointPath);
        this._freightRequestsEndpoint = new BaseEndpoint(this, freightRequestsEndpointPath);
        this._matchProposalsEndpoint = new BaseEndpoint(this, matchProposalsEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every return route. */
    getReturnRoutes() {
        return this._returnRoutesEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Return route resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created route.
     */
    createReturnRoute(resource) {
        return this._returnRoutesEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Return route resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated route.
     */
    updateReturnRoute(resource) {
        return this._returnRoutesEndpoint.update(resource.id, resource);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every freight request. */
    getFreightRequests() {
        return this._freightRequestsEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Freight request resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created request.
     */
    createFreightRequest(resource) {
        return this._freightRequestsEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Freight request resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated request.
     */
    updateFreightRequest(resource) {
        return this._freightRequestsEndpoint.update(resource.id, resource);
    }

    /**
     * @param {number} id - Freight request identifier.
     * @returns {Promise<import('axios').AxiosResponse>} Delete response.
     */
    deleteFreightRequest(id) {
        return this._freightRequestsEndpoint.delete(id);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every match proposal. */
    getMatchProposals() {
        return this._matchProposalsEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Match proposal resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created proposal.
     */
    createMatchProposal(resource) {
        return this._matchProposalsEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Match proposal resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated proposal.
     */
    updateMatchProposal(resource) {
        return this._matchProposalsEndpoint.update(resource.id, resource);
    }
}
