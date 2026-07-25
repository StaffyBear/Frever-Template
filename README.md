# Frever App Template v0.1.3

A clean static web-app foundation for future Frever applications.

## Included

- Shared app header with the app logo and name on every page.
- Fixed app-wide accent colour selected in `Config/Theme.json`.
- Light, dark and system appearance modes.
- Flat page backgrounds in light and dark mode.
- Homepage tiles generated from `Config/Navigation.json`.
- Five-button bottom navigation with fixed Home and Settings positions.
- Three configurable middle navigation buttons.
- Standard Settings tiles:
  - Account
  - Home Layout
  - Navigation Buttons
  - Back up
  - About
- Shared modal component for settings pop-ups.
- Separate HTML, JSON and JavaScript files for every page.
- PWA manifest, service worker and icons.
- Supabase configuration placeholder; authentication is not connected yet.

## Page structure

```text
Pages/
├── Homepage/
│   ├── Homepage.html
│   ├── Homepage.json
│   └── Homepage.js
├── PageOne/
├── PageTwo/
├── PageThree/
└── Settings/
```

When a page is renamed, rename its folder and all three matching files, then update the entry in `Config/Navigation.json`.

## App identity

Edit `Config/App.json` to set the app name, description, version and logo.

## App accent colour

Edit `Config/Theme.json`:

```json
{
  "accent": "blue",
  "defaultAppearance": "system",
  "allowUserAppearanceSelection": true
}
```

Available palettes are stored in `Config/AccentColours.json`. Each app uses one fixed accent colour.

## Local settings

Until Supabase is connected, appearance, Homepage tiles and navigation choices are stored in the browser using local storage.

## Running locally

This project must be served through a web server because it loads page files and JSON with `fetch()`.

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.
