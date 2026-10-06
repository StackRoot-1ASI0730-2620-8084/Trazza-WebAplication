/**
 * Reusable endpoint client with CRUD operations over a resource collection.
 *
 * @class BaseEndpoint
 */
export class BaseEndpoint {
    /**
     * @param {import('./base-api.js').BaseApi} baseApi - Configured API client owner.
     * @param {string} endpointPath - Relative resource path.
     */
    constructor(baseApi, endpointPath) {
        this._http = baseApi.http;
        this._endpointPath = endpointPath;
    }

    /** @returns {string} Relative resource path. */
    get endpointPath() {
        return this._endpointPath;
    }

    /**
     * @param {Object} [params={}] - Optional query string filters.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with resource collection.
     */
    getAll(params = {}) {
        return this._http.get(this._endpointPath, { params });
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with one resource.
     */
    getById(id) {
        return this._http.get(`${this._endpointPath}/${id}`);
    }

    /**
     * @param {Object} resource - Resource payload to create.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with created resource.
     */
    create(resource) {
        return this._http.post(this._endpointPath, resource);
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @param {Object} resource - Resource payload to update.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with updated resource.
     */
    update(id, resource) {
        return this._http.put(`${this._endpointPath}/${id}`, resource);
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response for delete operation.
     */
    delete(id) {
        return this._http.delete(`${this._endpointPath}/${id}`);
    }
}
