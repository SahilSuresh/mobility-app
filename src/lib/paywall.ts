/** One plan on the paywall, as shown to the user. Shared by the store and web-preview versions of purchases. */
export type PlanOption = {
  id: 'annual' | 'monthly';
  title: string;
  price: string;
  /** "year" or "month", for "£29.99 a year". */
  period: 'year' | 'month';
  /** What it works out to each month, from the store. */
  perMonth?: string;
  /** Price as a number, to work out real savings between options. */
  amount?: number;
  /** Free trial length, such as "7 days". Only set when the store offers a free trial. */
  trial?: string;
};

/** Example prices for test mode, before the store is connected. Labelled as examples on the paywall. */
export const TEST_OPTIONS: PlanOption[] = [
  { id: 'annual', title: 'Yearly', price: '£29.99', period: 'year', perMonth: '£2.50', amount: 29.99, trial: '7 days' },
  { id: 'monthly', title: 'Monthly', price: '£9.99', period: 'month', amount: 9.99 },
];

/** How much yearly saves over twelve months of monthly, as a whole percent. Null unless both real prices are known. */
export function yearlySaving(options: PlanOption[]): number | null {
  const year = options.find((o) => o.id === 'annual')?.amount;
  const month = options.find((o) => o.id === 'monthly')?.amount;
  if (!year || !month) return null;
  const saving = Math.round((1 - year / (month * 12)) * 100);
  return saving > 0 ? saving : null;
}
