import { Platform } from 'react-native';
import Purchases, { INTRO_ELIGIBILITY_STATUS, PACKAGE_TYPE, PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { config } from '@/constants/config';

import { TEST_OPTIONS, type BuyResult, type PlanOption } from './paywall';

/**
 * Premium through RevenueCat (see .env.example and the README's "Paywall" section).
 *
 * - Live: a RevenueCat key is set, so prices and purchases come from the store (or RevenueCat's Test Store in development).
 * - Test mode: no key, in a development build only. Buying unlocks Premium on this device with no payment.
 * - Neither (a release build with no key): the paywall says subscriptions aren't available. Premium is never given away.
 */
export type PaywallOption = PlanOption & { pkg?: PurchasesPackage };

let configured = false;

/** The Test Store key wins in development; release builds only ever use the real store keys. */
function apiKey(): string {
  if (__DEV__ && config.revenueCatTestKey) return config.revenueCatTestKey;
  const key = Platform.OS === 'android' ? config.revenueCatAndroidKey : config.revenueCatIosKey;
  // RevenueCat crashes a release build on purpose if it's given a Test Store key, so never pass one on.
  if (!__DEV__ && key.startsWith('test_')) return '';
  return key;
}

export function purchasesLive(): boolean {
  return configured;
}

/** Example prices and free unlocks: only in a development build without a RevenueCat key. */
export function purchasesTestMode(): boolean {
  return !configured && __DEV__;
}

export function initPurchases(): void {
  const key = apiKey();
  if (!key || configured) return;
  Purchases.configure({ apiKey: key });
  configured = true;
}

function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[config.premiumEntitlement] !== undefined;
}

function trialText(pkg: PurchasesPackage): string | undefined {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return undefined;
  const unit = intro.periodUnit.toLowerCase();
  return `${intro.periodNumberOfUnits} ${unit}${intro.periodNumberOfUnits === 1 ? '' : 's'}`;
}

/** The plans to show. Empty when the store can't be reached (or isn't set up), so nothing can be bought without paying. */
export async function loadOptions(): Promise<PaywallOption[]> {
  if (!configured) return purchasesTestMode() ? TEST_OPTIONS : [];
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const options: PaywallOption[] = [];
    const annual = packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
    const monthly = packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
    if (annual)
      options.push({
        id: 'annual',
        title: 'Yearly',
        price: annual.product.priceString,
        period: 'year',
        perMonth: annual.product.pricePerMonthString ?? undefined,
        amount: annual.product.price,
        trial: trialText(annual),
        pkg: annual,
      });
    if (monthly)
      options.push({ id: 'monthly', title: 'Monthly', price: monthly.product.priceString, period: 'month', amount: monthly.product.price, trial: trialText(monthly), pkg: monthly });
    return await withoutUsedTrials(options);
  } catch {
    return [];
  }
}

/**
 * The App Store lists a product's free trial whether or not this person can still have it, so someone who has
 * already had one would see "Start free trial" and then be charged straight away. On iOS, keep the trial only for
 * people Apple confirms are eligible; when it can't tell, RevenueCat advises showing the regular price, so we do.
 * Google Play only sends offers the person can use (and always reports "unknown" here), so Android is left as is.
 */
async function withoutUsedTrials(options: PaywallOption[]): Promise<PaywallOption[]> {
  if (Platform.OS !== 'ios' || !options.some((o) => o.trial)) return options;
  try {
    const ids = options.flatMap((o) => (o.pkg ? [o.pkg.product.identifier] : []));
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    return options.map((o) => {
      const status = o.pkg ? eligibility[o.pkg.product.identifier]?.status : undefined;
      return status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE ? o : { ...o, trial: undefined };
    });
  } catch {
    return options.map((o) => ({ ...o, trial: undefined }));
  }
}

export async function buy(option: PaywallOption): Promise<BuyResult> {
  if (!configured) return purchasesTestMode() ? 'premium' : 'unavailable';
  if (!option.pkg) return 'unavailable';
  try {
    const { customerInfo } = await Purchases.purchasePackage(option.pkg);
    return hasPremium(customerInfo) ? 'premium' : 'inactive';
  } catch (error) {
    const e = error as { userCancelled?: boolean; code?: string };
    if (e.userCancelled) return 'cancelled';
    // Ask to Buy, or a payment the store is still processing: Premium arrives through watchPremium once it clears.
    if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    throw error;
  }
}

/** True or false from the store, or null when there is no store to ask (test mode). Throws if the store can't be reached. */
export async function restore(): Promise<boolean | null> {
  if (!configured) return null;
  return hasPremium(await Purchases.restorePurchases());
}

/** Current Premium status from the store, or null in test mode or when it can't be reached. */
export async function fetchPremium(): Promise<boolean | null> {
  if (!configured) return null;
  try {
    return hasPremium(await Purchases.getCustomerInfo());
  } catch {
    return null;
  }
}

/** Calls back whenever the store's view of Premium changes: a renewal, an expiry, a refund, a pending payment clearing. */
export function watchPremium(onChange: (active: boolean) => void): () => void {
  if (!configured) return () => undefined;
  const listener = (info: CustomerInfo) => onChange(hasPremium(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/** Opens the App Store or Google Play page for cancelling or changing the subscription. False when there is none to open. */
export async function manageSubscription(): Promise<boolean> {
  if (!configured) return false;
  try {
    await Purchases.showManageSubscriptions();
    return true;
  } catch {
    return false;
  }
}
