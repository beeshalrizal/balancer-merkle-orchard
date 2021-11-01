import { DistributionAdded, DistributionClaimed } from './types/MerkleOrchard/MerkleOrchard';

import { 
  getOrAddDistribution,
  getClaimType
} from './utils/helpers';


/**
 *  DistributionAdded is triggered whenever a new distribution has been created
 */
export function handleDistributionAdded(event: DistributionAdded): void {
  getOrAddDistribution(event);
}

/**
 *  DistributionClaimed is triggered whenever a new distribution has been claimed
 *  A distribution can be claimed by either:
 *  - claiming distribution to their own internal balance
 *  - claiming distribution to for a claimer
 *  - claiming distribution to a callback
 */
export function handleDistributionClaimed(event: DistributionClaimed): void {
  const distribution = getOrAddDistribution(event);

  const claimer = event.params.claimer.toHex();
  const recipient = event.params.recipient.toHex();
  const claimCaller = event.transaction.from.toHex();

  distribution.claimer = claimer;
  distribution.recipient = recipient;
  distribution.claimCaller = claimCaller;

  const claimType = getClaimType(claimer, recipient, claimCaller);
  distribution.claimType = claimType;

  distribution.claimedAt = event.block.timestamp;
  distribution.transactionHash = event.transaction.hash.toHex();

  distribution.claimGasPrice = event.transaction.gasPrice;
  distribution.claimGasUsed = event.transaction.gasUsed;

  distribution.save();
}
