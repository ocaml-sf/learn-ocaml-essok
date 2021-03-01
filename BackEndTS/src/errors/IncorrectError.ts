import { ServiceError } from "./ServiceError";

export class IncorrectError extends ServiceError {
  constructor(fields : string) {
    super(`Invalid ${fields}`);
  }
}

export class IncorrectEmailOrPasswordError extends ServiceError {
  constructor() {
    super("email or password");
  }
}
