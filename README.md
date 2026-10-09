# Mobility

A mobility and stretching app: pick the areas you want to move better, get a weekly plan, follow guided sessions, track progress.

Built with **Expo (React Native) + TypeScript**. iPhone first, Android later from the same code.

---

## Run it on your iPhone (Windows is fine)

1. Install **Node.js LTS** from nodejs.org.
2. Install **Expo Go** from the App Store on your iPhone.
3. In this folder, run:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the QR code with your iPhone camera. The app opens in Expo Go.

Phone and computer need to be on the same Wi-Fi. If it won't connect, run `npx expo start --tunnel` instead.

**Testing shortcuts** (only while developing): Settings → Testing has a **Premium (test)** switch and **Start again from Welcome**.

---

## How the app is laid out

| Flow | Screens |
| --- | --- |
| First run | Launch animation → Welcome → Areas → Goal + experience → Your routine (days + minutes) → Building → Your plan → **Paywall (7-day free trial)** → Session preview → Session → Complete → Reminder → Today |
| Starting any session | Start → Paywall (only if not subscribed) → **Session preview** (adjust each move's timer) → Session player → Complete |
| Tabs | Today · Plan · Progress · Settings |
| Premium moments | Every session (hard paywall) except the three free quick programmes · "Add an area?" · Programmes · Areas trained |
| Other | Area detail · Exercise detail · Share card · Edit plan |

| Folder | What's in it |
| --- | --- |
| `src/app` | Every screen (file name = route) |
| `src/components` | Body map, pose bubbles, cards, buttons, tab bar, sheets |
| `src/data` | **Exercises** (`exercises.ts`), pose drawings (`poses.ts`), programmes and options (`content.ts`) |
| `src/lib` | Plan generator (`plan.ts`), progress and streaks, reminders, purchases, sharing |
| `src/store` | Saved app state (plan, history, settings) on the phone |
| `src/constants` | Colours, fonts and app settings (`config.ts`) |

---

## Product rules (easy to change)

- **Hard paywall with a free trial:** onboarding and the plan are free to see, but **every session needs Premium** (or its 7-day free trial). There is no free weekly allowance any more. The single gate is `startSession()` in `src/lib/flow.ts`.
- **Premium:** every session (including training one or more body parts from Today), changing areas, programmes, plan adjusts from feedback, areas-trained history. **Free:** the three quick programmes (2, 5 and 10 minutes) on Today.
- **Plan generator:** experience level decides which moves are allowed; goal nudges the order; areas are interleaved; thin areas borrow related moves so sessions never loop two moves.
- **No accounts (for now):** everything is saved on the phone, and Premium comes back with **Restore purchases** (it follows the Apple ID). The old "Save your progress" screen only kept an email on the phone, so it was taken out, with the Account row and Sign in with Apple. When accounts come back they should be real: Sign in with Apple plus an email sign-in link, a backend that verifies them (e.g. Supabase), cloud sync, and in-app account deletion (Apple requires it).

---

## Before you ship

1. **Names:** the app is called **Unknot** (`name` in `app.json`, `appName` in `config.ts`). The app ID is `page.unknot.app` (iOS bundle identifier and Android package, from the domain); it becomes permanent with the first store upload. Published by Andrej Gazi as an individual, so the App Store shows that name as the seller. Contact: support@unknot.page (privacy requests: privacy@unknot.page), both forwarded by Cloudflare Email Routing (rules in the Cloudflare dashboard) to Andrej's Gmail; replies go out from that Gmail. The catch-all stays off, so mail to any other @unknot.page address is dropped.
2. **Paywall:** follow "Paywall setup" below. The code is done; what's left is accounts, products and keys.
3. **Support, Privacy and Terms pages** live at **https://unknot.page** (`/`, `/privacy.html`, `/terms.html`), from the files in `docs/` (`docs/CNAME` holds the domain). The app links to them through `config.links`, and the App Store and Play listings need the same addresses. They name Andrej Gazi (UK) as the publisher, support@unknot.page as the contact and privacy@unknot.page for privacy requests. To put them online (the domain's DNS is on Cloudflare):
   1. **Verify the domain on GitHub first** (stops anyone else's GitHub Pages claiming it): Sahil's GitHub → Settings → Pages → Add a domain → `unknot.page`. Add the TXT record it shows in Cloudflare → DNS, then press Verify.
   2. Merge this work into `main`, then repo Settings → Pages → Deploy from a branch → `main`, folder `/docs`. The custom domain fills itself in from `docs/CNAME`.
   3. In Cloudflare → DNS, add for `unknot.page` (Proxy status **DNS only**, grey cloud): A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and AAAA records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. Optionally a CNAME `www` → `sahilsuresh.github.io`.
   4. Once GitHub shows the certificate is ready, tick **Enforce HTTPS**. `.page` domains only work over HTTPS, so the site stays blank until then (minutes to an hour).
4. **Development build:** purchases need native code, so they don't run in Expo Go (there RevenueCat only shows mock prices). `expo-dev-client` and `eas.json` are set up:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --profile development --platform ios      # or android
   npx expo start                                                       # then open the app from the dev build
   ```

5. **TestFlight / App Store:**

   ```bash
   npx eas-cli@latest build --profile production --platform ios
   npx eas-cli@latest submit --platform ios
   ```

EAS builds in the cloud, so no Mac is needed. You do need an Apple Developer account.

### Paywall setup

The paywall runs on RevenueCat (`react-native-purchases`). Everything about Premium is in `src/lib/purchases.ts`, and RevenueCat is the source of truth: Premium is checked at launch, every time the app comes to the front, and whenever RevenueCat reports a change (renewal, expiry, refund, a pending payment clearing).

**Three modes**

| Mode | When | What happens |
| --- | --- | --- |
| Test mode | Development build or web, no keys | Example prices (labelled), "Start free trial" unlocks Premium with no payment. |
| Test Store | Development build with `EXPO_PUBLIC_REVENUECAT_TEST_KEY` | Real RevenueCat purchases with fake money, no App Store or Google Play needed. Subscriptions renew every few minutes. |
| Live | Any build with the store keys | Real prices and payments (sandbox on TestFlight and Play testing tracks). |

**What the paywall does for App Store review:** the amount actually charged is the biggest price on each plan (the monthly equivalent of yearly is small text), the terms under the button spell out the trial, price, period, automatic renewal and how to cancel, and Restore, Terms of Use and Privacy Policy are on the screen. On iPhone the free trial is only offered to people Apple says can still have one (`withoutUsedTrials` in `purchases.ts`); if Apple can't confirm it, no trial is promised (RevenueCat's advice). Google Play only offers trials to eligible people itself. Settings says "Get Premium" rather than promising a free trial.

A **release** build never gives Premium away: with no keys, or if prices can't load, the paywall says so and offers "Try again". A Test Store key is ignored in release builds (RevenueCat would crash the app on purpose).

**Step 1: RevenueCat (works today, no store accounts needed)**

> **Done on 8 October 2026.** RevenueCat project **Mobility** (in Andrej's RevenueCat account): entitlement `premium`; Test Store products `premium_yearly` ($29.99 a year, 1-week free trial for anyone who has never bought) and `monthly` ($9.99 a month); the `default` offering (current) with `$rc_annual` → `premium_yearly` and `$rc_monthly` → `monthly`. The wizard's own `yearly` product ($79.99, no trial) is left over and unused, so it can be deleted. The Test Store key is in `.env.local` (git-ignored); ask for it rather than committing it. The app is linked to EAS as `@andrejga/mobility-app`.

1. Create a free account at revenuecat.com and a project.
2. **Entitlements:** add one with the identifier `premium` (must match `premiumEntitlement` in `config.ts`).
3. **Apps and providers → Test configuration:** create a Test Store, then add two products to it: a yearly subscription with a 7-day free trial and a monthly one. Attach both to `premium`.
4. **Offerings:** make the default ("current") offering with an **Annual** package and a **Monthly** package. The app picks packages by those types, not by name.
5. Copy `.env.example` to `.env.local` and paste the Test Store key (`test_...`) into `EXPO_PUBLIC_REVENUECAT_TEST_KEY`.
6. Make a development build (step 4 above), run `npx expo start`, and buy, cancel, restore and let a subscription lapse. Customers show up in the RevenueCat dashboard.

**Step 2: App Store (iOS)**

1. Apple Developer Program, then register the bundle ID `page.unknot.app` (Certificates, Identifiers & Profiles) and create the app in App Store Connect.
2. Sign the Paid Applications agreement and add banking and tax (Business section). Without it, products never load.
3. **Subscriptions:** one subscription group with a yearly and a monthly subscription, plus a 7-day free introductory offer on the yearly.
4. In RevenueCat add an App Store app (bundle ID and an In-App Purchase key from App Store Connect), import the two products, attach them to `premium` and to the Annual and Monthly packages of the same offering.
5. Put the public Apple key (`appl_...`) in `EXPO_PUBLIC_REVENUECAT_IOS_KEY`: in `.env.local` for local builds, and as an EAS environment variable (`npx eas-cli@latest env:create`) for cloud builds, since `.env.local` isn't uploaded.
6. Test with a Sandbox tester (App Store Connect → Users and Access → Sandbox) on a development build or TestFlight.

**Step 3: Google Play (Android):** the same with a Play Console app, a service-account credential for RevenueCat, the two subscriptions (a base plan each, a free-trial offer on yearly) and the `goog_...` key in `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. Play needs an upload of the app (internal testing track) before its products can be bought.

---

## Checks

```bash
npm run typecheck
npm run lint
```

Run both before calling any change done.

---

## Handover: the onboarding redesign (branch `onboarding`)

Everything below was built on the `onboarding` branch. It's written so a new chat (or developer) can pick up without the old conversation.

### How to look at it

- `npx expo start`, then press `w` for web. In a wide browser window the app sits in a phone-sized frame.
- Onboarding only shows when there's no saved plan. Use **Settings → Testing → Start again from Welcome**, or open `http://localhost:8081/welcome` (or any `/onboarding/...` route) directly.
- **Settings → Testing → Premium (test)** switches Premium on and off, to see both sides of the paywall.
- Without RevenueCat keys a development build runs the paywall in **test mode**: "Start free trial" unlocks Premium with no payment, and the prices shown are **examples** (£29.99 a year, £9.99 a month).

### Design direction

- **Dark green by default, with a light mode switch.** The app uses Today's dark green look by default: dark green background, cream text, **mint** (`#A6F2C8`) accents, buttons and selected states with dark text on them (`colors.onGreen`), **Lora serif** headings and big numbers (`fonts.display` = `fonts.serif`), Figtree body text. **Settings → Appearance → Dark mode** switches to the light look, which matches Today’s day look: sage-white background, white cards, ink text and deep green buttons with cream text. Both palettes (`DARK`, `LIGHT`) live in `src/constants/theme.ts`; `isDark` is read **synchronously at start-up** (`src/lib/appearance.ts`: `expo-sqlite/kv-store` on phones, `localStorage` on web) and `colors` / `shadows` are picked from it before any screen builds its styles. Switching saves the choice and **reloads the app** (`reloadApp`): instant in development and on web; in store builds it needs `expo-updates` (EAS Update) set up, and until then it shows "Restart the app to see the new look".
- **Colour rules:** always use the tokens, never hard-coded colours, so both modes work: `colors.*`, plus `tint(o)` (lines and soft fills in the text colour), `accent(o)` (accent at an opacity), `glass` / `glassSoft` (frosted surfaces) and `shade(o)` (shadows). Put `colors.onGreen` on `colors.green` fills (dark text on mint in dark mode, white on green in light), never `colors.white`. For something that truly differs between modes, use `isDark ? … : …`.
- The competitor we benchmark against is **Bend**. The aim on every screen: clearer than Bend, built from the user's real data.
- **Honesty rules:** no invented awards, ratings, press logos or "was" prices. Every number on screen comes from real data (the plan generator, the exercise library, store prices).
- Accessibility on every screen: tap targets of at least 44pt, selection never shown by colour alone (ticks too), screen-reader labels and roles, and **reduced motion** respected by every animation.
- **Looks:** `feature/today-page` (the first Today redesign) is merged into `main`, and `feature/today-polish` reworked Today again (see the Today handover below). `resolveLook()` in `src/store/useLook.ts` returns `evening` in dark mode and the light `vision` look in light mode, so Today and Plan always match the rest of the app. The status bar and the tab bar follow the mode. `app.json` has a dark splash background (`#15241D`) and `userInterfaceStyle: automatic` (native changes need a new build).
- **Plan tab** (`src/app/(tabs)/plan.tsx`): deliberately simple. Header "Your plan" with level and goal, one tappable summary pill (days · minutes · areas, opens the routine editor), "Week N" with a thin progress bar, then one card listing the week's sessions (Start on the next one, a tick on done ones, a chevron on the rest), then Programmes. The done count only counts this week's planned sessions, so it always matches the ticks.

### The body figure (used on about 15 screens)

- `src/components/BodyFigure.tsx` draws an **anatomy-chart** figure: the body in a sand muscle tone, a lighter head, **crisp cream seams between the selectable zones**, and faint muscle lines inside them. Selected areas **fill their whole zone green**, with a soft glow.
- The shapes live in `src/data/muscles.ts`: `SEAMS` (zone borders), `DETAILS` (faint muscle lines) and `REGIONS` (the zone that fills for each area), each for `front` and `back`. Left-half shapes are mirrored; `mid: true` shapes sit on the centre line. Everything is clipped to the outline in `src/data/figure.ts` (a 220 × 440 grid).
- Below 100pt tall the figure keeps the old plain look, because the seams blur at that size.
- Back-only areas (upper and lower back) only show properly on the **back** view, so screens that show a user's areas draw **front and back side by side** (building, plan ready, paywall, complete). Welcome shows only the front, by choice.

### Screen by screen

| Screen | File | What it does now |
| --- | --- | --- |
| Launch animation | `src/components/LaunchIntro.tsx`, mounted in `src/app/_layout.tsx` | Picks up from the native splash (the same 120px mark on cream). A ring opens round the mark as it "breathes", the mark lifts, "Mobility · LOOSEN UP · MOVE BETTER" rises in, then it fades into the app. About 1.7s, once per cold start. |
| Welcome | `src/app/welcome.tsx` | Brand row, then an arch "stage" with the front figure inside a ring of real move bubbles from the library. Every 2.6s an area lights on the body, its move grows with a green ring, and a caption card shows the move's name, area and real hold time. Headline "Loosen up. Move better.", three value points, "Get started", "Three quick questions · under a minute". |
| Areas (step 1 of 3) | `src/app/onboarding/areas.tsx`, `src/components/AreaChips.tsx` | One body with a Front/Back toggle and "+" tap dots, and all 10 areas as **wrapped chips** underneath (a list alternative to tapping the body). Picking a back-only area from the chips turns the body round. Button: "Continue with N areas". |
| Goal and experience (2 of 3) | `src/app/onboarding/goal.tsx` | Goals as a two-column grid of cards with move drawings and one-line descriptions. Experience as a Beginner / Intermediate / Advanced control, with a card showing three **real moves** at that level. The copy is accurate: level decides which moves are allowed, goal only changes their order. |
| Your routine (3 of 3) | `src/app/onboarding/days.tsx` | **Days and minutes on one screen** (the old `length.tsx` was deleted). A live preview of the real week (from `generateSessions`) starting **today**, with each session's title, kind and minutes, plus "N min a week". Days: 2, 3, 4, 5, 7 or **Custom** (tap the exact weekdays). Minutes: 5, 10, 15, 20 or **Custom** (a stepper, 3 to 30). Also opened from Settings (`?edit=1`) for both "Days a week" and "Session length". |
| Building | `src/app/onboarding/building.tsx` | Front and back bodies light up the chosen areas, then a three-step checklist with real numbers ("Mapped 2 areas", "Matched 7 moves", "Week laid out" with day dots), a progress bar and "Your plan is ready". About 3.5s. |
| Plan ready | `src/app/onboarding/plan.tsx` | "YOUR PLAN IS READY · Beginner · Move freely", a summary card (front and back bodies, focus-area chips, days / min a session / min a week), and "Your first week" with **real dates** from the start day. Start goes through the paywall. |
| Paywall | `src/app/premium.tsx`, `src/lib/paywall.ts`, `src/lib/purchases.ts` (and `.web.ts`) | "Try it free for 7 days", the user's own plan card, four benefits the app really has, a trial timeline (today, then in 7 days), Yearly (the default, with its per-month price and a **real** "Save X%" worked out from both store prices) and Monthly, full terms under the button, and Restore / Terms / Privacy. With `?then=<sessionId>`, a successful purchase goes straight on to that session. |
| Session preview | `src/app/preview.tsx`, `src/lib/holds.ts` | Every way of starting a session lands here first. Each move shows once (with "2 rounds" where it repeats), plus the real total time, equipment needed and areas. A **− / + timer on every move** (5s steps, 10s to 2 min). Changed times turn green, are **remembered for that move** (`holds` in the store) and are used by the player. "Reset times" undoes them. |
| Session player | `src/app/session.tsx` | Same layout as before, now using your own hold times (`holdFor` / `moveTime`). |
| Complete | `src/app/complete.tsx` | The tick springs in with a confetti burst. A congratulation picked from real data ("First session done!", "Week complete!", "N-day streak!", or a varied cheer plus sessions left this week). Front and back bodies, area chips, tiles (minutes, moves, day streak), a "This week" strip, and "How did that feel?" with a reply explaining what changes. |

### Logic changes (read this before touching plans or progress)

- **Plans start on the day they're built.** `generateSessions` takes `startDay` (weekday, 0 = Monday) and lays the pattern out from there, so the first session (the full "all your areas" one) is today. Sessions are still **stored Monday-first**, which the week logic relies on. `planStartDay(plan)` reads the start day back from `createdAt`, and edits keep it.
- **Custom days:** `Plan.weekdays` and `Draft.weekdays` are optional. When set, sessions go on exactly those days, and `days` is their count. `DaysPerWeek` is now any number from 1 to 7.
- **Custom minutes:** `Minutes` is any whole number. Presets are in `MINUTE_OPTIONS` and the custom range in `CUSTOM_MINUTES` (`src/data/content.ts`). `pickExercises` allows more moves in long sessions (`max(24, budget / 60)`); sessions of 20 minutes or less are built exactly as before.
- **The first week:** `scheduledInWeek(plan, now)` leaves out sessions before the start day in the week the plan was made (nothing counts as missed before joining), and `weeklyTarget(plan, now)` gives the target for any week (smaller in week one). Today, Plan, Progress and Complete use `weeklyTarget` instead of `plan.days`.
- **Session ids repeat between plans** (`s0`, `s1`…). `doneForPlan(plan, history, now)` only counts sessions finished **after the plan was made**, so redoing onboarding doesn't tick off the new plan's sessions. Weekly counts still include everything done this week.
- **Hard paywall:** `startSession()` in `src/lib/flow.ts` opens `/premium?then=<id>` without Premium, and `/preview?id=<id>` with it. Every Start in the app goes through it, or straight to `/preview` behind its own Premium check. The weekly-limit sheet (`limit.tsx`), `config.freeWeeklySessions`, `canStartSession` and `freeSessionsLeft` were removed.
- **Custom hold times:** `holds` (exercise id to seconds per side) is saved in the store via `setHold`. Plans are still **built with the default times**, so lengthening moves makes that session run longer than the chosen length. The preview always shows the real total.
- **Back button:** `OnboardingHeader` goes to the previous step when there's no history (a page opened by URL or refreshed on web). Onboarding is now **3 steps** (`STEPS`).

### Exercise drawings, programmes and navigation

- **Exercise pictures** (`src/components/ExerciseArt.tsx`, used everywhere a move is shown): every one of the 61 moves has two illustrations in `assets/exercises/`, `<id>-start.jpg` (a relaxed starting position) and `<id>-pose.jpg` (the exercise), listed in `src/data/art.ts` with each picture's own background colour so the round frame blends in. Same woman in every picture (low bun, deep forest-green tank top, cream leggings, sage mat, pale sage background). They're made as one two-panel ChatGPT image per move from a shared reference picture, then cut into two square 900×900 crops of the same size and position, so the switch between them only shows the movement. The switch uses the same crossfade timing as the drawings below (`SWITCH` / `SWITCH_CYCLE` from `PoseBubble`). **Two-sided moves** (`eachSide`) are drawn one way; in the session player the picture flips left to right (`mirrored`) during the switch-sides break and for the second side. A move missing from `ART` falls back to its drawing.
- **Pictures as icons** on Today, Plan and Progress: `MoveThumb` (a move's picture by id, still) and `ArtIcon` (an icon on the same sage disc) in `ExerciseArt.tsx`. Each area has a cover move in `AREA_COVER` (`src/data/art.ts`), used by Today's area tiles and pop-up and by Train by body part; each programme has a `cover` move (`src/data/content.ts`) for its row; Recent on Progress shows each session's first move (`firstMove` on `CompletedSession`, matched by pose for older records). The Progress stat tiles each carry an icon: the streak's seed, sprout or plant, a tick for sessions and a target for weeks on target.
- **Exercise drawings** (`src/components/PoseBubble.tsx`, now only the fallback): one character (hair in a bun, deep green top, dark leggings) drawn from joint positions in `src/data/poses.ts`. Each exercise has two pictures: `START` (a normal standing, kneeling, sitting or lying position) and `POSES` (the exercise). With `breathe` on, the bubble **switches between the two pictures** with a short crossfade (start ~1s, fade 0.4s, hold the exercise ~2.6s, fade back) on the native animation thread. Paused or with reduced motion it shows the exercise. Large drawings (120+) show a curved **direction arrow**, worked out from the joint that moves most between the two pictures. `phase` staggers lists (used in the session preview). To fix a drawing that looks wrong, edit its `START` or `POSES` entry; each pair must keep the same path commands.
- **The exercise library** (`src/data/exercises.ts`): 61 moves, each one there for a reason. Every move has a `why` (what it does for you, in plain words, shown as "Why it helps" on the exercise screen) and, where it needs care, a `careful` note (when to ease off or skip, shown with an info icon). The exercise screen reads: picture, name, chips, Why it helps, the care note, How to do it, Good for. Added in this pass to fill real gaps: Doorway chest stretch, Diagonal neck stretch (levator), Puppy stretch, Child's pose side reach (lats), Sphinx, Lying knee drops, Bird dog, Side lunge stretch, World's greatest stretch, Lying hamstring stretch, Wrist extensor stretch (tennis elbow) and Plantar fascia stretch. Elbow bends (filler) became the Overhead triceps stretch under the same id. Later, the one-leg Hamstring stretch was merged into Seated reach (knees keep the Lying hamstring stretch) and Arm circles moved to Shoulders. When the app loads, the store's `merge` drops any exercise id that no longer exists from saved plans, sessions and routines, so removing a move never breaks anyone's data. New drawings in `poses.ts`: `doorway`, `sphinx`, `supineTwist`, `legRaise`, `birdDog`, `puppy`, `sideLunge`, `triceps` and `lungeReach`.
- **Programmes** (`src/data/content.ts`): each has a purpose and its own sequence, not just moves picked for its areas. `about` is one line on who it helps (shown on its row and under the title on a programme day's preview). `moves` is the order: a gentle first move, the main work, a calm last move. `later` moves join from halfway through, once the body has had time to loosen. `programmeMoves(programme, day)` in `src/lib/plan.ts` keeps the first and last moves and the `later` ones, fills the rest of the minutes with the main moves in order, and goes round them again on longer days. The programmes: 2-minute unwind, 5-minute reset and 10-minute flow (free), Lower back relief (14 days), Desk reset, Posture reset (14 days), 14-day hips, Morning flow, Wind down (before bed), Runner's recovery, Post-gym and Hands & wrists.
- **Reminders** (`src/app/reminder.tsx`, logic in `src/lib/reminders.ts`, scheduling in `src/lib/notifications.ts`). The screen: a live preview of the real message, Time (Morning 8:00, Lunchtime 12:30, Evening 7:00 or your own), Days (Plan days, which follow the plan, Every day, or Pick days), and in Settings also Extra nudges and "Send a test reminder" (5 seconds later). The first-run version only asks time and days. Settings shows "7:00 pm · Plan days". The `Reminder` type has `days?` (undefined = plan days), `streak?` (on unless false), `comeback?` (on unless false) and `weekly?` (off unless true).
  - **How they're scheduled:** `planReminders()` works out the next 14 days as one-off date notifications (iOS keeps only the next 64), and `syncNotifications()` rewrites them all whenever the app comes to the front, a session is finished, the plan changes or settings are saved (queued, so they can't double up; it never asks for permission itself). That's what lets each reminder name the real session for that day ("Time for Lower back + Hips", "Hips feeling stiff?", "Your 10 minutes are ready", with a line for the time of day) and lets today's go quiet once you've trained.
  - **Streak saver:** 8 pm on plan days you get reminders on, when your reminder is earlier, "Still time today". **Welcome back:** no extra notification; after 3+ days away with a reminder missed, the next normal reminder says "It's been a few days" instead. **Week ahead:** Sunday 6 pm, "Your week ahead" (opens Plan).
  - Tapping a reminder opens its `data.url` (handled in `src/app/_layout.tsx`). Android uses the `reminders` channel; `app.json` sets the notification colour. A white notification icon for Android is still to add before release. The web build has no-op versions in `notifications.web.ts`, and the screen still saves.
- **Routines tab** (`src/app/(tabs)/routines.tsx`, the middle of five tabs, icon `routine`): your own routines built from any stretch. "Build a routine" opens the builder. Saved routines show as cards with their first moves as overlapping drawings, the name, moves, minutes and rounds, and "Last done …" (set by `recordSession` from the session's `routineId`). Tap a card or Start to begin it; the ••• button (or a long press) opens Edit or Delete, and Delete asks again. "Start from an idea" (`ROUTINE_IDEAS` in `content.ts`: Desk break, Before a run, Bedtime) opens the builder with those moves picked. Starting goes through `routineSession()` + `startCustom` + `startSession`, so the preview, paywall, player and start sound all work as for any session (kind `custom`).
- **Routine builder** (`src/app/routine-builder.tsx`, a modal; `?id=` edits a routine, `?idea=` starts from an idea). Step 1, Pick: a numbered tray of what you've picked, in play order (tap to remove; each pops in as you add it), search with a **Filters** button beside it (a sheet with every area wrapped, nothing scrolling sideways: any number of areas with how many moves each, and a one-tap Your areas; changes apply as you tap, and the button says "Show 7 stretches"; once closed, the button shows how many filters are on and a line under search sums them up with Clear), and a grid of all 61 moves (tap to add or remove; long press opens the exercise screen with its "why"). Step 2, Order & name: name (a suggestion from its areas if left empty), Play it Once / Twice / 3 times, and the order, with up, down and remove on each row. **Fewer ups and downs** (`fewerUpsAndDowns()` in `plan.ts`, using `POSITION` in `poses.ts`) puts standing moves first, then kneeling, sitting and lying, keeping your order within each, so you get down to the floor once. Save routine (the `build` bells) or Save and start. Closing with unsaved changes asks first. Routines are stored as `routines` in the app store.
- **Programme list** (`src/components/ProgrammeList.tsx`): one shared section used on Today and Plan, so both always match. Rows show the drawing, length, what it's for, a "For your plan" tag (or "Free"), progress once started, and Start / Continue / Again / lock. Free programmes skip the paywall. Today passes `hideFree`, because it shows the free ones in their own "Short on time?" section.
- **Back buttons:** always use `goBack()` from `src/lib/flow.ts`, never `router.back()`. It goes home when there's no previous screen (opened from a link, or refreshed on web), instead of erroring.
- **Sound & timer** (`src/app/sound-timer.tsx`, opened from Settings → Sessions, whose row summarises the setup, e.g. "Voice & chimes · 5s rest"). Settings live in the store: `sounds.moveEnd` (chime when a move's time is up, `done`), `sounds.readyEnd` (tone as the rest ends and the stretch starts, `go`), `sounds.voice` (the **voice guide**, on by default, via `expo-speech`; see "Guided sessions" below) and `readySeconds` (**rest between stretches**: 5 / 10 / 15s, default 5; there is always a rest, and `restSeconds()` in `src/lib/holds.ts` maps an old value such as Off to the default). The player labels the pause "Rest" ("Get ready" before the first stretch), and the preview's total time includes it. Each sound has a play button to hear it. Code is in `src/lib/sounds.ts`. The sounds are generated WAV files in `assets/sounds/`, played with `expo-audio` and kept loaded for the whole app run so a chime finishes even when the screen changes. They mix with the user's music and respect the silent switch. The `expo-audio` config plugin in `app.json` has microphone, Android record-audio and background playback turned **off** (the app doesn't use them, and Apple can reject unused ones). Skipping a move doesn't chime; only a move that runs out of time does.
- **Guided sessions** (`src/data/guide.ts`, `src/lib/guide.ts`): the player talks you through every move like a coach. Each of the 61 moves has a script: `kind` (`hold`, a stretch you stay in, or `flow`, a movement you keep going such as rolls, circles and rocks), `setup` (how to get into position), `go` (the movement), `cues` (form and breathing), optional `half` ("Now change direction") and, for two-sided moves, `other` (how to change sides). In a session: the rest says "And relax. Next up: X." plus the setup ("Get ready. First up: X." before the first); as the timer starts, the movement and "Hold for 30 seconds." or, for a flow, "Keep going for 45 seconds." (with the name and setup too if the rest was skipped); `cueSchedule` spreads the cues through the hold, at least 9 seconds apart, starting once the opening line is finished and ending before the "5, 4, 3, 2, 1" countdown (`COUNTDOWN` in `src/lib/holds.ts`), topping up long holds with breathing lines; the switch break says "And relax. Switch sides." and what to change, then "Second side. Hold for 30 seconds."; the end says "Well done. Session complete." A line after the rest or switch queues behind the one still being said instead of cutting it off (`speak(text, delay, { queue })` in `src/lib/sounds.ts`), and the cue timing allows for it. Pausing stops the voice. The guide speaks at a calm 0.9 rate in the phone's best English voice (an Enhanced voice if one is downloaded, British preferred). The line under the picture shows the same words (setup in the rest, the movement, then each cue as it's said), so the guidance is there with the voice off too.
- **Two-sided stretches** (`eachSide`): the player (`src/app/session.tsx`, phases `ready` → `move` → `switch` → `move` with `side` 1 / 2) holds the first side, takes a `SWITCH_SECONDS` (3s) break labelled "Switch sides" (muted ring, "Change to your other side, then hold again."; the `done` chime ends side one and the `go` tone starts side two), then holds the second side, each with its own full countdown. `moveTime()` in `src/lib/holds.ts` counts both sides plus the switch, so the preview's total includes it. Skip during the switch goes straight to the second side.
- **Build-in animations** (`src/components/Appear.tsx`): `<Appear delay kind="rise"|"pop" still>` fades and lifts (or springs) its children in once, `delay` ms after the screen opens; `STAGGER` (70 ms) spaces out lists, and `usePopSounds(start, count, stagger)` plays a soft pop as each item lands. Everything stays still with Reduce Motion on. Used on the onboarding screens: areas (question, body, then each area chip pops in, then Continue), goal (cards one by one; nothing is picked at first, and **Your experience only appears once a goal is tapped**, then scrolls into view), routine (`days.tsx`: the week fills in day by day; **days come first**: the week shows placeholders and "Minutes per session" stays hidden until a day count is picked; opened from Settings it uses `still` and is silent), plan ready (headline, card, both figures pop, focus chips pop, the three numbers count up with `src/components/CountUp.tsx`, then each first-week session slides in) and the session preview (title, fact chips, each move in view, then Start; the time you change with − / + and the total minutes pop as they change). After onboarding: Today (date and streak, the session, its area tiles, Train by body part, quick programmes, programmes, then Start pops up above the tab bar), the Plan tab (header, routine pill, week heading, the progress bar grows to this week's share, then each session row), Session complete (after the tick and burst: the message, area chips pop with pops, the three tiles pop and count up, this week, then the three answers pop in, then Continue) and Sound & timer (title, then each section). The tabs build in once when they first open and play no cascade of pops, since they're opened all the time; their sounds are on taps.
- **UI sounds** (all in `src/lib/sounds.ts`, generated WAVs in `assets/sounds/`): `pop` (each chip or row landing), `select` / `deselect` (picking or un-picking an area, goal, day or minutes; + / − on a hold; each building step ticking off), `next` (Continue in onboarding and on Session complete, Save on Your areas, and opening a programme: two warm marimba notes), `build` (Build my plan: three rising bells), `ready` (the plan-ready screen opening, and Session complete when the session chimes are on: `chimesOn()`) and `start` (every Start button: Get started, Start first session, the paywall once a trial starts, the preview's Start, and every `startSession()` call from Today, the Plan tab and programmes). `playStartSound()` follows the session chimes in Sound & timer, so turning them off quiets every Start too. All of them respect the silent switch and work in Expo Go.

### Open items and known gaps

- **UI UX Pro Max skill** (github.com/nextlevelbuilder/ui-ux-pro-max-skill) is now installed on Andre's machine (`~/.claude/skills/ui-ux-pro-max`) and was used for the Today work. On another machine, install it with `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`.
- **Instant dark mode switch in store builds:** install and configure `expo-updates` (EAS Update) and call `Updates.reloadAsync()` from `reloadApp` in `src/lib/appearance.ts` for release builds. Time-of-day looks (dawn/dusk) were dropped on purpose.
- **Welcome's "Grows with you"** isn't backed yet: levels don't go up on their own (only through "Too easy" / "Too hard" feedback, for Premium). Either build progression or change the copy.
- **Store setup still needed:** yearly and monthly subscriptions with a 7-day free-trial introductory offer in App Store Connect and Google Play, a RevenueCat offering with Annual and Monthly packages, and the keys (see "Paywall setup"). Replace the example.com Terms and Privacy links in `config.ts`.
- **Plans saved before this branch** keep their Monday-based sessions until edited (their first-week target is still worked out from `createdAt`).
- Not yet tested on a physical phone. Everything was checked on web (headless Chrome screenshots of each flow), plus `typecheck` and `lint`.

---

## Handover: the Today redesign (branch `feature/today-polish`, 7 October 2026)

Built on `feature/today-polish` (branched from `main` after the `onboarding` merge) and merged into `main` locally. Written so a new chat or developer can pick it up.

### The idea

Today is **training first**: it answers "what do I train now?" and cuts everything else. Top to bottom:

1. **Header:** the date and the streak pill. (The settings button was removed; Settings is a tab.)
2. **Done today** (only after training): the stamped "Done for today" card shows for about 6 seconds (`DONE_CARD_MS` in `src/app/(tabs)/index.tsx`), or until its **×** is tapped, then folds into a slim **Done today** bar with **Share**. Tap the bar to see the card again. It stays folded for the rest of the day (`foldedOn`). Training something no longer hides the rest of today's session.
3. **Today's session:** its name as the main heading, "Today, 10 minutes, 9 moves at level 1", then a grid of **area tiles** (All areas, plus one per area with "3 moves, 3 min"). Tapping a tile opens a **bottom sheet** with exactly those moves (picture, hold time, their number in the session) and a Start button. The page itself stays short.
4. **Train by body part** (`src/components/today/BodyPartGrid.tsx`): pick a time (**2 / 5 / 10 / 15 min**, remembered in the store as `areaMinutes`), then:
   - **Body**: tap **one or more** parts on the body map (front/back). The summary reads "Shoulders and knees, 5 min, 5 moves, alternating between them"; **Train · 5 min** starts one session across all of them (`makeAreasSession`). **Clear** resets.
   - **List** (the default, shown first in the switch, and back to it every time Today opens, via `useFocusEffect`): one swipeable, snapping row of every area. Your plan's areas come first, **the one left longest first**, each saying when it was last trained ("Not trained yet", "Trained yesterday", "Trained 6 days ago"); each card is a fresh session at the chosen time, not a record; the rest follow. Tapping a card starts it straight away; a long press (or the screen-reader action) opens the area's full move list.
5. **Short on time?** (`QuickProgrammes.tsx`): three free programmes as simple buttons: ▶ **2** min Unwind, ▶ **5** min Reset, ▶ **10** min Flow. Progress ("Day 3 of 7") shows only once started.
6. **Programmes:** the shared list, without the free ones.
7. **Fixed Start bar** (`StartBar.tsx`) above the tab bar: always says what it will train ("Hold to start · 10 min", or "Hold to start · Hips, 2 min" when an area tile is picked).

### Logic added (read before touching sessions)

- **Free quick programmes** (`src/data/content.ts`): `quick-2` (chin tucks and neck side tilt), `quick-5` (cat–cow, knee drops, low lunge, child's pose) and `quick-10` (a full-body flow), 7 days each, with new optional fields `free` (skips the paywall), `easy` (beginner moves only) and `short` (the tile name). They are **the only sessions a free user can open** (they go straight to `/preview`, not through `startSession`). They are listed first in `PROGRAMMES`, so never pick a programme by its position.
- **Sessions that fit their time** (`src/lib/plan.ts`): `fitToMinutes` trims moves from the end until a programme or body-part session fits (keeping at least two), because normal sessions always start with three moves. `minutesForMoves(ids)` is the one time calculation, including the pause between moves; tiles, the sheet and the Start bar all use it, so they always agree.
- **One area of today's session:** `areaSession(base, area)` keeps just that area's moves in their order. **Any body parts, any time:** `makeAreasSession(areas, minutes, plan, levels)` (and `makeAreaSession` for one) mixes the areas, suits each area's level and uses a daily seed, so the move count shown is what starts. These are **recorded in history but don't tick off the planned session** (no `replaces`), so the planned session stays on Today.
- **Store:** new `areaMinutes` (default 5) with `setAreaMinutes`, saved like the other settings.

### Design system on Today

- `src/components/today/Section.tsx`: every section uses the same heading, optional subtitle and 32pt spacing, and `CARD` holds the shared shapes (tiles 16pt corners, cards 20pt, 10pt gaps). Plain surfaces with a hairline border; an area's colour appears only in its icon circle; the selected state is always the accent border plus a light accent tint, with a fixed border width so nothing shifts on tap.
- `ProgrammeList` now uses plain 20pt corners and no heavy shadow, which **also changes the Plan tab** so both match.
- Checked with the UI UX Pro Max skill: 44pt tap targets, no colour-only states, headings for screen readers, no truncated headings, one primary button per screen (the body map's Train button is secondary), nothing hidden behind the fixed Start bar.

### Moved and removed

- **The garden** (`src/components/today/Garden.tsx`) moved from Today to the **Progress** tab. With five or more areas it plants in two rows.
- **Removed on purpose** (agreed with Andre):
  - the "How do you feel today?" check-in (`adjustSession`, `CheckIn`, `answers.ts`, `LookChip.tsx`)
  - the "Where are you stiff today?" screen (`src/app/focus.tsx`), with `startQuick` and `makeQuickSession`. "Train by body part" does this job now.
  - the old session card (`SessionHero.tsx`), the week strip on Today, and `useCountTo.ts`
  - three prototype screens nobody could open: `home-classic.tsx`, `style-board.tsx`, `moves-compare.tsx` (and `PoseBubbleClassic.tsx`)
- All of them are still in git history if they're wanted back.

### Known gaps

- Only checked on web (Chrome) plus `typecheck`, `lint` and an iOS bundle build. **Not yet tried on a phone:** check haptics, the snapping row and the bottom sheet there.
- Starting from the session sheet is a tap; the fixed bar is hold-to-start. Make them match if that feels inconsistent.
- Finishing a single area or a body-part session shows the done card even though the planned session is still to do. Decide whether that should count as "done today".
- The preview screen says "1 MOVES" for a single move (small existing typo in `preview.tsx`).
