import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const shipmentsEndpointPath = import.meta.env.VITE_SHIPMENTS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Service Execution & Monitoring bounded context endpoints.
 *
 * @class ExecutionApi
 * @extends BaseApi
 */
export class ExecutionApi extends BaseApi {
    /** Creates the endpoint client for shipments. */
    constructor() {
        super();
        this._shipmentsEndpoint = new BaseEndpoint(this, shipmentsEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Response with every shipment. */
    getShipments() {
        return this._shipmentsEndpoint.getAll();
    }

    /**
     * @param {number} id - Shipment identifier.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the shipment.
     */
    getShipmentById(id) {
        return this._shipmentsEndpoint.getById(id);
    }

    /**
     * @param {Object} resource - Shipment resource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created shipment.
     */
    createShipment(resource) {
        return this._shipmentsEndpoint.create(resource);
    }

    /**
     * @param {Object} resource - Shipment resource (must include id).
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated shipment.
     */
    updateShipment(resource) {
        return this._shipmentsEndpoint.update(resource.id, resource);
    }
}
