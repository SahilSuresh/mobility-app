# Unknot: launch checklist

Where the app stands on the way to the App Store, as of 10 October 2026. Tick items off as they're done.
The step-by-step instructions for the paywall and builds are in the README ("Before you ship" and "Paywall setup").

## Done

- [x] The app: Today, Plan, Routines, Progress, Settings, onboarding, the session player and the paywall code
- [x] Name **Unknot**, app ID `page.unknot.app` (iOS and Android), EAS project `@andrejga/mobility-app`
- [x] Support, Privacy and Terms pages live at https://unknot.page (`/`, `/privacy.html`, `/terms.html`)
- [x] support@unknot.page and privacy@unknot.page forward to Andrej's inbox (Cloudflare Email Routing)
- [x] RevenueCat project with a Test Store, the `premium` entitlement and the yearly and monthly products
- [x] Typecheck, lint and `npx expo-doctor` all pass

## Blocking the App Store

Steps 1 to 3 need Andrej's own Apple account and bank details.

1. [ ] **Join the Apple Developer Program** ($99 a year). Approval can take a day or two, so start this first.
2. [ ] **App Store Connect**
   - [ ] Register the bundle ID `page.unknot.app` and create the app
   - [ ] Sign the Paid Applications agreement and add banking and tax (without it, prices never load)
   - [ ] One subscription group: a yearly subscription with a 7-day free trial, and a monthly one
3. [ ] **Connect RevenueCat to the App Store**: add the App Store app and an In-App Purchase key, import both products, and attach them to `premium` and the default offering. Put the `appl_...` key in `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, both in `.env.local` and as an EAS environment variable. **Until this is done, a store build shows no prices and nobody can buy Premium.**
4. [ ] **Test on a real iPhone**
   - [ ] Development build: `npx eas-cli@latest build --profile development --platform ios`
   - [ ] With a Sandbox tester: buy, cancel, restore, and let a subscription lapse
   - [ ] Check reminders (notifications), sounds, sharing and saving the week card
   - [ ] TestFlight build: `npx eas-cli@latest build --profile production --platform ios`, then `npx eas-cli@latest submit --platform ios`
5. [ ] **Get the latest work into `main`**: the Today changes on `andrej/dev` (the Quick routines sky cards, the body card, Train by category) need committing, a look from Sahil, then merging. Sahil had set Train by body part to open on List; this work opens it on Body, so agree on that together.
6. [ ] **App Store listing**
   - [ ] iPhone screenshots
   - [ ] Description, subtitle and keywords (no medical claims such as "fixes back pain")
   - [ ] Age rating questionnaire
   - [ ] App Privacy answers (purchases go through RevenueCat)
   - [ ] Category: Health & Fitness
   - [ ] Support URL `https://unknot.page/` and Privacy URL `https://unknot.page/privacy.html`

## Small but important

- [ ] **Turn auto-renew on for unknot.page.** If the domain lapses, the privacy link breaks and Apple can pull the app.
- [ ] Sahil ticks **Enforce HTTPS** in the repo's Settings → Pages.

## Later: Google Play

Same as above with a Play Console account, a service-account credential for RevenueCat, the two subscriptions, the `goog_...` key in `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, and an internal-testing upload before products can be bought. Before uploading, trim the Android permissions in `app.json`: the app only saves images, so it doesn't need the read-media and external-storage permissions, which Play asks you to justify.
