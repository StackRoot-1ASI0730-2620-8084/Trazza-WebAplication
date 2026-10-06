import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const ratingsEndpointPath = import.meta.env.VITE_RATINGS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Loyalty & Reputation bounded context endpoints.
 *
 * @class ReputationApi
 * @extends BaseApi
 */
export class ReputationApi extends BaseApi {
    /** Creates the endpoint client for ratings. */
    constructor() {
        super();
        this._ratingsEndpoint = new BaseEndpoint(this, ratingsEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every rating. */
    getRatings() {
        return this._ratingsEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Rating resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created rating.
     */
    createRating(resource) {
        return this._ratingsEndpoint.create(resource);
    }
}
