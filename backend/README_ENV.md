# Environment & Secrets (backend) 🔒

This project reads configuration from a `.env` file in the `backend/` folder.

Important steps to follow when a secret is leaked or when setting up locally:

- **Rotate compromised keys immediately:** If any key (e.g. `GEMINI_API_KEY`) is compromised, revoke it in the Google Cloud Console and create a new key.
- **Do not commit `.env` to Git:** An example file, `.env.example`, is provided. Copy it to `.env` and fill in your real keys locally.
- **Remove leaked secrets from the repository history:** Deleting `.env` and committing the removal prevents future commits from re-introducing it, but the key may still be in the git history. Use tools like `bfg` or `git filter-repo` to purge secrets from history. Example: `bfg --delete-files .env` followed by `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.
- **Restart the backend after updating `.env`:** `cd backend && npm start` or in dev mode: `npm run dev`.
- **Check that the key is loaded:** The backend logs an appropriate error message if `GEMINI_API_KEY` is missing or invalid.

If you want, I can walk you through revoking and reissuing the key in the Google Cloud Console and scrub the repo history for the leaked secret (requires GPG credentials and care because rewriting history affects collaborators).
