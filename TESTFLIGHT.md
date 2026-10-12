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
| Category, age rating, Kids band | not set yet. They belong to the first submission: Kids Category, age band *5 and under* ([docs/STORE_PLAN.md](docs/STORE_PLAN.md), section D) |

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
