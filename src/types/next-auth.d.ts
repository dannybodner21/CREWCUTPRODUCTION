import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `auth`, contains information about the active session.
   */
  interface Session {
    user: {
      avatar?: string;
      firstName?: string;
    } & DefaultSession['user'];
  }
  interface User {
    avatar?: string;
    providerAccountId?: string;
  }
  /**
   * More types can be extends here
   * ref: https://authjs.dev/getting-started/typescript
   */
}

declare module '@auth/core/jwt' {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    avatar?: string;
    userId: string;
  }
}
