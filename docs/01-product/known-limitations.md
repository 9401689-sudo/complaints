# Known Limitations

- Frontend is a single large `app.js` file with high coupling between state/render/actions.
- API error model is mostly message-string based; brittle for future i18n and stable client handling.
- FSM model has historical overlap (`fsm.types/config` vs active runtime behavior), requiring care in refactors.
- Nested duplicate folders can confuse contributors about true edit target.
- Operational dependency on Nextcloud and reverse-proxy correctness is high.
- No committed comprehensive automated integration/e2e test suite in current tree.
