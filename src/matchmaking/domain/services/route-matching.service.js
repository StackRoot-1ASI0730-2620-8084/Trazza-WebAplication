import {Detour} from "../model/detour.value-object.js";

/**
 * Domain service of the Matchmaking & Routing context. It estimates distances and detours
 * and decides whether a freight request fits a return route.
 *
 * @class RouteMatchingService
 */
export class RouteMatchingService {
    /**
     * Factor applied to straight-line distances to approximate road distances in Lima.
     * @type {number}
     */
    static ROAD_FACTOR = 1.3;

    /**
     * Average urban speed used to estimate travel times in kilometers per hour.
     * @type {number}
     */
    static AVERAGE_SPEED_KMH = 30;

    /**
     * @param {import('../../../shared/domain/model/address.value-object.js').Address} from - Start address.
     * @param {import('../../../shared/domain/model/address.value-object.js').Address} to - End address.
     * @returns {number} Estimated road distance in kilometers.
     */
    static roadDistance(from, to) {
        return from.location.distanceTo(to.location) * RouteMatchingService.ROAD_FACTOR;
    }

    /**
     * Estimates distance and travel time between two addresses.
     *
     * @param {import('../../../shared/domain/model/address.value-object.js').Address} from - Start address.
     * @param {import('../../../shared/domain/model/address.value-object.js').Address} to - End address.
     * @returns {{distanceKm: number, durationMinutes: number}} Trip estimation.
     */
    static estimateTrip(from, to) {
        const distanceKm = Math.round(RouteMatchingService.roadDistance(from, to) * 10) / 10;
        return { distanceKm, durationMinutes: Math.round(distanceKm / RouteMatchingService.AVERAGE_SPEED_KMH * 60) };
    }

    /**
     * Calculates the extra distance of going origin → pickup → delivery → destination instead of origin → destination.
     *
     * @param {import('../model/return-route.entity.js').ReturnRoute} route - Return route.
     * @param {import('../model/freight-request.entity.js').FreightRequest} request - Freight request.
     * @returns {Detour} Detour of the load for the route.
     */
    static calculateDetour(route, request) {
        const direct = RouteMatchingService.roadDistance(route.origin, route.destination);
        const viaLoad = RouteMatchingService.roadDistance(route.origin, request.pickup)
            + RouteMatchingService.roadDistance(request.pickup, request.delivery)
            + RouteMatchingService.roadDistance(request.delivery, route.destination);
        const distanceKm = Math.max(0, viaLoad - direct);
        return new Detour({ distanceKm, durationMinutes: distanceKm / RouteMatchingService.AVERAGE_SPEED_KMH * 60 });
    }

    /**
     * Evaluates whether a freight request is compatible with a return route.
     *
     * @param {import('../model/return-route.entity.js').ReturnRoute} route - Return route.
     * @param {import('../model/freight-request.entity.js').FreightRequest} request - Freight request.
     * @param {Object} [options={}] - Optional overrides.
     * @param {number} [options.maxDetourKm] - Maximum detour to use instead of the one of the route.
     * @returns {{compatible: boolean, reasons: string[], detour: Detour}} Evaluation result with failed rule keys.
     */
    static evaluate(route, request, options = {}) {
        const detour = RouteMatchingService.calculateDetour(route, request);
        const maxDetourKm = options.maxDetourKm ?? route.maxDetourKm;
        const reasons = [];
        if (!route.status.isActive) reasons.push('matching.route-not-active');
        if (!request.status.isOpen) reasons.push('matching.request-not-open');
        if (route.departureDate !== request.pickupDate) reasons.push('matching.different-date');
        if (!route.timeWindow.overlaps(request.pickupWindow)) reasons.push('matching.time-window');
        if (!route.accepts(request.cargo.type)) reasons.push('matching.cargo-type');
        if (!route.canCarry(request.cargo.weightKg, request.cargo.volumeM3)) reasons.push('matching.capacity');
        if (!detour.isWithin(maxDetourKm)) reasons.push('matching.detour');
        return { compatible: reasons.length === 0, reasons, detour };
    }
}
