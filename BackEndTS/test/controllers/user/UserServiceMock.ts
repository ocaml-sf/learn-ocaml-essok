import { Service } from "typedi";

import UserInterface from "../../../src/controllers/user/UserInterface";
import UserDTO from "../../../src/dto/UserDTO";
import AlreadyExistError from "../../../src/errors/AlreadyExistError";

@Service()
export class UserServiceMock implements UserInterface {
  readonly user = {
    username: "wilson",
    password: "beard",
    email: "wilson@beard.com",
  }

  fromDTO(dto : UserDTO) : Promise<UserDTO | null> {
    if(dto.email === this.user.email && dto.password === this.user.password) {
      return Promise.resolve(this.user);
    } else {
      return Promise.resolve(null);
    }
  }

  makeFromDTO(dto: UserDTO) : Promise<void> {
    if(dto.email === this.user.email) {
      throw new AlreadyExistError("email");
    } else if(dto.username === this.user.username) {
      throw new AlreadyExistError("username");
    }
    return Promise.resolve();
  }
}
