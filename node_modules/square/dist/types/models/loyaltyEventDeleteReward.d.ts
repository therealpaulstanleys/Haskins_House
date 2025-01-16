import { Schema } from '../schema';
/** Provides metadata when the event `type` is `DELETE_REWARD`. */
export interface LoyaltyEventDeleteReward {
    /** The ID of the [loyalty program]($m/LoyaltyProgram). */
    loyaltyProgramId: string;
    /**
     * The ID of the deleted [loyalty reward]($m/LoyaltyReward).
     * This field is returned only if the event source is `LOYALTY_API`.
     */
    rewardId?: string;
    /** The number of points returned to the loyalty account. */
    points: number;
}
export declare const loyaltyEventDeleteRewardSchema: Schema<LoyaltyEventDeleteReward>;
