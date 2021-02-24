import assert from "assert";
import { Service } from "typedi";

import AlreadyExistError from "../../errors/AlreadyExistError";
import UserInterface from "../user/UserInterface";
import { UserModel } from "../../models/User";
import UserDTO from "../../dto/UserDTO";

@Service("user")
export class UserService implements UserInterface {
  async fromDTO(dto : UserDTO) : Promise<UserDTO | null> {
    const user = await UserModel.findOne({ email: dto.email });
    if(user !== null && await user.comparePassword(dto.password)) {
      return user;
    } else {
      return null;
    }
  }

  async makeFromDTO(dto: UserDTO) : Promise<void> {
    const user = await UserModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });

    if(user !== null) {
      assert(user.email === dto.email || user.username === dto.username,
             "Unexpected user found with different email and username");

      if(user.email === user.email) {
        throw new AlreadyExistError("email");
      } else if(user.username === user.username) {
        throw new AlreadyExistError("username");
      }
    }
    await UserModel.make(dto);
  }
}
