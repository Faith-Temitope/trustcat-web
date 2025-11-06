# TrustCat — Presentation-ready Static Demo

This is a static HTML/CSS/JS version of the TrustCat demo suitable for a presentation.

Pages included:

- `index.html` — Landing / hero
- `facts.html` — Facts list with favorite action
- `gallery.html` — Image gallery
- `breeds.html` — Breed cards
- `trivia.html` — Short interactive quiz
- `login.html` — Mock login
- `profile.html` — Protected profile with favorites

How to run (PowerShell):

```powershell
# Serve the site locally from the project root
cd c:\Users\hp\trustcat\created\trustcat-web
python -m http.server 8000
# Then open http://localhost:8000 in your browser
```

Notes:

- Authentication is client-side mock (demo account: demo@trustcat.test / password)
- Favorites are stored in `localStorage` for demo persistence
- Images use `placekitten.com` placeholders for quick presentation

Gallery images:

- The gallery attempts to fetch live images from TheCatAPI. If the API call fails (CORS or network), the site falls back to local placeholder images in `js/data.js`.

Quiz statistics:

- The trivia page now records quiz attempts to `localStorage` and shows Attempts, Average score, and Best score. These are shown on the Trivia page and the Profile page (for quick demo analytics).

If you want a tiny Python Flask auth backend for the login flow, I can add it as an optional feature.
