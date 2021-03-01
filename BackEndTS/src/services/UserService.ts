import assert from "assert";
import { Service } from "typedi";

import {
  EmailAlreadyExistError,
  UsernameAlreadyExistError,
  UsernameDoesNotExistError,
  UsernameIsAlreadyEnabledError,
  UsernameIsAlreadyDisabledError,
} from "../errors";
import { UserInterface } from "./UserInterface";
import { UserDTO } from "../dto";
import { UserModel } from "../models";

@Service("user")
export class UserService implements UserInterface {
  async fromLogin(email : string, password : string) : Promise<UserDTO | null> {
    const user = await UserModel.findOne({ email })
    if(user !== null && await user.comparePassword(password)) {
      return UserDTO.fromObj(user.toObject());
    } else {
      return null;
    }
  }

  async fromUsername(username : string) : Promise<UserDTO | null> {
    const user = await UserModel.findOne({ username });
    if(user === null) {
      return null;
    } else {
      return UserDTO.fromObj(user.toObject());
    }
  }

  async makeFromDTO(dto : UserDTO) : Promise<void> {
    const user = await UserModel.findOne({
      $or : [{ email : dto.email }, { username : dto.username }],
    });

    if(user !== null) {
      assert(user.email === dto.email || user.username === dto.username,
             "Unexpected user found with different email and username");

      if(dto.email === user.email) {
        throw new EmailAlreadyExistError(user.email);
      } else if(dto.username === user.username) {
        throw new UsernameAlreadyExistError(user.username);
      }
    }
    await UserModel.make(dto);
  }

  // TODO: should we fuse the next 2 functions to something like toggleStatus ?
  async enableFromUsername(username : string) : Promise<void> {
    const user = await UserModel.findOne({ username });
    if(user === null) {
      throw new UsernameDoesNotExistError(username);
    } else if(!user.isDisabled) {
      throw new UsernameIsAlreadyEnabledError(username);
    } else {
      await user.updateOne({ isDisabled : false })
    }
  }

  async disableFromUsername(username : string) : Promise<void> {
    const user = await UserModel.findOne({ username });
    if(user === null) {
      throw new UsernameDoesNotExistError(username);
    } else if(user.isDisabled) {
      throw new UsernameIsAlreadyDisabledError(username);
    } else {
      await user.updateOne({ isDisabled : true })
    }
  }

  async deleteFromUsername(username : string) : Promise<void> {
    const user = await UserModel.findOne({ username });
    if(user === null) {
      throw new UsernameDoesNotExistError(username);
    } else {
      await user.deleteOne();
    }
  }
}
