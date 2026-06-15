import { json } from './lib/google.mjs';

// Photos are private — guests upload to the couple's Google Photos album only.
// This endpoint is intentionally empty; gallery display is not used.
export default async () => json(200, { photos: [] });
