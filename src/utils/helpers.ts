// import { Token } from '../types/schema';

import { DistributionAdded, DistributionClaimed } from "../types/MerkleOrchard/MerkleOrchard";
import { Distribution } from "../types/schema";

export enum ClaimType {
    Internal = 'Internal',
    External = 'External',
    Callback = 'Callback',
}

export function getClaimType (claimer: string, recipient: string, claimCaller: string): string {
    // From the contract, if the emitted event's claimer !== recipient, it is being made to a callback
    if (claimer !== recipient) return ClaimType.Callback;

    // If recipient = claimer = claimCaller, it is being made to an internal wallet
    if (claimer === recipient && claimer  === claimCaller) return ClaimType.Internal;

    // Else the claim is being made to an external wallet
    return ClaimType.External;
};


export function getOrAddDistribution (event: DistributionAdded | DistributionClaimed): Distribution {
    const id = event.params.distributionId.toHex();

    let distribution = Distribution.load(id);
    if (!!distribution) return distribution;

    // create a new distribution
    distribution = new Distribution(id);

    // assign initial relevant params
    distribution.distributor = event.params.distributor.toHex();
    distribution.amount = event.params.amount;
    distribution.token = event.params.token.toHex();
    distribution.addedAt = event.block.timestamp;
  
    distribution.save();

    return distribution;
}
