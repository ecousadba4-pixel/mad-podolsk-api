# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

Integration with backend
------------------------

By default the frontend sends requests to the production backend at `https://mad-podolsk-karinausadba.amvera.io`, regardless of which domain serves the SPA. If you need to hit another host (e.g. local backend while the UI is served from a different domain), control the base URL via the environment variable `VITE_API_BASE`. A default `.env` is provided in the `frontend/` folder with `VITE_API_BASE` set to the live backend host. To override it locally (for development) export the variable before running `npm run dev`:

```bash
# run dev against local backend
export VITE_API_BASE="http://localhost:8000"
npm run dev
```

All frontend API calls use the `/api/dashboard/...` paths and rely on the backend routes implemented in `app/backend`.

If the backend is already deployed and `DB_DSN` is configured in the backend environment, the frontend will show live numbers from that backend host.
