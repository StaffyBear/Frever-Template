# Frever App Template v0.1

A clean, app-neutral shell for future Frever applications.

## Included in v0.1

- Five-position bottom navigation.
- Fixed Home and Settings pages.
- Three replaceable middle pages.
- Separate HTML, JSON and JavaScript files for every page.
- App-wide accent colour library in `Config/AccentColours.json`.
- Per-app defaults in `Config/Theme.json`.
- Light, dark and device appearance modes.
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

## Change the app default colour

Edit `Config/Theme.json`:

```json
{
  "defaultAccent": "purple"
}
```

Colour definitions remain in `Config/AccentColours.json`.

## Supabase

`Config/Supabase.json` is disabled in v0.1. Do not place a Supabase service-role key in frontend code. Authentication will be added after the shell has been tested.
