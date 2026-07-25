# Frever App Template v0.1.5

A clean, reusable static web-app shell for future Frever applications.

## Included

- Separate HTML, JSON and JavaScript files for every page.
- Shared app logo and app name on every page.
- Homepage with no redundant page heading.
- A page heading on every internal page.
- Fixed Home and Settings navigation buttons.
- Three configurable middle navigation buttons.
- Settings tile layout with shared modal pop-ups.
- Visual System, Light and Dark appearance examples with live preview.
- One fixed app accent selected in `Config/Theme.json`.
- Settings permanently included on the Homepage and excluded from removable options.
- Responsive mobile-first styling.
- PWA manifest and a network-first service worker to prevent mixed-version caches.
- Supabase placeholders, intentionally disconnected until v0.2.

## Page titles

The text displayed above an internal page comes from that page's JSON file. For example:

```text
Pages/Settings/Settings.json
```

```json
{
  "id": "settings",
  "title": "Settings"
}
```

The Homepage is the only page that intentionally has no additional page title.

## Page structure

```text
Pages/
├── Homepage/
│   ├── Homepage.html
│   ├── Homepage.json
│   └── Homepage.js
├── PageOne/
│   ├── PageOne.html
│   ├── PageOne.json
│   └── PageOne.js
├── PageTwo/
├── PageThree/
└── Settings/
```

## App identity

Edit `Config/App.json` to set the app name, code, logo and description.

## Fixed app colour

Edit `Config/Theme.json`:

```json
{
  "accent": "blue",
  "defaultAppearance": "system",
  "allowUserAppearanceSelection": true
}
```

Available palettes are defined in `Config/AccentColours.json`. Users can change appearance, but not the app's accent colour.

## Renaming a page

To turn Page One into Workout:

1. Rename `Pages/PageOne` to `Pages/Workout`.
2. Rename the three files to `Workout.html`, `Workout.json` and `Workout.js`.
3. Update that page's entry in `Config/Navigation.json`.

The Homepage tile, router and navigation label will use the updated configuration.

## Updating from v0.1.4

After uploading v0.1.5, open `update.html` once. It removes only the old Frever Template service-worker cache, preserves local settings, and returns to the app.

## Running locally

This project must run through a web server because it loads modules and page files with `fetch()`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
