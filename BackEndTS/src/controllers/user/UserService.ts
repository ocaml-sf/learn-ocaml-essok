import { Service } from "typedi";

import UserInterface from "../user/UserInterface";
import { UserModel } from "../../models/User";
import UserDTO from "../../dto/UserDTO";

@Service("user")
export class UserService implements UserInterface {
  async fromDTO(dto : UserDTO) {
    const user = await UserModel.findOne({ email: dto.email });
    if(user !== null && user.comparePassword(dto.password)) {
      return user;
    } else {
      return null;
    }
  }
}
