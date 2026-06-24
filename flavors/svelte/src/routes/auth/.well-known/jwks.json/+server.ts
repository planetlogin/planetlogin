import { json, type RequestHandler } from '@sveltejs/kit';
import { jwks } from '@planetlogin/core';
// GET /auth/.well-known/jwks.json — public keys to verify issued session tokens.
export const GET: RequestHandler = async () => json(await jwks());
