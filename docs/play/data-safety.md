# Data safety form — the answers

Play's Data safety section is a questionnaire, and for this app nearly all of it
is "no". The reason it is "no" is checkable: `AndroidManifest.xml` declares no
permissions at all, including no `INTERNET`, so the app cannot transmit anything
even in principle.

| question | answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | n/a — nothing is transmitted |
| Do you provide a way for users to request that their data is deleted? | n/a — uninstalling deletes the only copy |
| Does your app contain ads? | **No** |
| Does your app allow users to purchase digital goods? | **No** |
| Does your app use a third-party SDK that collects data? | **No** — the app has no dependencies at all |

## If Play asks about "app functionality" data

It should not, because nothing leaves the device, but if the flow pushes you to
declare local storage: game progress is stored on-device only, is not collected,
and is not shared.

## Evidence, if a reviewer asks

- `app/src/main/AndroidManifest.xml` — no `<uses-permission>` elements
- `app/build.gradle.kts` — no `dependencies` block
- The game is served from the APK's own assets through
  `shouldInterceptRequest`; there is no remote origin to reach.
