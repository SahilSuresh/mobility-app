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

## Google Play (in progress)

Play Console account "altairdev" is a **personal** account, so Google requires a **closed test with at least 12 testers, opted in for 14 days in a row**, before you can apply for production. Code for this is on the branch `andrej/play-store`.

### Done (10 October 2026)

- [x] App created in Play Console: Unknot, `page.unknot.app`, English (UK), free
- [x] App content: privacy policy, no ads, content rating (Everyone), target audience 18+, data safety, no government or financial features, health = Activity and fitness, no advertising ID
- [x] Sign-in details: reviewers unlock Premium with an access code (Settings → "Have an access code?"). The code is in `.env.local` as `REVIEW_ACCESS_CODE`; see the README's "App review access"
- [x] Store settings: Health & fitness, support@unknot.page, https://unknot.page
- [x] Store listing draft: descriptions, icon, feature graphic, 6 screenshots
- [x] Closed testing track "Closed testing - Alpha": all countries, feedback to support@unknot.page
- [x] Android permissions trimmed (no photo, video or audio read access); layout fixed for 360-wide phones
- [x] Store build: EAS build versionCode 4, downloaded to `Downloads/Unknot-1.0.0-4.aab`

### Next

1. [x] **Build uploaded** (11 October): draft release now "1.0.0 (5) – first closed test" with build 5 (it includes the RevenueCat key; build 4 was removed from the release). The store listing is saved, with all assets labelled as AI-made (Andrej confirmed that AI was used for the icon and illustrations), and Play's "Finish setting up your app" checklist is complete. Earlier, as on Closed testing - Alpha, version code 4, with release notes. Not sent for review.
2. [x] Release name and notes
3. [x] **Subscriptions** in Play Console: both active (Andrej activated them on 11 October). Done as drafts: `premium_yearly`, base plan `yearly` (auto-renewing, £29.99, all 178 countries) and its offer `free-trial-7d` (7 days free, new customers who never had an Unknot subscription). Still to do, by Andrej because they are real-money actions:
   - [ ] **Activate** the `yearly` base plan, then the `free-trial-7d` offer (Monetise with Play → Subscriptions → Unknot Premium (Yearly))
   - [ ] `premium_monthly` exists ("Unknot Premium (Monthly)") but has no base plan yet: Add base plan → ID `monthly` → Auto-renewing, billing period Monthly → Set prices → select all countries → £9.99 GBP → Save → Activate
4. [ ] **RevenueCat ↔ Google Play**. Done on 11 October: RevenueCat app "Unknot (Play Store)" (`page.unknot.app`); products `premium_yearly:yearly` and `premium_monthly:monthly`, both attached to `premium` and added to the `default` offering (Annual and Monthly). The `goog_...` key is in `.env.local` and in EAS (production, preview and development). EAS build versionCode 5 includes it. Still to do by Andrej: a Google Cloud service account with a JSON key, invited in Play Console, and the key uploaded to RevenueCat (Apps → Unknot (Play Store) → Service Account Credentials JSON). Then upload build 5 to the closed test.
5. [ ] **12 testers**: existing lists are "Spark testers" (3) and "Ossa team" (1), so 8 or more Gmail addresses are still needed
6. [ ] Send the closed test for review (ask first), share the opt-in link, and keep 12+ testers in for 14 days
7. [ ] Apply for production access, then a production release
8. [x] `andrej/play-store` merged into `main` and pushed (11 October)
9. [x] New icon (11 October): store icon, feature graphic and screenshot 8 are live on the listing; closed-test release "1.0.0 (6) – new icon" (versionCode 6) sent for review

## Apple App Store (in progress)

Apple Developer account: Andrej Gazi (team HXPN3USWQ5). App Store Connect app **Unknot** (Apple ID 6821625516, bundle `page.unknot.app`, SKU `unknot-ios`). The Paid Apps agreement, bank account and tax forms are already active.

### Done (11 October 2026)

- [x] App ID `page.unknot.app` registered (In-App Purchase included; no push needed)
- [x] App created; subtitle "Stretching & mobility routines"; category Health & Fitness; content rights: no third-party content
- [x] Age rating: 9+ (health and wellness topics, nothing else)
- [x] Subscription group "Unknot Premium": `premium_yearly` (1 year, level 1) and `premium_monthly` (1 month, level 2), with display names and descriptions
- [x] RevenueCat: app "Unknot (App Store)" using the team's existing In-App Purchase key (valid); products attached to `premium` and the `default` offering; the `appl_...` key is in `.env.local` and EAS (production, preview and development)
- [x] iPhone 6.9" screenshots (1290×2796) made

### Next

1. [x] Version page text saved (promotional text, description, keywords, URLs, copyright, review notes with the access code)
2. [x] Eight designed iPhone screenshots uploaded (1206×2622; Apple's 6.1"/6.3" slot)
3. [x] App Privacy published: Purchases (app functionality, analytics) and User ID (app functionality), linked to the user, no tracking
4. [x] Prices set by Andrej: yearly £29.99 with a free first week, monthly £9.99 (175 countries). The app price is Free, available in all 175 countries from release. Both subscriptions have a paywall review screenshot.
5. [x] App Review contact details complete, with phone number
6. [x] iOS build 1.0.0 (2) built with EAS and submitted; it shows "Ready to Submit" in TestFlight (internal group "Team (Expo)")
7. [x] EU Digital Services Act: left as "non-trader" for now (Andrej's choice, 11 October). Revisit if Apple or the EU asks.
8. [x] New app icon (mint knot on dark green, 11 October): iOS build 1.0.0 (3) and Android versionCode 6 carry it; store icon, feature graphic and screenshot 8 updated in both stores
9. [x] **Submitted for App Review (11 October):** version 1.0 with build 3, the Unknot Premium group and both subscriptions ("Waiting for Review"; up to 48 hours). Apple's new "1 Year Upfront" availability was set to all 175 countries at the existing prices, and the regulated medical device question is answered "No"
