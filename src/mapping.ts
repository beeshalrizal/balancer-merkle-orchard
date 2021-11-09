import {
    Claim,
    Claimer,
    ClaimerSnapshot,
    ClaimRoot,
    Distribution,
    Distributor,
    OverallMetric,
    Token,
    DistributionSnapshot,
    DistributorSnapshot,
    TokenSnapshot,
    OverallMetricSnapshot,
} from "./types/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { DistributionAdded, DistributionClaimed } from "./types/MerkleOrchard/MerkleOrchard";
import { AddressZero, bigOne, bigZero } from "./utils/constants";
import { getClaimType } from "./utils/helpers";

/****************************
 ****** Base Entities *******
 ****************************/

/**
 *  DistributionAdded is triggered whenever a new distribution has been created
 */
 export function handleDistributionAdded(event: DistributionAdded): void {
    let distributionId = event.params.distributionId;
    let id = distributionId.toHex();

    let distribution = new Distribution(id);

    distribution.distributor = event.params.distributor;
    distribution.distributionAmount = event.params.amount;
    distribution.unclaimedAmount = event.params.amount;
    distribution.token = event.params.token.toHex();
    distribution.createdAt = event.block.timestamp;
    distribution.transactionHash = event.transaction.hash;
    distribution.distributionId = distributionId;
    distribution.merkleRoot = event.params.merkleRoot;

    distribution.claimedAmount = bigZero;
    distribution.claimCount = bigZero;
  
    distribution.save();

    // update distribution snapshot
    _updateDistributionSnapshotOnDistributionAdded(event);

    // update overall distributor metrics
    _updateDistributorOnDistributionAdded(event);

    // update token metrics
    _updateTokenOnDistributionAdded(event);

    // update overall metrics
    _updateOverallMetricsOnDistributionAdded(event);
}

function _updateTokenOnDistributionAdded(event: DistributionAdded): void {
    let token = _getToken(event.params.token);

    token.distributionAmount = token.distributionAmount.plus(event.params.amount);
    token.distributionCount = token.distributionCount.plus(bigOne);
    token.unclaimedAmount = token.distributionAmount.minus(token.claimedAmount);

    token.save();

    _updateTokenSnapshotOnDistributionAdded
}

function _getToken(tokenId: Bytes): Token {
    let token = Token.load(tokenId.toHex());

    if (token == null) {
        token = new Token(tokenId.toHex());

        token.distributionAmount = bigZero;
        token.distributionCount = bigZero;
        token.claimedAmount = bigZero;
        token.unclaimedAmount = bigZero;
        token.claimedCount = bigZero;

        token.save();
    }

    return token;
}

/**
 *  When a distribution is added, update the overall distribution metrics for the distributor
 */
function _updateDistributorOnDistributionAdded(event: DistributionAdded): void {
    let distributor = _getDistributor(event.params.distributor, event.block.timestamp);
    distributor.distributionAmount = distributor.distributionAmount.plus(event.params.amount);
    distributor.distributionCount = distributor.distributionCount.plus(bigOne);
    distributor.lastDistribution = event.block.timestamp;
    distributor.save();

    _updateDistributorSnapshotOnDistributionAdded(event);
}

function _getDistributor(distributorId: Bytes, timestamp: BigInt): Distributor {
    let distributor = Distributor.load(distributorId.toHex());

    // if no distributor exists, create a new one with blank metrics
    if (distributor == null) {
        distributor = new Distributor(distributorId.toHex());
        distributor.firstDistribution = timestamp;
        distributor.lastDistribution = timestamp;
        distributor.distributionCount = bigZero;
        distributor.distributionAmount = bigZero;
        distributor.claimedCount = bigZero;
        distributor.claimedAmount = bigZero;
        distributor.save();
    }

    return distributor;
}


/**
 * DistributionClaimed is triggered whenever a new distribution is claimed
 * If a user submits multiple claims at once, this event is triggered once per claim.
 */
export function handleDistributionClaimed(event: DistributionClaimed): void {
    let id = event.transaction.hash;

    // First, save or update existing claim parent
    let claimRoot = ClaimRoot.load(id.toHex());
    if (claimRoot == null) {
        claimRoot = new ClaimRoot(id.toHex());

        claimRoot.numClaims = bigZero;
        claimRoot.amount = bigZero;

        claimRoot.claimedAt = event.block.timestamp;
        claimRoot.claimer = event.params.claimer;
        claimRoot.claimCaller = event.transaction.from;
        claimRoot.recipient = event.params.recipient;
        claimRoot.claimedAt = event.block.timestamp;
        claimRoot.gasPrice = event.transaction.gasPrice;
    }
    let claimIndex = claimRoot.numClaims;
    claimRoot.numClaims = claimRoot.numClaims.plus(bigOne);
    claimRoot.amount = claimRoot.amount.plus(event.params.amount);
    claimRoot.save();

    // Save individual claim
    let claimId = event.transaction.hash.toHex() + '-' + claimIndex.toString();
    let claim = new Claim(claimId);

    claim.claimRootId = id;
    claim.index = claimIndex;
    claim.token = event.params.token;
    claim.type = getClaimType(event.params.claimer, event.params.recipient, event.transaction.from);
    claim.distributionId = event.params.distributionId;
    claim.distributor = event.params.distributor;
    claim.claimedAt = event.block.timestamp;
    claim.distribution = event.params.distributionId.toString();
    claim.claimedAmount = event.params.amount;

    claim.save();

    // Update the distribution metrics to reflect this claim
    _updateDistributionOnClaim(event);

    // Update the distributors claim metrics
    _updateDistributorOnClaim(event);

    // Update the claimer's claim metrics
    _updateClaimerOnClaim(event);

    // Update the token claim metrics
    _updateTokenOnClaim(event);

    // Update Overall Metrics on claim
    _updateOverallMetricsOnClaim(event);
}

function _updateTokenOnClaim(event: DistributionClaimed): void {
    let token = _getToken(event.params.token);

    token.claimedAmount = token.claimedAmount.plus(event.params.amount);
    token.unclaimedAmount = token.distributionAmount.minus(token.claimedAmount);
    token.claimedCount = token.claimedCount.plus(bigOne);

    token.save();

    _updateTokenSnapshotOnDistributionClaimed(event);
}

function _updateClaimerOnClaim(event: DistributionClaimed): void {
    let claimer = _getClaimer(event.params.claimer);

    claimer.claimedCount = claimer.claimedCount.plus(bigOne);
    claimer.claimedAmount = claimer.claimedAmount.plus(event.params.amount);
    claimer.lastClaim = event.block.timestamp;

    claimer.save();

    _updateClaimerSnapshot(event);
}

function _getClaimer (claimerId: Address): Claimer {
    let claimer = Claimer.load(claimerId.toHex());

    if (claimer == null) {
        claimer = new Claimer(claimerId.toHex());

        claimer.claimedCount = bigZero;
        claimer.claimedAmount = bigZero;

        claimer.save();
    }

    return claimer;
}

function _updateDistributorOnClaim(event: DistributionClaimed): void {
    let distributor = _getDistributor(event.params.distributor, event.block.timestamp);

    distributor.claimedAmount = distributor.claimedAmount.plus(event.params.amount);
    distributor.claimedCount = distributor.claimedCount.plus(bigOne);
    distributor.unclaimedAmount = distributor.distributionAmount.minus(distributor.claimedAmount);

    distributor.save()

    _updateDistributorSnapshotOnDistributionClaimed(event);
}

function _updateDistributionOnClaim(event: DistributionClaimed): void {
    let distribution = Distribution.load(event.params.distributionId.toHex());

    // This shouldn't be able to happen, could enforce type above O.o
    if (distribution == null) {
        return;
    }

    let claimed = distribution.claimedAmount;
    let numClaims = distribution.claimCount;

    distribution.claimedAmount = claimed.plus(event.params.amount);
    distribution.claimCount = numClaims.plus(bigOne);
    distribution.unclaimedAmount = distribution.distributionAmount.minus(distribution.claimedAmount);

    distribution.save();

    _updateDistributionSnapshotOnClaim(event);
}


/****************************
 ******** Snapshots *********
 ****************************/
function _updateClaimerSnapshot(event: DistributionClaimed): void {
    let snapshot = _getClaimerSnapshot(event.params.claimer, event.block.timestamp);

    snapshot.claimedCount = snapshot.claimedCount.plus(bigOne);
    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);

    snapshot.save();
}

function _getClaimerSnapshot(claimer: Bytes, timestamp: BigInt): ClaimerSnapshot {
    let dayId = timestamp.toI32() / 86400;
    let snapshotId = claimer.toHex() + '-' + dayId.toString();

    let snapshot = ClaimerSnapshot.load(snapshotId);

    if (snapshot == null) {
        let dayStartTimestamp = dayId * 86400;
        snapshot = new ClaimerSnapshot(snapshotId);
        snapshot.timestamp = dayStartTimestamp;
        snapshot.claimer = claimer;
        snapshot.claimedCount = bigZero;
        snapshot.claimedAmount = bigZero;

        snapshot.save();
    }

    return snapshot;
}

function _updateOverallMetricsOnDistributionAdded(event: DistributionAdded): void {
    let snapshot = _getOverallMetrics();

    snapshot.distributionAmount = snapshot.distributionAmount.plus(event.params.amount);
    snapshot.distributionCount = snapshot.distributionCount.plus(bigOne);
    snapshot.unclaimedAmount = snapshot.distributionAmount.minus(snapshot.claimedAmount);

    snapshot.save();

    _updateOverallMetricSnapshotOnDistributionAdded(event);
}

function _updateOverallMetricsOnClaim(event: DistributionClaimed): void {
    let snapshot = _getOverallMetrics();

    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);
    snapshot.claimedCount = snapshot.claimedCount.plus(bigOne);
    snapshot.unclaimedAmount = snapshot.distributionAmount.minus(snapshot.claimedAmount);

    snapshot.save();

    _updateOverallMetricSnapshotOnClaimed(event);
}

function _getOverallMetrics(): OverallMetric {
    let snapshot = OverallMetric.load(AddressZero);

    if (snapshot == null) {
        snapshot = new OverallMetric(AddressZero);
        snapshot.distributionCount = bigZero;
        snapshot.distributionAmount = bigZero;
        snapshot.claimedAmount = bigZero;
        snapshot.claimedCount = bigZero
        snapshot.unclaimedAmount = bigZero

        snapshot.save();
    }

    return snapshot;
}

function _updateDistributionSnapshotOnClaim(event: DistributionClaimed): void {
    let snapshot = _getDistributionSnapshot(event.params.distributionId, event.block.timestamp);

    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);
    snapshot.claimedCount = snapshot.claimedCount.plus(bigOne);

    snapshot.save();
}

function _updateDistributionSnapshotOnDistributionAdded(event: DistributionAdded): void {
    let snapshot = _getDistributionSnapshot(event.params.distributionId, event.block.timestamp);

    snapshot.distributionAmount = snapshot.distributionAmount.plus(event.params.amount);
    snapshot.distributionCount = snapshot.distributionCount.plus(bigOne);

    snapshot.save();
}

function _getDistributionSnapshot(distributionId: BigInt, timestamp: BigInt): DistributionSnapshot {
    let dayId = timestamp.toI32() / 86400;
    let distribution = distributionId.toString();
    let distributionSnapshotId = distribution + '-' + dayId.toString();

    let snapshot = DistributionSnapshot.load(distributionSnapshotId);

    if (snapshot == null) {
        let dayStartTimestamp = dayId * 86400;
        snapshot = new DistributionSnapshot(distributionSnapshotId);
        
        snapshot.timestamp = dayStartTimestamp;
        snapshot.claimedAmount = bigZero;
        snapshot.claimedCount = bigZero;
        snapshot.distributionAmount = bigZero;
        snapshot.distributionCount = bigZero;
        snapshot.distributionId = distributionId;

        snapshot.save();
    }

    return snapshot;
}

function _updateDistributorSnapshotOnDistributionClaimed(event: DistributionClaimed): void {
    let snapshot = _getDistributorSnapshot(event.params.distributor, event.block.timestamp);

    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);
    snapshot.claimedCount = snapshot.claimedCount.plus(bigOne);

    snapshot.save();
}

function _updateDistributorSnapshotOnDistributionAdded(event: DistributionAdded): void {
    let snapshot = _getDistributorSnapshot(event.params.distributor, event.block.timestamp);

    snapshot.distributionAmount = snapshot.distributionAmount.plus(event.params.amount);
    snapshot.distributionCount = snapshot.distributionCount.plus(bigOne);

    snapshot.save();
}

function _getDistributorSnapshot(distributorId: Address, timestamp: BigInt): DistributorSnapshot {
    let dayId = timestamp.toI32() / 86400;
    let distributor = distributorId.toString();
    let distributorSnapshotId = distributor + '-' + dayId.toString();

    let snapshot = DistributorSnapshot.load(distributorSnapshotId);

    if (snapshot == null) {
        let dayStartTimestamp = dayId * 86400;
        snapshot = new DistributorSnapshot(distributorSnapshotId);

        snapshot.timestamp = dayStartTimestamp;
        snapshot.distributorId = distributorId;
        snapshot.distributionAmount = bigZero;
        snapshot.distributionCount = bigZero;
        snapshot.claimedAmount = bigZero;
        snapshot.claimedCount = bigZero;

        snapshot.save();
    }

    return snapshot;
}

function _updateTokenSnapshotOnDistributionAdded(event: DistributionAdded): void {
    let snapshot = _getTokenSnapshot(event.params.token, event.block.timestamp);

    snapshot.distributionAmount = snapshot.distributionAmount.plus(event.params.amount);
    snapshot.distributionCount = snapshot.distributionCount.plus(bigOne);

    snapshot.save();
}

function _updateTokenSnapshotOnDistributionClaimed(event: DistributionClaimed): void {
    let snapshot = _getTokenSnapshot(event.params.token, event.block.timestamp);

    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);
    snapshot.claimedCount  = snapshot.claimedCount.plus(bigOne);

    snapshot.save();
}

function _getTokenSnapshot(token: Address, timestamp: BigInt): TokenSnapshot {
    let dayId = timestamp.toI32() / 86400;
    let tokenSnapshotId = token.toString() + '-' + dayId.toString();

    let snapshot = TokenSnapshot.load(tokenSnapshotId);

    if (snapshot == null) {
        let dayStartTimestamp = dayId * 86400;
        snapshot = new TokenSnapshot(tokenSnapshotId);

        snapshot.timestamp = dayStartTimestamp;
        snapshot.token = token;
        snapshot.claimedAmount = bigZero;
        snapshot.claimedCount = bigZero;
        snapshot.distributionAmount = bigZero;
        snapshot.distributionCount = bigZero;

        snapshot.save();
    }

    return snapshot;
}

function _updateOverallMetricSnapshotOnDistributionAdded(event: DistributionAdded): void {
    let snapshot = _getOverallMetricSnapshot(event.block.timestamp);

    snapshot.distributionAmount = snapshot.distributionAmount.plus(event.params.amount);
    snapshot.distributionCount = snapshot.distributionCount.plus(bigOne);

    snapshot.save();
}

function _updateOverallMetricSnapshotOnClaimed(event: DistributionClaimed): void {
    let snapshot = _getOverallMetricSnapshot(event.block.timestamp);

    snapshot.claimedAmount = snapshot.claimedAmount.plus(event.params.amount);
    snapshot.claimedCount = snapshot.claimedCount.plus(bigOne);

    snapshot.save();
}

function _getOverallMetricSnapshot(timestamp: BigInt): OverallMetricSnapshot {
    let dayId = timestamp.toI32() / 86400;
    let overallSnapshotId = dayId.toString();

    let snapshot = OverallMetricSnapshot.load(overallSnapshotId);

    if  (snapshot == null) {
        let dayStartTimestamp = dayId * 86400;
        snapshot = new OverallMetricSnapshot(overallSnapshotId);

        snapshot.timestamp = dayStartTimestamp;
        snapshot.claimedAmount = bigZero;
        snapshot.claimedCount = bigZero;
        snapshot.distributionAmount = bigZero;
        snapshot.distributionCount = bigZero;

        snapshot.save
    }

    return snapshot;
}
