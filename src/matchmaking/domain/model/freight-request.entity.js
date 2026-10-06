import {Address} from "../../../shared/domain/model/address.value-object.js";
import {Money} from "../../../shared/domain/model/money.value-object.js";
import {TimeWindow} from "./time-window.value-object.js";
import {Cargo} from "./cargo.value-object.js";
import {RequestStatus} from "./request-status.value-object.js";
import {RouteMatchingService} from "../services/route-matching.service.js";

/**
 * Freight request aggregate root. It represents goods a merchant needs to ship.
 *
 * @class FreightRequest
 */
export class FreightRequest {
    /** @type {RegExp} Pattern of an ISO local date. */
    static DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Request identifier.
     * @param {string} params.code - Public code, for example "FR-2210".
     * @param {number} params.merchantId - User identifier of the merchant.
     * @param {Address} params.pickup - Pickup address.
     * @param {Address} params.delivery - Delivery address.
     * @param {string} params.pickupDate - ISO local date (YYYY-MM-DD).
     * @param {TimeWindow} params.pickupWindow - Pickup window.
     * @param {Cargo} params.cargo - Goods description.
     * @param {?Money} [params.offeredRate=null] - Optional rate offered by the merchant.
     * @param {RequestStatus} params.status - Lifecycle status.
     * @param {number} [params.distanceKm=0] - Estimated distance between pickup and delivery.
     * @param {?string} [params.createdAt=null] - ISO creation date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, code, merchantId, pickup, delivery, pickupDate, pickupWindow, cargo,
                    offeredRate = null, status, distanceKm = 0, createdAt = null }) {
        if (!code) throw new Error('validation.code-required');
        if (merchantId === null || merchantId === undefined) throw new Error('validation.merchant-required');
        if (!(pickup instanceof Address)) throw new Error('validation.pickup-required');
        if (!(delivery instanceof Address)) throw new Error('validation.delivery-required');
        if (pickup.equals(delivery)) throw new Error('validation.same-pickup-delivery');
        if (!FreightRequest.DATE_PATTERN.test(pickupDate ?? '')) throw new Error('validation.date-required');
        if (!(pickupWindow instanceof TimeWindow)) throw new Error('validation.time-window-invalid');
        if (!(cargo instanceof Cargo)) throw new Error('validation.cargo-required');
        if (offeredRate !== null && !(offeredRate instanceof Money)) throw new Error('validation.money-invalid');
        if (offeredRate !== null && offeredRate.amount === 0) throw new Error('validation.rate-positive');
        if (!(status instanceof RequestStatus)) throw new Error('validation.status-invalid');
        this._id = id;
        this._code = code;
        this._merchantId = merchantId;
        this._pickup = pickup;
        this._delivery = delivery;
        this._pickupDate = pickupDate;
        this._pickupWindow = pickupWindow;
        this._cargo = cargo;
        this._offeredRate = offeredRate;
        this._status = status;
        this._distanceKm = distanceKm;
        this._createdAt = createdAt;
    }

    /**
     * Factory that registers a new freight request as draft or published.
     *
     * @param {Object} params - Request data plus creation context.
     * @param {string} params.today - ISO local date of today.
     * @param {boolean} params.publish - True to publish immediately, false to save a draft.
     * @returns {FreightRequest} New freight request.
     * @throws {Error} When the pickup date is in the past.
     */
    static create({ today, publish, ...params }) {
        if (!params.pickupDate || params.pickupDate < today) throw new Error('validation.date-in-past');
        const estimation = params.pickup instanceof Address && params.delivery instanceof Address
            ? RouteMatchingService.estimateTrip(params.pickup, params.delivery)
            : { distanceKm: 0 };
        return new FreightRequest({
            ...params,
            code: params.code ?? `FR-${String(Date.now()).slice(-4)}`,
            status: new RequestStatus(publish ? RequestStatus.OPEN : RequestStatus.DRAFT),
            distanceKm: estimation.distanceKm,
            createdAt: params.createdAt ?? new Date().toISOString()
        });
    }

    /** @returns {?number} Request identifier. */
    get id() { return this._id; }

    /** @returns {string} Public code. */
    get code() { return this._code; }

    /** @returns {number} Merchant user identifier. */
    get merchantId() { return this._merchantId; }

    /** @returns {Address} Pickup address. */
    get pickup() { return this._pickup; }

    /** @returns {Address} Delivery address. */
    get delivery() { return this._delivery; }

    /** @returns {string} Pickup date. */
    get pickupDate() { return this._pickupDate; }

    /** @returns {TimeWindow} Pickup window. */
    get pickupWindow() { return this._pickupWindow; }

    /** @returns {Cargo} Goods. */
    get cargo() { return this._cargo; }

    /** @returns {?Money} Rate offered by the merchant. */
    get offeredRate() { return this._offeredRate; }

    /** @returns {RequestStatus} Status. */
    get status() { return this._status; }

    /** @returns {number} Estimated distance. */
    get distanceKm() { return this._distanceKm; }

    /** @returns {?string} Creation date-time. */
    get createdAt() { return this._createdAt; }

    /** @returns {string} Label, for example "Ate → Miraflores". */
    get label() {
        return `${this._pickup.district} → ${this._delivery.district}`;
    }

    /**
     * Publishes a draft so carriers can send offers.
     *
     * @returns {void}
     * @throws {Error} When the request is not a draft.
     */
    publish() {
        if (!this._status.isDraft) throw new Error('validation.request-not-draft');
        this._status = new RequestStatus(RequestStatus.OPEN);
    }

    /**
     * Marks the request as matched with a carrier.
     *
     * @returns {void}
     * @throws {Error} When the request is not open.
     */
    markMatched() {
        if (!this._status.isOpen) throw new Error('validation.request-not-open');
        this._status = new RequestStatus(RequestStatus.MATCHED);
    }

    /**
     * Cancels the request.
     *
     * @returns {void}
     * @throws {Error} When the request was already matched or cancelled.
     */
    cancel() {
        if (!this._status.isOpen && !this._status.isDraft) throw new Error('validation.request-cannot-cancel');
        this._status = new RequestStatus(RequestStatus.CANCELLED);
    }
}
