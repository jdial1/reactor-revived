# Submitting to Play — what is done, and what only you can do

The bundle builds and every asset the console asks for is in `graphics/`. Two
things are left, and both need something I must not have: a signing key, and
your Play account.

## 1. Make the upload key (yours, not mine)

A signing key is the app's identity. Losing it means never updating this app
again; committing it means anyone can publish as you. So it is not in this
repo and I did not create one — the password would have been mine to choose,
and it should be yours.

```bash
keytool -genkeypair -v -keystore upload.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

Then write `keystore.properties` **in the repo root** — it is gitignored:

```properties
storeFile=upload.jks
storePassword=<what you just typed>
keyAlias=upload
keyPassword=<what you just typed>
```

Back both files up somewhere that is not this machine. Play's app signing will
hold the *release* key for you, but the upload key is how it knows an update is
from you.

## 2. Build the bundle

```bash
./gradlew bundleRelease
```

`app/build/outputs/bundle/release/app-release.aab` — about 147 KB. With
`keystore.properties` present it is signed; without it the same command still
works and produces an unsigned bundle, which Play will reject with
"Your Android App Bundle is not signed".

Check which you have:

```bash
keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
```

## 3. Create the app in Play Console

- App name **Reactor Revived**, English (United Kingdom), **Game**, **Free**
- Declarations: not primarily for children; contains no ads

## 4. Fill the console from `listing.md`

Short description, full description, and both graphics come straight out of it.
Screenshots are `graphics/01..05-*.png` — five, where Play wants two to eight.

## 5. The questionnaires

- **Data safety** — answers in `data-safety.md`. Everything is "no", and the
  manifest is the evidence.
- **Content rating** — answers in `content-rating.md`. Expect PEGI 3.
- **Privacy policy** — `PRIVACY.md` at the repo root. It needs a public URL:
  turning on GitHub Pages for this repo puts it at
  `https://<user>.github.io/reactor-revived/privacy` if you rename it to
  `privacy.md` in a Pages-served folder, or link the raw file.
- **Ads** — none. **Target audience** — 13+ is the simplest honest answer; the
  game has nothing for or about children, and choosing under-13 pulls in
  Families policy requirements it does not need.

## 6. Internal testing

Internal testing takes the bundle without review, up to 100 testers by email,
and is the right place to see it on a real phone signed the way the store will
sign it. Create the release, upload the `.aab`, add yourself, share the opt-in
link.

## What is not done, and should be before a public release

- **No version bump plan.** `versionCode` is 1 in `app/build.gradle.kts`; Play
  rejects a second upload with the same number, so bump it every time.
- **`android:allowBackup="true"`** is the manifest default and is left on: your
  save rides along with Android's backup. That is a choice, not an oversight,
  but it is worth knowing.
- **No back-button handling.** Pressing back closes the app from any page rather
  than stepping back to the reactor.
- **Late-game balance is unvalidated.** The upgrade ceiling is inherited from
  Knockoff and the last few tiers have never been played to.
