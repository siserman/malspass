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
| Category | not chosen yet (Education or Entertainment, [docs/STORE_PLAN.md](docs/STORE_PLAN.md)) |

## Builds

So far only development builds, installed straight onto the own iPhone and iPad (README, "Native iOS app"). This is not a Flutter app, so the portfolio's `tool/release.sh` doesn't apply. A TestFlight upload needs an archive with distribution signing:

```sh
npm run sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/Klecksinger.xcarchive -allowProvisioningUpdates archive
# then export for App Store Connect and upload with altool, using the account-wide API key
```

Before the first upload: bump `CURRENT_PROJECT_VERSION`, turn test mode off (`Mal.DEV` in `js/core.js`), and check that the icon has no alpha channel (it doesn't today).

| Build | Uploaded | Notes |
|---|---|---|
| — | — | none yet |
