export class ServiceError extends Error {
  constructor(message : string) {
    super();
    this.name = "ServiceError";
    this.message = message;
  }
}
