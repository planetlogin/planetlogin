import { json, type RequestHandler } from '@sveltejs/kit';
import { publicConfig } from '@planetlogin/core';
// GET /auth/config — the public white-label subset the front renders from.
export const GET: RequestHandler = async ({ locals }) => json(publicConfig(locals.tenant.config));
