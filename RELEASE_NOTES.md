# Release Notes

## bedtime-trucks-app

### Version
Local verification page upgrade (Phase 1-3)

### Summary
This update turns `bedtime-trucks-app` from a mostly static demo page into a more complete local frontend verification console for the Bedtime Trucks backend.

---

## Highlights

### 1. End-to-end local verification flow works
- Frontend page can be started locally
- Browser can access the page over HTTP
- Frontend can call backend session creation API
- Story title and content can be displayed
- Returned audio can be loaded and played

### 2. CORS and response parsing issues resolved
- Local browser preflight issue for `OPTIONS /api/v1/sessions/create` was fixed on backend side
- Frontend response parsing was updated to support wrapped response payloads like `{ data: ... }`
- Frontend now also supports multiple fallback shapes such as `latestStory/latestAudio` and `stories[0]/audio[0]`

### 3. Frontend structure improved
- Split monolithic `index.html` into:
  - `index.html`
  - `styles.css`
  - `app.js`
- Improved maintainability without introducing a build step

### 4. Configurability improved
- Backend base URL can now be changed from the page
- Supports URL parameter and local saved value fallback

### 5. Debugging tools added
- Request URL
- Response status
- Request payload
- Parsed summary
- Raw response
- Health check output

### 6. Verification UX improved
- Local verification checklist added
- `/health` check button added
- Audio loading/playback state is now surfaced in UI
- Added copy story text / copy audio URL
- Added clear result / retry with same parameters

### 7. Final polish
- Chinese product-friendly labels added for form fields
- Payload compatibility preserved internally
- Added request cancellation with `AbortController`
- Added explicit “cancel current generation” action

---

## Files changed

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `LOCAL_VERIFICATION.md`
- `FINAL_SUMMARY.md`
- `RELEASE_NOTES.md`

---

## Recommended validation

1. Start backend on `http://127.0.0.1:3000`
2. Start frontend static server on `http://127.0.0.1:8000`
3. Open the page in browser
4. Run `/health` check
5. Submit one generation request
6. Verify:
   - story content renders
   - audio URL loads
   - audio can play
   - debug panel updates
   - checklist updates correctly

---

## Result

`bedtime-trucks-app` is now in a good state for:

- local integration testing
- backend verification
- demo usage
- lightweight troubleshooting
