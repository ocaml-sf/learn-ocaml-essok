import { Service } from "typedi";

import { UserInterface } from "../../../src/services";
import { UserDTO } from "../../../src/dto";
import {
  EmailAlreadyExistError,
  UsernameAlreadyExistError,
  UsernameDoesNotExistError,
} from "../../../src/errors";

import { WILSON } from "../USERS";

@Service()
export class UserServiceMock implements UserInterface {
  fromLogin(email : string, password : string) : Promise<UserDTO | null> {
    if(email === WILSON.email && password === WILSON.password) {
      return Promise.resolve(WILSON);
    } else {
      return Promise.resolve(null);
    }
  }

  fromUsername(username : string) : Promise<UserDTO | null> {
    if(username == WILSON.username) {
      return Promise.resolve(WILSON);
    } else {
      return Promise.resolve(null);
    }
  }

  makeFromDTO(dto : UserDTO) : Promise<void> {
    if(dto.email === WILSON.email) {
      throw new EmailAlreadyExistError(dto.email);
    } else if(dto.username === WILSON.username) {
      throw new UsernameAlreadyExistError(dto.username);
    } else {
      return Promise.resolve();
    }
  }

  enableFromUsername(username: string): Promise<void> {
    if(username !== WILSON.username) {
      throw new UsernameDoesNotExistError(username);
    } else {
      return Promise.resolve();
    }
  }

  disableFromUsername(username: string): Promise<void> {
    if(username !== WILSON.username) {
      throw new UsernameDoesNotExistError(username);
    } else {
      return Promise.resolve();
    }
  }

  deleteFromUsername(username: string): Promise<void> {
    if(username !== WILSON.username) {
      throw new UsernameDoesNotExistError(username);
    } else {
      return Promise.resolve();
    }
  }
}
