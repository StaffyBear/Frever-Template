# Frever App Template v0.1.2

A clean, app-neutral shell for future Frever applications.

## Included in v0.1.2

- Five-position bottom navigation.
- Fixed Home and Settings shortcuts.
- Three replaceable middle pages.
- Separate HTML, JSON and JavaScript files for every page.
- Shared logo and app name on every page.
- App identity controlled by `Config/App.json`.
- One fixed accent colour per app, selected in `Config/Theme.json`.
- System, Light and Dark appearance options.
- Compact tile-based Homepage without a duplicate Home title or breadcrumb.
- Responsive mobile and desktop layout.
- PWA manifest and service worker.
- Supabase placeholder configuration, with authentication and database access intentionally disabled.

## Run locally

This app loads page files with `fetch()`, so do not open `index.html` directly from the file system.

From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Set the app identity

Edit `Config/App.json`:

```json
{
  "appCode": "fitness",
  "appName": "Frever Fitness",
  "description": "Workouts, routines, PBs and body tracking",
  "logo": "./Assets/Logos/FitnessLogo.png"
}
```

The shared header reads this file, so the same logo and app name appear on every page.

## Set the app colour

Edit `Config/Theme.json`:

```json
{
  "accent": "purple",
  "defaultAppearance": "system",
  "allowUserAppearanceSelection": true
}
```

The available colour definitions remain in `Config/AccentColours.json`. Users cannot change the app accent colour.

## Rename a generic page

To change Page One into Workout:

1. Rename `Pages/PageOne` to `Pages/Workout`.
2. Rename the three files to `Workout.html`, `Workout.json` and `Workout.js`.
3. Update the matching item in `Config/Navigation.json`:

```json
{
  "id": "workout",
  "label": "Workout",
  "folder": "Workout",
  "file": "Workout"
}
```

The router, Homepage tile and bottom-navigation shortcut will then use the renamed page.

## Supabase

`Config/Supabase.json` remains disabled in v0.1.2. Never place a Supabase service-role key in frontend code. Authentication will be added after the shell is approved.
