import { ServiceError } from "./ServiceError";

export class DoesNotExistError extends ServiceError {
  constructor(field : string, value : string) {
    super(`No such user with ${field} "${value}" exist`);
  }
}

export class UsernameDoesNotExistError extends DoesNotExistError {
  constructor(value : string) {
    super("username", value);
  }
}
