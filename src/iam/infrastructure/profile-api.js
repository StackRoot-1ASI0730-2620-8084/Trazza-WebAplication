import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const carrierProfilesEndpointPath = import.meta.env.VITE_CARRIER_PROFILES_ENDPOINT_PATH;
const merchantProfilesEndpointPath = import.meta.env.VITE_MERCHANT_PROFILES_ENDPOINT_PATH;

/**
 * Infrastructure gateway for carrier and merchant profile endpoints.
 *
 * @class ProfileApi
 * @extends BaseApi
 */
export class ProfileApi extends BaseApi {
    /** Creates endpoint clients for carrier and merchant profiles. */
    constructor() {
        super();
        this._carrierProfilesEndpoint = new BaseEndpoint(this, carrierProfilesEndpointPath);
        this._merchantProfilesEndpoint = new BaseEndpoint(this, merchantProfilesEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every carrier profile. */
    getCarrierProfiles() {
        return this._carrierProfilesEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Carrier profile resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created profile.
     */
    createCarrierProfile(resource) {
        return this._carrierProfilesEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Carrier profile resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated profile.
     */
    updateCarrierProfile(resource) {
        return this._carrierProfilesEndpoint.update(resource.id, resource);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every merchant profile. */
    getMerchantProfiles() {
        return this._merchantProfilesEndpoint.getAll();
    }

    /**
     * @param {Object} resource - Merchant profile resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created profile.
     */
    createMerchantProfile(resource) {
        return this._merchantProfilesEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Merchant profile resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated profile.
     */
    updateMerchantProfile(resource) {
        return this._merchantProfilesEndpoint.update(resource.id, resource);
    }
}
