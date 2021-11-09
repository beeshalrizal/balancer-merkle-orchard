import {
  DistributionAdded,
  DistributionClaimed,
} from './types/MerkleOrchard/MerkleOrchard';
import {
  Distribution,
  DistributionSnapshot,
  TokenDistributionSnapshot,
} from './types/schema';


import { bigOne, bigZero } from './utils/constants';
import { BigInt, ethereum } from '@graphprotocol/graph-ts';

import {
  getClaimType
} from './utils/helpers';

/* ********************************
 * ******** Token Snapshot ********
 * ********************************/

// function _getOrAddTokenSnapshot(event: DistributionAdded | DistributionClaimed) {
//   let timestamp = event.block.timestamp.toI32();
//   let dayID = timestamp / 86400;
//   let token = event.params.token;

//   let id = `${token}-${dayID}`;

//   let snapshot = TokenDistributionSnapshot.load(id)

//   if (snapshot == null) {
//     snapshot = new TokenDistributionSnapshot(id);
//     let dayStartTimestamp = dayID * 86400;
//     snapshot.timestamp = BigInt.fromString(dayStartTimestamp.toString());
//     snapshot.numDistributionsAdded = bigZero;
//     snapshot.numDistributionsClaimed = bigZero;
//     snapshot.avgAddedGasPrice = bigZero;
//     snapshot.avgClaimedGasPrice = bigZero;
//     snapshot.totalAmountAddedWei = bigZero;
//     snapshot.totalAmountClaimedWei = bigZero;
//     snapshot.token = token;
//   }

//   return snapshot as TokenDistributionSnapshot;
// }

// function _updateTokenSnapshotOnDistributionAdded(event: DistributionAdded): void {
//   let snapshot = _getOrAddTokenSnapshot(event);

//   let currentAvgGasPrice = snapshot.avgAddedGasPrice;
//   let currentDistributionsAdded = snapshot.numDistributionsAdded;

//   snapshot.avgAddedGasPrice = currentAvgGasPrice.times(currentDistributionsAdded).plus(event.transaction.gasPrice).div(currentDistributionsAdded.plus(bigOne));
//   snapshot.numDistributionsAdded = snapshot.numDistributionsAdded.plus(bigOne);
//   snapshot.totalAmountAddedWei = snapshot.totalAmountAddedWei.plus(event.params.amount);

//   snapshot.save();
// }

// function _updateTokenSnapshotOnDistributionClaimed(event: DistributionClaimed): void {
//   let snapshot = _getOrAddSnapshot(event);

//   let currentAvgGasPrice = snapshot.avgClaimedGasPrice;
//   let currentDistributionsAdded = snapshot.numDistributionsClaimed;

//   snapshot.avgClaimedGasPrice = currentAvgGasPrice.times(currentDistributionsAdded).plus(event.transaction.gasPrice)
//   snapshot.numDistributionsClaimed = currentDistributionsAdded.plus(bigOne);
//   snapshot.totalAmountClaimedWei = snapshot.totalAmountClaimedWei.plus(event.params.amount);

//   snapshot.save()
// }

// /* ********************************
//  * ******** Total Snapshot ********
//  * ********************************/

// function _getOrAddSnapshot(event: DistributionAdded | DistributionClaimed): DistributionSnapshot {
//   let timestamp = event.block.timestamp.toI32();
//   let dayID = timestamp / 86400;
//   let id = `${dayID}`;

//   let snapshot = DistributionSnapshot.load(id)

//   if (snapshot == null) {
//     snapshot = new DistributionSnapshot(id);
//     let dayStartTimestamp = dayID * 86400;
//     snapshot.timestamp = BigInt.fromString(dayStartTimestamp.toString());
//     snapshot.numDistributionsAdded = bigZero;
//     snapshot.numDistributionsClaimed = bigZero;
//     snapshot.avgAddedGasPrice = bigZero;
//     snapshot.avgClaimedGasPrice = bigZero;
//     snapshot.totalAmountAddedWei = bigZero;
//     snapshot.totalAmountClaimedWei = bigZero;
//   }

//   return snapshot as DistributionSnapshot;
// }

// function _updateSnapshotOnDistributionAdded(event: DistributionAdded): void {
//   let timestamp = event.block.timestamp.toI32();
//   let dayID = timestamp / 86400;
//   let id = `${dayID}`;

//   let snapshot = DistributionSnapshot.load(id)

//   if (snapshot == null) {
//     snapshot = new DistributionSnapshot(id);
//     let dayStartTimestamp = dayID * 86400;
//     snapshot.timestamp = BigInt.fromString(dayStartTimestamp.toString());
//     snapshot.numDistributionsAdded = bigZero;
//     snapshot.numDistributionsClaimed = bigZero;
//     snapshot.avgAddedGasPrice = bigZero;
//     snapshot.avgClaimedGasPrice = bigZero;
//     snapshot.totalAmountAddedWei = bigZero;
//     snapshot.totalAmountClaimedWei = bigZero;
//   }

//   let currentAvgGasPrice = snapshot.avgAddedGasPrice;
//   let currentDistributionsAdded = snapshot.numDistributionsAdded;

//   snapshot.avgAddedGasPrice = currentAvgGasPrice.times(currentDistributionsAdded).plus(event.transaction.gasPrice).div(currentDistributionsAdded.plus(bigOne));
//   snapshot.numDistributionsAdded = snapshot.numDistributionsAdded.plus(bigOne);
//   snapshot.totalAmountAddedWei = snapshot.totalAmountAddedWei.plus(event.params.amount);

//   snapshot.save();

//   // _updateTokenSnapshotOnDistributionAdded(event);
// }

// function _updateSnapshotOnDistributionClaimed(event: DistributionClaimed): void {
//   let timestamp = event.block.timestamp.toI32();
//   let dayID = timestamp / 86400;
//   let id = `${dayID}`;

//   let snapshot = DistributionSnapshot.load(id)

//   if (snapshot == null) {
//     snapshot = new DistributionSnapshot(id);
//     let dayStartTimestamp = dayID * 86400;
//     snapshot.timestamp = BigInt.fromString(dayStartTimestamp.toString());
//     snapshot.numDistributionsAdded = bigZero;
//     snapshot.numDistributionsClaimed = bigZero;
//     snapshot.avgAddedGasPrice = bigZero;
//     snapshot.avgClaimedGasPrice = bigZero;
//     snapshot.totalAmountAddedWei = bigZero;
//     snapshot.totalAmountClaimedWei = bigZero;
//   }

//   let currentAvgGasPrice = snapshot.avgClaimedGasPrice;
//   let currentDistributionsClaimed = snapshot.numDistributionsClaimed;

//   snapshot.avgClaimedGasPrice = currentAvgGasPrice.times(currentDistributionsClaimed).plus(event.transaction.gasPrice)
//   snapshot.numDistributionsClaimed = currentDistributionsClaimed.plus(bigOne);
//   snapshot.totalAmountClaimedWei = snapshot.totalAmountClaimedWei.plus(event.params.amount);

//   snapshot.save()

// //   _updateTokenSnapshotOnDistributionClaimed(event);
// }


// /* ********************************
//  * ********* Distribution *********
//  * ********************************/

// function _getOrAddDistribution (event: DistributionAdded): Distribution {
//   let id = event.params.distributionId.toHex();

//   let distribution = Distribution.load(id);
//   if (distribution !== null) return distribution;

//   // create a new distribution
//   distribution = new Distribution(id);

//   // assign initial relevant params
//   distribution.distributor = event.params.distributor;
//   distribution.amountWei = event.params.amount;
//   distribution.token = event.params.token.toHex();
//   distribution.addedAt = event.block.timestamp;
//   distribution.addedTransactionHash = event.transaction.hash;

//   distribution.save();

//   return distribution as Distribution;
// }


/**
 *  DistributionAdded is triggered whenever a new distribution has been created
 */
// export function handleDistributionAdded(event: DistributionAdded): void {
//   let id = event.params.distributionId.toHex();

//   let distribution = Distribution.load(id);
//   if (distribution == null) {
//     // create a new distribution
//     distribution = new Distribution(id);

//     // assign initial relevant params
//     distribution.distributor = event.params.distributor;
//     distribution.amountWei = event.params.amount;
//     distribution.token = event.params.token.toHex();
//     distribution.addedAt = event.block.timestamp;
//     distribution.addedTransactionHash = event.transaction.hash;

//     distribution.distributionId = event.params.distributionId;

//     distribution.claimCount = bigZero;
//   }

//   distribution.save();
//   _updateSnapshotOnDistributionAdded(event);
// }

// // /**
// //  *  DistributionClaimed is triggered whenever a new distribution has been claimed
// //  *  A distribution can be claimed by either:
// //  *  - claiming distribution to their own internal balance
// //  *  - claiming distribution for a claimer
// //  *  - claiming distribution to a callback
// //  */
// export function handleDistributionClaimed(event: DistributionClaimed): void {
//   let id = event.params.distributionId.toHex();

//   let distribution = Distribution.load(id);
//   if (distribution == null) {
//     // create a new distribution
//     distribution = new Distribution(id);

//     // assign initial relevant params
//     distribution.distributor = event.params.distributor;
//     distribution.amountWei = event.params.amount;
//     distribution.token = event.params.token.toHex();
//     distribution.addedAt = event.block.timestamp;
//     distribution.addedTransactionHash = event.transaction.hash;
//   }

//   let claimer = event.params.claimer;
//   let recipient = event.params.recipient;
//   let claimCaller = event.transaction.from;

//   distribution.claimer = claimer;
//   distribution.recipient = recipient;
//   distribution.claimCaller = claimCaller;

//   let claimType = getClaimType(claimer, recipient, claimCaller);
//   distribution.claimType = claimType;

//   distribution.claimedAt = event.block.timestamp;
//   distribution.claimedTransactionHash = event.transaction.hash;
//   distribution.claimGasPrice = event.transaction.gasPrice;

//   distribution.claimCount = distribution.claimCount.plus(bigOne);

//   distribution.save();

//   _updateSnapshotOnDistributionClaimed(event);
// }
