import {LicensePlate} from "./license-plate.value-object.js";
import {LoadCapacity} from "./load-capacity.value-object.js";

/**
 * Vehicle entity owned by the CarrierProfile aggregate.
 *
 * @class Vehicle
 */
export class Vehicle {
    /** @type {ReadonlyArray<string>} Supported body types. */
    static BODY_TYPES = Object.freeze(['closed_van', 'flatbed', 'refrigerated', 'box_truck', 'pickup']);

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Vehicle identifier inside the carrier profile.
     * @param {LicensePlate} params.plate - License plate.
     * @param {string} params.brandModel - Brand and model, for example "Isuzu NPR".
     * @param {string} params.bodyType - Body type from {@link Vehicle.BODY_TYPES}.
     * @param {LoadCapacity} params.capacity - Payload and volume capacity.
     * @param {boolean} [params.active=true] - Whether the vehicle can be used in new return routes.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, plate, brandModel, bodyType, capacity, active = true }) {
        if (!(plate instanceof LicensePlate)) throw new Error('validation.plate-invalid');
        if ((brandModel ?? '').trim().length < 2) throw new Error('validation.brand-model-required');
        if (!Vehicle.BODY_TYPES.includes(bodyType)) throw new Error('validation.body-type-invalid');
        if (!(capacity instanceof LoadCapacity)) throw new Error('validation.capacity-weight-invalid');
        this._id = id;
        this._plate = plate;
        this._brandModel = brandModel.trim();
        this._bodyType = bodyType;
        this._capacity = capacity;
        this._active = Boolean(active);
    }

    /** @returns {?number} Vehicle identifier. */
    get id() {
        return this._id;
    }

    /** @returns {LicensePlate} License plate. */
    get plate() {
        return this._plate;
    }

    /** @returns {string} Brand and model. */
    get brandModel() {
        return this._brandModel;
    }

    /** @returns {string} Body type. */
    get bodyType() {
        return this._bodyType;
    }

    /** @returns {LoadCapacity} Capacity. */
    get capacity() {
        return this._capacity;
    }

    /** @returns {boolean} Whether the vehicle is active. */
    get active() {
        return this._active;
    }

    /** @returns {string} Label used in selectors, for example "Isuzu NPR · ABC-123". */
    get label() {
        return `${this._brandModel} · ${this._plate.value}`;
    }

    /**
     * Assigns the identifier when the vehicle is added to a carrier profile.
     *
     * @param {number} id - New identifier.
     * @returns {void}
     */
    assignId(id) {
        this._id = id;
    }

    /** @returns {void} Marks the vehicle as available for new return routes. */
    activate() {
        this._active = true;
    }

    /** @returns {void} Marks the vehicle as unavailable for new return routes. */
    deactivate() {
        this._active = false;
    }
}
