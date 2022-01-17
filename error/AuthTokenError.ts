export class AuthTokenError extends Error {
  constructor() {
    super("Errorwith authentication token.");
  }
}