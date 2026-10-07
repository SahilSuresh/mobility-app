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
| First run | Launch animation → Welcome → Areas → Goal + experience → Your routine (days + minutes) → Building → Your plan → **Paywall (7-day free trial)** → Session preview → Session → Complete → Save progress → Reminder → Today |
| Starting any session | Start → Paywall (only if not subscribed) → **Session preview** (adjust each move's timer) → Session player → Complete |
| Tabs | Today · Plan · Progress · Settings |
| Premium moments | Every session (hard paywall) · "Add an area?" · "Where are you stiff today?" · Programmes · Areas trained |
| Other | Area detail · Exercise detail · Share card · Account · Edit plan |

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
- **Premium:** every session, changing areas, "stiff today" sessions, programmes, plan adjusts from feedback, areas-trained history.
- **Plan generator:** experience level decides which moves are allowed; goal nudges the order; areas are interleaved; thin areas borrow related moves so sessions never loop two moves.
- **Accounts:** sign in with Apple or email is stored **on the phone only** for now. Cloud sync (e.g. Supabase) is the next backend step, so progress follows people to a new phone.

---

## Before you ship

1. **Names:** replace `com.CHANGEME.mobility` and the app name in `app.json`, and `appName` + `links` in `src/constants/config.ts`.
2. **Subscriptions:** in App Store Connect create a yearly and a monthly subscription (with a 7-day free trial). In RevenueCat add an entitlement called `premium` and an offering with **Annual** and **Monthly** packages.
3. **Keys:** copy `.env.example` to `.env.local` and paste your RevenueCat public iOS key. Without a key the paywall runs in **test mode** (no payment taken).
4. **Real purchases and Apple sign-in** need a development build instead of Expo Go:

   ```bash
   npx expo install expo-dev-client
   npx eas-cli@latest build:configure
   npx eas-cli@latest build --profile development --platform ios
   ```

5. **TestFlight / App Store:**

   ```bash
   npx eas-cli@latest build --profile production --platform ios
   npx eas-cli@latest submit --platform ios
   ```

EAS builds in the cloud, so no Mac is needed. You do need an Apple Developer account.

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
- Without RevenueCat keys the paywall runs in **test mode**: "Start free trial" unlocks Premium with no payment, and the prices shown are **examples** (£29.99 a year, £9.99 a month).

### Design direction

- **Dark green by default, with a light mode switch.** The app uses Today's dark green look by default: dark green background, cream text, **mint** (`#A6F2C8`) accents, buttons and selected states with dark text on them (`colors.onGreen`), **Lora serif** headings and big numbers (`fonts.display` = `fonts.serif`), Figtree body text. **Settings → Appearance → Dark mode** switches to the light look, which matches Today’s day look: sage-white background, white cards, ink text and deep green buttons with cream text. Both palettes (`DARK`, `LIGHT`) live in `src/constants/theme.ts`; `isDark` is read **synchronously at start-up** (`src/lib/appearance.ts`: `expo-sqlite/kv-store` on phones, `localStorage` on web) and `colors` / `shadows` are picked from it before any screen builds its styles. Switching saves the choice and **reloads the app** (`reloadApp`): instant in development and on web; in store builds it needs `expo-updates` (EAS Update) set up, and until then it shows "Restart the app to see the new look".
- **Colour rules:** always use the tokens, never hard-coded colours, so both modes work: `colors.*`, plus `tint(o)` (lines and soft fills in the text colour), `accent(o)` (accent at an opacity), `glass` / `glassSoft` (frosted surfaces) and `shade(o)` (shadows). Put `colors.onGreen` on `colors.green` fills (dark text on mint in dark mode, white on green in light), never `colors.white`. For something that truly differs between modes, use `isDark ? … : …`.
- The competitor we benchmark against is **Bend**. The aim on every screen: clearer than Bend, built from the user's real data.
- **Honesty rules:** no invented awards, ratings, press logos or "was" prices. Every number on screen comes from real data (the plan generator, the exercise library, store prices).
- Accessibility on every screen: tap targets of at least 44pt, selection never shown by colour alone (ticks too), screen-reader labels and roles, and **reduced motion** respected by every animation.
- **Looks:** `feature/today-page` (the Today redesign: garden, check-in) is merged into `main`. `resolveLook()` in `src/store/useLook.ts` returns `evening` in dark mode and the light `vision` look in light mode, so Today and Plan always match the rest of the app. The status bar and the tab bar follow the mode. `app.json` has a dark splash background (`#15241D`) and `userInterfaceStyle: automatic` (native changes need a new build).
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

- **Exercise drawings** (`src/components/PoseBubble.tsx`): one character (hair in a bun, deep green top, dark leggings) drawn from joint positions in `src/data/poses.ts`. Each exercise has two pictures: `START` (a normal standing, kneeling, sitting or lying position) and `POSES` (the exercise). With `breathe` on, the bubble **switches between the two pictures** with a short crossfade (start ~1s, fade 0.4s, hold the exercise ~2.6s, fade back) on the native animation thread. Paused or with reduced motion it shows the exercise. Large drawings (120+) show a curved **direction arrow**, worked out from the joint that moves most between the two pictures. `phase` staggers lists (used in the session preview). To fix a drawing that looks wrong, edit its `START` or `POSES` entry; each pair must keep the same path commands.
- **Programmes** (`src/components/ProgrammeList.tsx`): one shared section used on Today and Plan, so both always match. Rows show the drawing, length, areas, a "For your plan" tag, progress once started, and Start / Continue / Again / lock.
- **Back buttons:** always use `goBack()` from `src/lib/flow.ts`, never `router.back()`. It goes home when there's no previous screen (opened from a link, or refreshed on web), instead of erroring.
- **Sound & timer** (`src/app/sound-timer.tsx`, opened from Settings → Sessions, whose row summarises the setup, e.g. "Voice & chimes · 5s rest"). Settings live in the store: `sounds.moveEnd` (chime when a move's time is up, `done`), `sounds.readyEnd` (tone as the rest ends and the stretch starts, `go`), `sounds.voice` (the **voice guide**, on by default, via `expo-speech`: "Get ready. First: X." / "Rest for 5 seconds. Next: X[, on each side]." during the rest, "Hold for 1 minute." (or "First side. Hold for 30 seconds.") as the stretch starts, a spoken countdown "5, 4, 3, 2, 1" at the end of every hold (`COUNTDOWN` in `src/lib/holds.ts`), "Switch sides." in the switch break and "Second side. Hold for 30 seconds." after it, and "Well done. Session complete." at the end; each line waits a moment after its chime so they don't overlap) and `readySeconds` (**rest between stretches**: 5 / 10 / 15s, default 5; there is always a rest, and `restSeconds()` in `src/lib/holds.ts` maps an old value such as Off to the default). The player labels the pause "Rest" ("Get ready" before the first stretch), and the preview's total time includes it. Each sound has a play button to hear it. Code is in `src/lib/sounds.ts`. The sounds are generated WAV files in `assets/sounds/`, played with `expo-audio` and kept loaded for the whole app run so a chime finishes even when the screen changes. They mix with the user's music and respect the silent switch. The `expo-audio` config plugin in `app.json` has microphone, Android record-audio and background playback turned **off** (the app doesn't use them, and Apple can reject unused ones). Skipping a move doesn't chime; only a move that runs out of time does.
- **Two-sided stretches** (`eachSide`): the player (`src/app/session.tsx`, phases `ready` → `move` → `switch` → `move` with `side` 1 / 2) holds the first side, takes a `SWITCH_SECONDS` (3s) break labelled "Switch sides" (muted ring, "Change to your other side, then hold again."; the `done` chime ends side one and the `go` tone starts side two), then holds the second side, each with its own full countdown. `moveTime()` in `src/lib/holds.ts` counts both sides plus the switch, so the preview's total includes it. Skip during the switch goes straight to the second side.
- **Build-in animations** (`src/components/Appear.tsx`): `<Appear delay kind="rise"|"pop" still>` fades and lifts (or springs) its children in once, `delay` ms after the screen opens; `STAGGER` (70 ms) spaces out lists, and `usePopSounds(start, count, stagger)` plays a soft pop as each item lands. Everything stays still with Reduce Motion on. Used on the onboarding screens: areas (question, body, then each area chip pops in, then Continue), goal (cards one by one; nothing is picked at first, and **Your experience only appears once a goal is tapped**, then scrolls into view), routine (`days.tsx`: the week fills in day by day; **days come first**: the week shows placeholders and "Minutes per session" stays hidden until a day count is picked; opened from Settings it uses `still` and is silent), plan ready (headline, card, both figures pop, focus chips pop, the three numbers count up with `src/components/CountUp.tsx`, then each first-week session slides in) and the session preview (title, fact chips, each move in view, then Start; the time you change with − / + and the total minutes pop as they change).
- **UI sounds** (all in `src/lib/sounds.ts`, generated WAVs in `assets/sounds/`): `pop` (each chip or row landing), `select` / `deselect` (picking or un-picking an area, goal, day or minutes; + / − on a hold; each building step ticking off), `next` (Continue in onboarding: two warm marimba notes), `build` (Build my plan: three rising bells), `ready` (the plan-ready screen opening) and `start` (every Start button: Get started, Start first session, the paywall once a trial starts, the preview's Start, and every `startSession()` call from Today, the Plan tab and programmes). `playStartSound()` follows the session chimes in Sound & timer, so turning them off quiets every Start too. All of them respect the silent switch and work in Expo Go.
- **Weekly count on Today:** past the target it shows "2 of 2 done · +1 extra" rather than "3 of 2".

### Open items and known gaps

- **UI UX Pro Max skill** (github.com/nextlevelbuilder/ui-ux-pro-max-skill) was requested but is **not installed**: installing third-party skills was blocked by the permission check. To use it, run in Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`. Its mobile checklist (44pt targets, pressed feedback, no colour-only states, reduced motion) was applied by hand.
- **Instant dark mode switch in store builds:** install and configure `expo-updates` (EAS Update) and call `Updates.reloadAsync()` from `reloadApp` in `src/lib/appearance.ts` for release builds. Time-of-day looks (dawn/dusk) were dropped on purpose.
- **Welcome's "Grows with you"** isn't backed yet: levels don't go up on their own (only through "Too easy" / "Too hard" feedback, for Premium). Either build progression or change the copy.
- **Store setup still needed:** yearly and monthly subscriptions with a 7-day free-trial introductory offer in App Store Connect and Google Play, a RevenueCat offering with Annual and Monthly packages, and the keys in `.env`. Replace the example.com Terms and Privacy links in `config.ts`.
- **Plans saved before this branch** keep their Monday-based sessions until edited (their first-week target is still worked out from `createdAt`).
- Not yet tested on a physical phone. Everything was checked on web (headless Chrome screenshots of each flow), plus `typecheck` and `lint`.
