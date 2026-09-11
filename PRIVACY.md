# Privacy policy — Reactor Revived

Last updated: 11 September 2026

**Reactor Revived does not collect, transmit, or share any data about you.**

That is not a policy decision that could quietly change in an update; it is a
property of how the app is built. The app declares no `INTERNET` permission in
its manifest, which means Android will not let it open a network connection even
if some future version tried to. There is no analytics library, no advertising
library, no crash reporter, and no account of any kind. There is nothing in the
app that knows who you are.

## What the app stores, and where

Your game progress — money, upgrades, the parts on your reactor — is written to
the app's own private storage on your device, using the browser `localStorage`
of the WebView the game runs in. It never leaves the device.

If you use **Export save to a file**, the app writes that same progress, as
JSON, to a file you choose with Android's own document picker. That file is
yours. The app has no access to any other file you did not pick.

Uninstalling the app deletes its private storage, and with it your progress.
Any save file you exported is not touched.

## Permissions

The app requests no permissions.

## Children

The app collects nothing from anyone, including children.

## Third-party content

The game ships artwork and sounds made by other people, used under licences that
permit it — Reactor Revival's part sprites, Buch's interface art (CC0), and
Kenney's impact sounds (CC0). None of it contains code, and none of it phones
anywhere. Credits are in the app under Options.

## Changes

If a future version of the app ever collects anything, this document will say so
before that version ships, and the app will ask.

## Contact

justin.dial@mawdpathology.com
