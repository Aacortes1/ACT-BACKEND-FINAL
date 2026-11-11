import type { AccessTokenSubject } from "./auth.js";

declare global {
  namespace Express {
    interface Locals {
      auth?: AccessTokenSubject;
      requestId?: string;
    }
  }
}

export {};
