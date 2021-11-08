import { Address } from "@graphprotocol/graph-ts";
import { DistributionAdded, DistributionClaimed } from "../types/MerkleOrchard/MerkleOrchard";
import { Distribution } from "../types/schema";

export enum ClaimType {
    Internal = 'Internal',
    External = 'External',
    Callback = 'Callback',
}

export function getClaimType(claimer: Address, recipient: Address, claimCaller: Address): string {
    // From the contract, if the emitted event's claimer !== recipient, it is being made to a callback
    if (claimer !== recipient) return ClaimType.Callback;

    // If recipient = claimer = claimCaller, it is being made to an internal wallet
    if (claimer === recipient && claimer  === claimCaller) return ClaimType.Internal;

    // Else the claim is being made to an external wallet
    return ClaimType.External;
};
