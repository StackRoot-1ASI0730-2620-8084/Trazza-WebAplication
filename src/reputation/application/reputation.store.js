import {computed, reactive} from "vue";
import {ReputationApi} from "../infrastructure/reputation-api.js";
import {RatingAssembler} from "../infrastructure/rating.assembler.js";
import {Rating} from "../domain/model/rating.entity.js";
import {Score} from "../domain/model/score.value-object.js";
import {RatingTarget} from "../domain/model/rating-target.value-object.js";
import useIamStore from "../../iam/application/iam.store.js";

const reputationApi = new ReputationApi();

/**
 * Reactive state of the Loyalty & Reputation bounded context.
 *
 * @type {{ratings: Rating[], loaded: boolean, errors: Error[]}}
 */
const state = reactive({
    ratings: [],
    loaded: false,
    errors: []
});

/** @returns {?number} Identifier of the signed-in user. */
const currentUserId = () => useIamStore().currentUserId.value;

/** @type {import('vue').ComputedRef<Rating[]>} Ratings received by the signed-in user, newest first. */
const myReceivedRatings = computed(() => ratingsReceivedBy(currentUserId()));

/** @type {import('vue').ComputedRef<Rating[]>} Ratings given by the signed-in user, newest first. */
const myGivenRatings = computed(() => state.ratings
    .filter(rating => rating.raterId === currentUserId())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

/**
 * Loads every rating.
 *
 * @returns {Promise<void>}
 */
async function fetchRatings() {
    try {
        state.ratings = RatingAssembler.toEntitiesFromResponse(await reputationApi.getRatings());
        state.loaded = true;
        state.errors = [];
    } catch (error) {
        state.errors.push(error);
    }
}

/**
 * @param {number} userId - User identifier.
 * @returns {Rating[]} Ratings received by the user, newest first.
 */
function ratingsReceivedBy(userId) {
    return state.ratings
        .filter(rating => rating.target.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Calculates the reputation of a user.
 *
 * @param {number} userId - User identifier.
 * @returns {{average: number, count: number, distribution: number[]}} Average stars, number of ratings and count per star (index 0 = 1 star).
 */
function summaryFor(userId) {
    const received = ratingsReceivedBy(userId);
    const distribution = [0, 0, 0, 0, 0];
    received.forEach(rating => distribution[rating.score.value - 1]++);
    const total = received.reduce((sum, rating) => sum + rating.score.value, 0);
    return { average: received.length ? Math.round(total / received.length * 10) / 10 : 0, count: received.length, distribution };
}

/**
 * @param {number} shipmentId - Shipment identifier.
 * @param {number} raterId - Rater identifier.
 * @returns {Rating|undefined} Rating given by the rater for the shipment.
 */
function ratingForShipmentBy(shipmentId, raterId) {
    return state.ratings.find(rating => rating.shipmentId === shipmentId && rating.raterId === raterId);
}

/**
 * Executes the rate-the-counterpart use case after a delivered shipment.
 *
 * @param {Object} params - Rating data.
 * @param {import('../../execution/domain/model/shipment.entity.js').Shipment} params.shipment - Delivered shipment.
 * @param {number} params.score - Stars from 1 to 5.
 * @param {string[]} [params.tags=[]] - Highlight tags.
 * @param {string} [params.comment=''] - Optional comment.
 * @returns {Promise<Rating>} Created rating.
 * @throws {Error} When the shipment was not delivered or it was already rated.
 */
async function submitRating({ shipment, score, tags = [], comment = '' }) {
    const iamStore = useIamStore();
    const raterId = iamStore.currentUserId.value;
    if (!shipment.status.isDelivered) throw new Error('validation.shipment-not-delivered');
    if (!shipment.involves(raterId)) throw new Error('validation.not-a-party');
    if (ratingForShipmentBy(shipment.id, raterId)) throw new Error('validation.already-rated');
    const raterIsCarrier = shipment.carrierId === raterId;
    const rating = new Rating({
        shipmentId: shipment.id,
        raterId,
        raterName: raterIsCarrier ? shipment.carrierName : shipment.merchantName,
        target: raterIsCarrier
            ? new RatingTarget({ userId: shipment.merchantId, role: 'merchant', name: shipment.merchantName })
            : new RatingTarget({ userId: shipment.carrierId, role: 'carrier', name: shipment.carrierName }),
        score: new Score(score),
        tags,
        comment
    });
    const response = await reputationApi.createRating(RatingAssembler.toResourceFromEntity(rating));
    const created = RatingAssembler.toEntityFromResource(response.data);
    state.ratings.push(created);
    return created;
}

const reputationStore = {
    state,
    myReceivedRatings,
    myGivenRatings,
    fetchRatings,
    ratingsReceivedBy,
    summaryFor,
    ratingForShipmentBy,
    submitRating
};

/**
 * Application service store for the Loyalty & Reputation bounded context.
 *
 * @returns {typeof reputationStore} Store state, getters and actions.
 */
const useReputationStore = () => reputationStore;

export default useReputationStore;
