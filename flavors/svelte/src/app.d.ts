import type { Tenant } from '@planetlogin/core';

// The portal resolved for this request's host (single-tenant → the env config).
// Set once in hooks.server.ts; every route reads its config/downstream from here.
declare global {
  namespace App {
    interface Locals {
      tenant: Tenant;
    }
  }
}

export {};
