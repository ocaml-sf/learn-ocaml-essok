import assert from "assert";
import { Service } from "typedi";

import AlreadyExistError from "../../errors/AlreadyExistError";
import UserInterface from "../user/UserInterface";
import { UserModel } from "../../models/User";
import UserDTO from "../../dto/UserDTO";

@Service("user")
export class UserService implements UserInterface {
  readonly defaultProjection = {
    _id : 0,
  }

  async fromLogin(email : string, password : string) : Promise<UserDTO | null> {
    const user = await UserModel.findOne({ email }, {
      ...this.defaultProjection,
      username : 1,
      password : 1
    });
    if(user !== null && await user.comparePassword(password)) {
      return user.toObject();
    } else {
      return null;
    }
  }

  async fromUsername(username : string) : Promise<UserDTO | null> {
    const user = await UserModel.findOne({ username }, {
      ...this.defaultProjection,
      password : 0,
      __v : 0,
    });
    if(user === null) {
      return null;
    } else {
      return user.toObject();
    }
  }

  async makeFromDTO(dto : UserDTO) : Promise<void> {
    const user = await UserModel.findOne({
      $or : [{ email : dto.email }, { username : dto.username }],
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
