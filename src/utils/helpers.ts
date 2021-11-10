import { Address, BigInt } from "@graphprotocol/graph-ts";

// export enum ClaimType {
//     Internal = 'internal',
//     External = 'external',
//     Callback = 'callback',
// }

export function getClaimType(claimer: Address, recipient: Address, claimCaller: Address): string {
    let _claimer = claimer.toHex();
    let _recipient = recipient.toHex();
    let _claimCaller = claimCaller.toHex();

    // From the contract, if the emitted event's claimer !== recipient, it is being made to a callback
    if (_claimer != _recipient) return 'callback';

    // If recipient = claimer = claimCaller, it is being made to an internal wallet
    if (_claimer == _recipient && _claimer  == _claimCaller) return 'internal';

    // Else the claim is being made to an external wallet
    return 'external';
};


/**
 *  Distributions are only distinct per channel. This helper function provides us with a distribution
 *  unique id
 */
export function getDistributionUniqId(distributor: Address, token: Address, distributionId: BigInt): string {
    return distributor.toHex() + token.toHex() + distributionId.toString();
}
