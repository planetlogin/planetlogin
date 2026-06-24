import { json, type RequestHandler } from '@sveltejs/kit';
import { publicConfig } from '@planetlogin/core';
// GET /auth/config — the public white-label subset the front renders from.
export const GET: RequestHandler = async () => json(publicConfig());
