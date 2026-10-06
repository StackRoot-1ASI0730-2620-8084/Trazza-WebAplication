/**
 * Immutable value object that represents a geographic position expressed in decimal degrees.
 *
 * @class GeoLocation
 */
export class GeoLocation {
    /**
     * Mean radius of the Earth in kilometers used by the haversine formula.
     * @type {number}
     */
    static EARTH_RADIUS_KM = 6371;

    /**
     * @param {Object} params - Value object attributes.
     * @param {number} params.latitude - Latitude between -90 and 90.
     * @param {number} params.longitude - Longitude between -180 and 180.
     * @throws {Error} When the coordinates are out of range.
     */
    constructor({ latitude, longitude }) {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('validation.latitude-invalid');
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error('validation.longitude-invalid');
        this._latitude = lat;
        this._longitude = lng;
        Object.freeze(this);
    }

    /** @returns {number} Latitude in decimal degrees. */
    get latitude() {
        return this._latitude;
    }

    /** @returns {number} Longitude in decimal degrees. */
    get longitude() {
        return this._longitude;
    }

    /**
     * Calculates the great-circle distance to another location using the haversine formula.
     *
     * @param {GeoLocation} other - Target location.
     * @returns {number} Distance in kilometers.
     */
    distanceTo(other) {
        const toRadians = degrees => degrees * Math.PI / 180;
        const deltaLat = toRadians(other.latitude - this._latitude);
        const deltaLng = toRadians(other.longitude - this._longitude);
        const a = Math.sin(deltaLat / 2) ** 2
            + Math.cos(toRadians(this._latitude)) * Math.cos(toRadians(other.latitude)) * Math.sin(deltaLng / 2) ** 2;
        return 2 * GeoLocation.EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    /**
     * Returns a new location moved towards a target by a fraction of the distance.
     *
     * @param {GeoLocation} target - Target location.
     * @param {number} fraction - Fraction of the distance between 0 and 1.
     * @returns {GeoLocation} New location.
     */
    moveTowards(target, fraction) {
        const ratio = Math.min(Math.max(fraction, 0), 1);
        return new GeoLocation({
            latitude: this._latitude + (target.latitude - this._latitude) * ratio,
            longitude: this._longitude + (target.longitude - this._longitude) * ratio
        });
    }

    /**
     * Calculates the shortest distance between this location and the segment defined by two locations.
     *
     * @param {GeoLocation} start - Segment start.
     * @param {GeoLocation} end - Segment end.
     * @returns {number} Distance in kilometers.
     */
    distanceToSegment(start, end) {
        const kmPerDegree = 111.32;
        const cosLat = Math.cos(this._latitude * Math.PI / 180);
        const project = location => ({
            x: location.longitude * kmPerDegree * cosLat,
            y: location.latitude * kmPerDegree
        });
        const p = project(this);
        const a = project(start);
        const b = project(end);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lengthSquared = dx * dx + dy * dy;
        const t = lengthSquared === 0 ? 0 : Math.min(Math.max(((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared, 0), 1);
        const closestX = a.x + t * dx;
        const closestY = a.y + t * dy;
        return Math.hypot(p.x - closestX, p.y - closestY);
    }

    /**
     * @param {GeoLocation} other - Location to compare.
     * @returns {boolean} True when both locations have the same coordinates.
     */
    equals(other) {
        return other instanceof GeoLocation && other.latitude === this._latitude && other.longitude === this._longitude;
    }
}
