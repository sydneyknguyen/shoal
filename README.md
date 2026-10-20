# Shoal prototype

Clickable HTML prototype of the Shoal onboarding flow, built from the "Hi-fi v2 · Onboarding" frames in Figma and revised from the Oct 20 user feedback: tasks are created before anything is split per person.

First open (in `start.js`, from the brand board in Figma): logo splash → sign in with a phone number (texted code), Google, or Facebook → five intro slides on what Shoal is and how it works. Sign-in is simulated; any 6-digit code works.

Onboarding: care situation → (Pebble questions) → tasks → dates → people → calendar sync → free time per day → strengths → split → jars.

Main app (from the "Hi-fi" Figma frames, in `main-app.js`): setup & first stone (jars, pairing, glow, charging) → Home, My jar, People, and Settings tabs → task detail, hand off, add a task, give it a stone, a person's tasks and why, stones and stone detail → celebrations (done, say thanks, jar is clear, weekly recap, thanks to you, recap settings).

The main app uses your onboarding answers. If onboarding was skipped, a demo family fills in. On desktop, "Skip to the main app" in the side panel jumps straight there.

## Run it

Serve the folder with any static server, then open http://localhost:5173:

```bash
python3 -m http.server 5173
```

Opening `index.html` straight from disk won't load the styles or script in some browsers.
