//////////////////////////////////////
// Session typing

declare module '@fastify/secure-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

export {};
