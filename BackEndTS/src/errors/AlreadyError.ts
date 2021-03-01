import { ServiceError } from "./ServiceError";

export class AlreadyExistError extends ServiceError {
  constructor(field : string, value : string) {
    super(`User with ${field} "${value}" already exist`);
  }
}

export class EmailAlreadyExistError extends AlreadyExistError {
  constructor(value : string) {
    super("email", value);
  }
}

export class UsernameAlreadyExistError extends AlreadyExistError {
  constructor(value : string) {
    super("username", value);
  }
}



export class AlreadyLoggedError extends ServiceError {
  constructor() {
    super("User is already logged.");
  }
}



export class IsAlreadyError extends ServiceError {
  constructor(field : string, value : string, status : "enabled" | "disabled") {
    super(`User with ${field} "${value}" is already ${status}`);
  }
}

export class UsernameIsAlreadyEnabledError extends IsAlreadyError {
  constructor(value : string) {
    super("username", value, "enabled");
  }
}

export class UsernameIsAlreadyDisabledError extends IsAlreadyError {
  constructor(value : string) {
    super("username", value, "disabled");
  }
}
