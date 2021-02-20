import { Service } from "typedi";

import UserInterface from "../../../src/controllers/user/UserInterface";
import UserDTO from "../../../src/dto/UserDTO";

@Service()
export class UserServiceMock implements UserInterface {
  async fromDTO(dto : UserDTO) {
    const user = {
      username: "wilson",
      password: "beard",
      email: "wilson@beard.com",
    }

    if(dto.email === user.email && dto.password === user.password) {
      return user;
    } else {
      return null;
    }
  }
}
