/**
 * Custom type definitions for the Vite environment variables.
 *
 * @remarks
 * This allows for better type checking and autocompletion when using the environment variables in the code.
 */

/// <reference types="vite/client" />
interface ImportMetaEnv {
  /**
   * # VITE_TRAZZA_PLATFORM_API_URL is the base URL of the Trazza platform REST API.
   */
  readonly VITE_TRAZZA_PLATFORM_API_URL: string;
  /**
   * # VITE_USERS_ENDPOINT_PATH is the path to the users' endpoint.
   */
  readonly VITE_USERS_ENDPOINT_PATH: string;
  /**
   * # VITE_CARRIER_PROFILES_ENDPOINT_PATH is the path to the carrier profiles' endpoint.
   */
  readonly VITE_CARRIER_PROFILES_ENDPOINT_PATH: string;
  /**
   * # VITE_MERCHANT_PROFILES_ENDPOINT_PATH is the path to the merchant profiles' endpoint.
   */
  readonly VITE_MERCHANT_PROFILES_ENDPOINT_PATH: string;
  /**
   * # VITE_RETURN_ROUTES_ENDPOINT_PATH is the path to the return routes' endpoint.
   */
  readonly VITE_RETURN_ROUTES_ENDPOINT_PATH: string;
  /**
   * # VITE_FREIGHT_REQUESTS_ENDPOINT_PATH is the path to the freight requests' endpoint.
   */
  readonly VITE_FREIGHT_REQUESTS_ENDPOINT_PATH: string;
  /**
   * # VITE_MATCH_PROPOSALS_ENDPOINT_PATH is the path to the match proposals' endpoint.
   */
  readonly VITE_MATCH_PROPOSALS_ENDPOINT_PATH: string;
  /**
   * # VITE_SHIPMENTS_ENDPOINT_PATH is the path to the shipments' endpoint.
   */
  readonly VITE_SHIPMENTS_ENDPOINT_PATH: string;
  /**
   * # VITE_PAYMENT_TRANSACTIONS_ENDPOINT_PATH is the path to the payment transactions' endpoint.
   */
  readonly VITE_PAYMENT_TRANSACTIONS_ENDPOINT_PATH: string;
  /**
   * # VITE_RECEIPTS_ENDPOINT_PATH is the path to the receipts' endpoint.
   */
  readonly VITE_RECEIPTS_ENDPOINT_PATH: string;
  /**
   * # VITE_RATINGS_ENDPOINT_PATH is the path to the ratings' endpoint.
   */
  readonly VITE_RATINGS_ENDPOINT_PATH: string;
  /**
   * # VITE_PRIME_UI_LICENSE_KEY is the license key for the Prime UI library.
   */
  readonly VITE_PRIME_UI_LICENSE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
