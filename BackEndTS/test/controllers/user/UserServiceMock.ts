import { Service } from "typedi";

import UserInterface from "../../../src/controllers/user/UserInterface";
import UserDTO from "../../../src/dto/UserDTO";
import AlreadyExistError from "../../../src/errors/AlreadyExistError";

import { WILSON, WILLOW } from "./USERS";

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
      throw new AlreadyExistError("email");
    } else if(dto.username === WILSON.username) {
      throw new AlreadyExistError("username");
    }
    return Promise.resolve();
  }
}
