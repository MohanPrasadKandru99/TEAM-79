# Backend environment & key rotation (quick guide)

If your backend logs show errors like "API key expired" or "API_KEY_INVALID" from the Generative Language API, follow these steps:

1. Rotate / renew the API key in Google Cloud Console
   - Open Google Cloud Console → APIs & Services → Credentials
   - Delete or restrict the compromised API key
   - Create a **new** API key (or appropriate credential) and copy it

2. Update your local `.env`
   - Copy `.env.example` to `.env` if you don't already have one
   - Replace `GEMINI_API_KEY` with the newly created key
     ```env
     GEMINI_API_KEY=YOUR_NEW_KEY_HERE
     ```

3. Restart the backend
   ```powershell
   cd backend
   npm start
   ```

4. Verify functionality
   - Send a quick test POST to `/api/generate` with a short text payload.
   - If you still see errors, check whether the key has API restrictions (IP/referrer), whether the Generative API is enabled in the project, and whether quotas/billing are configured.

Quota & rate-limits
- If you hit errors like "429 Too Many Requests" or messages mentioning "embed_content_free_tier_requests", your project is hitting free-tier quotas or rate limits.
- Steps to resolve:
   1. Ensure billing is enabled on the Google Cloud project (some free-tier quotas are zero unless billing is enabled).
   2. In Google Cloud Console → IAM & Admin → Quotas, find the Generative API (generativelanguage.googleapis.com) and request an increase for the relevant quota.
   3. Monitor usage at https://ai.dev/usage (see rate limit and quota usage tabs).
   4. Implement client-side backoff and request batching. The backend includes retry/backoff logic for transient 429s, but you can also reduce the number of embedding calls (e.g., summarize before embedding, use fewer chunks, cache embeddings).

5. Remove leaked secrets from repo history (optional but recommended)
   - Deleting `.env` from the repo prevents future commits, but the old key can remain in git history. Use `bfg` or `git filter-repo` to scrub if needed (coordinate with collaborators as this rewrites history).

If you'd like, I can help test a new key locally or guide you through the Google Cloud steps.
