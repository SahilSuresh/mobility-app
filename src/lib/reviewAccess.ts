import * as Crypto from 'expo-crypto';

/**
 * App review access. Unknot has no accounts and store reviewers can't start free trials, so Google Play and
 * the App Store get a code to type into Settings ("Have an access code?") that turns Premium on for that phone.
 * Only the code's SHA-256 is here, never the code (it's in the git-ignored .env.local as REVIEW_ACCESS_CODE).
 * To change it, hash the new code with `normalise` applied and replace this, then give the stores the new code.
 */
const REVIEW_CODE_SHA256 = '126587c324f297db4f124ed6f1b20fdfa92c857256f13c31681d0f7154c36f53';

/** Ignores case, spaces and dashes, so "unknot-abcd-..." typed any way still matches. */
function normalise(input: string): string {
  return input.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/** True when the typed code is the review code. */
export async function isReviewCode(input: string): Promise<boolean> {
  const code = normalise(input);
  if (code.length < 8) return false;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code);
  return hash === REVIEW_CODE_SHA256;
}
