# Reelock Privacy Policy

**Effective date:** September 25, 2026  
**Developer:** Al Hasib Prince Shanto  
**Contact:** alhasib.dev@gmail.com

Reelock is an Android home screen and attention tool. It helps you use your phone on purpose by
blocking feeds, limiting apps, filtering adult and tracking websites, and quieting notifications.

The short version: **Reelock has no account and no server. What it learns about how you use your
phone stays on your phone.** This version shows no advertising and contains no advertising or
analytics SDK.

## What Reelock stores, and where

Everything in this section is stored **only on your device**. Reelock does not send it to us or to
an advertising or analytics service, because we run no backend and include no such SDK. The web
filter's allowed DNS lookups still go to the resolver chosen by your network, as explained below.

- **Your settings and rules.** The apps you protect, their limits and hours, appearance,
  and your Strict Mode PIN. The PIN is stored only as a salted, hashed verifier, never as the PIN.
- **Usage counts.** For apps you have chosen to protect, Reelock keeps counters by hour and by day:
  minutes in the foreground, launches, blocks, and how often a block was bypassed. It keeps no
  record of the time of any individual action. Reelock reads these from the usage statistics
  Android already records, when you grant Usage Access.
- **Held notifications.** If you choose to batch an app's notifications, Reelock keeps the
  notification's title and text so you can read them in "Today's digest". They are encrypted with a
  key held in the Android Keystore, and deleted at the end of the day. Reelock does not read
  notifications you have not chosen to batch or silence.
- **Web filter activity.** The filter shows you how many lookups it allowed and refused, hour by
  hour, held in memory only and cleared when the filter restarts. It never records which sites
  were looked up.
- **Tamper events.** If Strict Mode is on, Reelock records that a change was attempted, so you can see it.

Usage counters are kept for 90 days by default, and you can shorten that in Settings.

### What Reelock does not keep

Reelock does not store what is on your screen, the text you type, your browsing history, the sites
you visit, your contacts, your location history, or the content of your messages. It never reads
password fields or editable text.

You can see exactly what is stored, with counts, on the privacy screen in Settings.

## Why Reelock asks for sensitive permissions

Each permission is requested at the moment you turn on the feature that needs it, with an
explanation first. Declining leaves the rest of the app working.

- **Accessibility service.** Lets Reelock notice which app and which screen, such as a Reels or
  Shorts viewer, is in front of you so it can block it. It reads screen structure in memory to
  decide, keeps none of it, and does not read what you type.
- **VPN service (web filter).** Reelock creates a local VPN on your phone whose only job is to
  answer website name lookups. Names on a blocklist are refused on the device; allowed names are
  passed to the DNS resolver chosen by your network, as your phone would otherwise do directly.
  The resolver can see those allowed lookups and handles them under its own terms. Reelock keeps
  them only in memory long enough to answer the request, records no domain history, and never sends
  them to us or to an advertiser. Web, video and other app traffic never enters Reelock's tunnel.
- **Notification access.** Lets the notification firewall silence or batch notifications from apps
  you choose. Calls and alarms are never held.
- **Usage Access.** Lets Reelock count time and launches for the apps you protect.
- **Foreground service.** Keeps Reelock's protection from being stopped by your phone's battery
  manager. It shows a permanent notification and does no other work.
- **Notifications.** Lets Reelock post your digest reminder and your reflection reminder.
- **Biometrics.** If you choose it, your fingerprint can stand in for typing the Strict Mode PIN,
  through Android's own prompt. Reelock never receives your fingerprint.
- **Home app.** If you make Reelock your home screen, it shows your apps and clock. The app list
  is used to draw the launcher and is not sent anywhere.

## Advertising and third parties

This version of Reelock shows **no advertisements** and includes **no advertising, analytics,
crash-reporting or other third-party data-collection SDK**. It does not use your advertising ID.

Reelock does hold the Android `INTERNET` permission, for one purpose: the web filter forwards
website name lookups you have not blocked to the DNS resolver chosen by your network. That is the
same lookup your phone would make anyway. The resolver is not operated by Reelock; Reelock sends
nothing to us, an advertiser, or an analytics service.

If a later version adds advertising, this policy will be updated first, the app will ask for your
consent where the law requires it, and your Reelock activity will still never be shared with an
advertiser.

## Export and backup

You can export your settings to an encrypted file using a passphrase you choose. The file is
written wherever you pick, through Android's document picker. Reelock does not upload it, and it
never contains your Strict Mode PIN.

Reelock opts out of Android's cloud backup and device-to-device transfer, so your settings do not
leave the phone that way. Moving to a new phone means using the encrypted export above.

## Deleting your data

- **In the app:** Settings, Delete All Data erases every table and preference Reelock holds. It
  needs no account and no request to us. If Strict Mode is active it asks for your PIN first.
- **From Android:** clearing Reelock's storage or uninstalling removes everything.

Because we hold none of your data, there is nothing we can retrieve, correct, or delete on our side.

## Children

Reelock is not directed at children under 13, and we do not knowingly collect their data. Reelock
collects nothing.

## Security

Sensitive local data is protected with Android's own mechanisms: held notification text is encrypted
with a non-exportable Keystore key, and the PIN is stored as a salted hash. Reelock includes no
analytics, crash-reporting, or remote-logging service. Its release build does not log package
names, domains, or notification text.

No system is perfectly secure. Anyone who can unlock your phone or clear Reelock's storage can
change or remove your rules; Reelock says so rather than promising otherwise.

## Changes to this policy

If this policy changes, the new version will be posted at the same address with a new effective
date. If a change affects what leaves your device, the app will tell you before it takes effect.

## Contact

Questions about this policy: alhasib.dev@gmail.com.
