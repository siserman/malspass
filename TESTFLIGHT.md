# App Store Connect and TestFlight

## The App Store Connect record

Created 12 October 2026 to reserve the name. Nothing has been uploaded to it yet.

| | |
|---|---|
| Name | **Klecksinger**, the bare word, in English (U.S.) and German. A store name with keywords ("Klecksinger: Malen für Kinder", see [docs/NAME_AND_BRAND.md](docs/NAME_AND_BRAND.md)) can replace it before the first submission |
| Apple ID | `6821960854` |
| SKU | `klecksinger` (permanent) |
| Bundle ID | `com.appinger.klecksinger`, registered through the App Store Connect API the same day |
| Primary language | English (U.S.), with a German localization |
| Team | `XWY4S3RCZA` (Stephan Isermann) |
| Age rating | **4+**, saved 12 Oct 2026 (Brazil: General Audiences, Korea: ALL, Vietnam: 00+). Parental controls: yes; web, user content, social, chat, ads: no; every content question: none |
| Kids Category | **Made for Kids, ages 5 and under.** Apple: this "cannot be changed later". Once the app is approved, it and every update must follow the Kids guidelines, unless a new app record is made. So no third‑party analytics, no ads, no RevenueCat, and links or purchases only behind the parental gate |
| Category | **Education** (primary, set 12 Oct 2026), no secondary. Klecksinger teaches colors, shapes and tools in two languages and follows the early‑years art guidelines ([docs/CONCEPT.md](docs/CONCEPT.md) §7) |

## Builds

So far only development builds, installed straight onto the own iPhone and iPad (README, "Native iOS app"), and one dry run of the release script.

```sh
tools/release.sh             # build a store-signed IPA in build/release/ipa
tools/release.sh --upload    # the same, then validate and upload to App Store Connect
tools/release.sh --no-bump   # reuse the current build number
```

The script bumps the build number, copies the web app with **test mode off** (`tools/build-web.sh release` changes the copy, never the source), syncs, archives and exports. It stops if test mode is still on in the bundled app or the icon has an alpha channel, and afterwards it puts the working copy back to the own‑device state. It needs `ASC_KEY_ID` and `ASC_ISSUER_ID` in the environment and the Capacitor packages already fetched in `build/sim/SourcePackages` (a simulator build does that).

Dry run on 14 November 2026: 1.0 (1), 2.5 MB, signed *Apple Distribution*, not uploaded.

| Build | Uploaded | Notes |
|---|---|---|
| — | — | none yet |
