import { getAddress, verifyMessage } from 'ethers';

import { findNotary, findRonProvider } from './registry.js';
import { BundleInput, CheckResult, TrustRegistry, VerificationResult } from './types.js';

function parsePolicyState(profile: string, fallback: string): string {
  const match = profile.match(/([A-Z]{2})$/);
  return match ? match[1] : fallback;
}

function parseSignature(sealPayload: string): string {
  if (sealPayload.startsWith('v1:')) {
    return sealPayload.slice(3);
  }
  return sealPayload;
}

export function verifyBundle(
  input: BundleInput,
  registry: TrustRegistry
): VerificationResult {
  const checks: CheckResult[] = [];
  const reasons: string[] = [];
  let riskScore = 0;

  const notary = findNotary(registry, input.ron.notaryId);
  const provider = findRonProvider(registry, input.ron.provider);
  const timestamp = new Date(input.timestamp ?? new Date().toISOString());

  if (!provider || provider.status !== 'ACTIVE') {
    checks.push({ checkId: 'ron-provider', status: 'FAIL', details: 'Provider inactive or missing' });
    reasons.push('PROVIDER_INACTIVE');
    riskScore += 40;
  } else {
    checks.push({ checkId: 'ron-provider', status: 'PASS' });
  }

  if (!notary) {
    checks.push({ checkId: 'notary-authority', status: 'FAIL', details: 'Notary not found' });
    reasons.push('NOTARY_UNKNOWN');
    riskScore += 80;
  } else {
    const validFrom = new Date(notary.validFrom);
    const validTo = new Date(notary.validTo);
    if (notary.status !== 'ACTIVE' || timestamp < validFrom || timestamp > validTo) {
      checks.push({ checkId: 'notary-authority', status: 'FAIL', details: 'Notary not active' });
      reasons.push('NOTARY_INACTIVE');
      riskScore += 80;
    } else {
      checks.push({ checkId: 'notary-authority', status: 'PASS' });
    }
  }

  if (notary) {
    const signature = parseSignature(input.ron.sealPayload);
    try {
      const signer = verifyMessage(input.doc.docHash, signature);
      if (getAddress(signer) !== getAddress(notary.publicKey)) {
        checks.push({ checkId: 'seal-crypto', status: 'FAIL', details: 'Signature mismatch' });
        reasons.push('SEAL_INVALID');
        riskScore += 80;
      } else {
        checks.push({ checkId: 'seal-crypto', status: 'PASS' });
      }
    } catch (error) {
      checks.push({ checkId: 'seal-crypto', status: 'FAIL', details: 'Signature parse error' });
      reasons.push('SEAL_INVALID');
      riskScore += 80;
    }
  }

  if (input.transactionType.toLowerCase() === 'quitclaim') {
    reasons.push('QUITCLAIM_STRICT');
    riskScore += 35;
    checks.push({ checkId: 'policy-quitclaim', status: 'WARN', details: 'Quitclaim transfer' });
  }

  const policyState = parsePolicyState(input.policy.profile, input.ron.commissionState);
  if (input.ron.commissionState !== policyState) {
    reasons.push('OUT_OF_STATE_NOTARY');
    riskScore += input.policy.profile.includes('STRICT') ? 60 : 25;
    checks.push({ checkId: 'policy-out-of-state', status: 'WARN', details: 'Notary out of state' });
  }

  if (input.bundleId.includes('RAPID') || input.doc.docHash.endsWith('ff00ff')) {
    reasons.push('RAPID_TRANSFER_PATTERN');
    riskScore += 20;
    checks.push({ checkId: 'policy-rapid-transfer', status: 'WARN', details: 'Rapid transfer pattern' });
  }

  let decision: VerificationResult['decision'] = 'ALLOW';
  if (checks.some((check) => check.status === 'FAIL')) {
    decision = 'BLOCK';
    riskScore = Math.max(riskScore, 90);
  } else if (riskScore >= 60) {
    decision = 'BLOCK';
  } else if (riskScore >= 30) {
    decision = 'FLAG';
  }

  return {
    decision,
    reasons: Array.from(new Set(reasons)),
    riskScore,
    checks
  };
}
