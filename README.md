# Shoal onboarding prototype

Clickable HTML prototype of the Shoal onboarding flow, built from the "Hi-fi v2 · Onboarding" frames in Figma and revised from the Oct 20 user feedback: tasks are created before anything is split per person.

Flow: care situation → (Pebble questions) → tasks → dates → people → per-day availability → split → jars.

## Run it

Serve the folder with any static server, then open http://localhost:5173:

```bash
python3 -m http.server 5173
```

Opening `index.html` straight from disk won't load the styles or script in some browsers.
