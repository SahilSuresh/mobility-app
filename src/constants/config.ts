/**
 * App-wide settings. Change the working name, links and Premium rules here.
 */
export const config = {
  /** The app's name. Also "name" in app.json, the welcome screen and the launch animation. */
  appName: 'Unknot',

  /** RevenueCat entitlement that unlocks Premium. */
  premiumEntitlement: 'premium',

  /** RevenueCat public SDK keys. Put them in a .env file (see .env.example). */
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  /** RevenueCat Test Store key (starts with test_). Used in development builds only, in place of the two above. */
  revenueCatTestKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY ?? '',

  /**
   * Support, privacy and terms pages on our own domain. They are the files in docs/, served by GitHub Pages
   * from the main branch (docs/CNAME points it at unknot.page). The App Store and Google Play listings need the same addresses.
   */
  links: {
    help: 'https://unknot.page/',
    privacy: 'https://unknot.page/privacy.html',
    terms: 'https://unknot.page/terms.html',
  },
} as const;
