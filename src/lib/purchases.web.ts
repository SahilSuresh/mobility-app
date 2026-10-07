import { TEST_OPTIONS, type PlanOption } from './paywall';

/** Web preview only: purchases always run in test mode. */
export type PaywallOption = PlanOption;

export function purchasesLive(): boolean {
  return false;
}

export function initPurchases(): void {}

export async function loadOptions(): Promise<PaywallOption[]> {
  return TEST_OPTIONS;
}

export async function buy(_option: PaywallOption): Promise<boolean> {
  return true;
}

export async function restore(): Promise<boolean | null> {
  return null;
}

export async function fetchPremium(): Promise<boolean | null> {
  return null;
}
