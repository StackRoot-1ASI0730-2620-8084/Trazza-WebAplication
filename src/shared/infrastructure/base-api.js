import axios from "axios";
import {iamInterceptor} from "../../iam/infrastructure/iam.interceptor.js";

const platformApi = import.meta.env.VITE_TRAZZA_PLATFORM_API_URL;

/**
 * Shared infrastructure base class that configures the HTTP client used by every bounded context.
 *
 * @class BaseApi
 */
export class BaseApi {
    /**
     * Initializes the Axios HTTP client with the base URL from environment variables
     * and registers the IAM request interceptor.
     */
    constructor() {
        this._http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this._http.interceptors.request.use(iamInterceptor);
    }

    /**
     * Returns the configured Axios HTTP client.
     * @returns {import('axios').AxiosInstance}
     */
    get http() {
        return this._http;
    }
}
