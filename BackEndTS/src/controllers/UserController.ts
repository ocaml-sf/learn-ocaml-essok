import {
  JsonController,
  Get, Post,
  OnUndefined,
  Body, SessionParam,
} from "routing-controllers";
import { Inject, Service } from "typedi";

import { UserDTO } from "../dto";
import { UsernameDoesNotExistError } from "../errors";
import { UserInterface } from "../services";

@JsonController("/user")
@Service()
export class UserController {
  constructor(@Inject("user") private userService : UserInterface) {}

  @Post("/register")
  @OnUndefined(204)
  async register(
    @Body({ validate : { groups : ["registration"] } }) dto : UserDTO
  ) : Promise<void> {
    return await this.userService.makeFromDTO(dto);
  }

  @Get("/profile")
  async profile(
    @SessionParam("username", { required : true }) username : string
  ) : Promise<UserDTO> {
    const user = await this.userService.fromUsername(username);
    if(user === null) {
      throw new UsernameDoesNotExistError(username);
    } else {
      return user;
    }
  }

  @Post("/enable")
  async enable(
    @SessionParam("username", { required : true }) username : string
  ) : Promise<void> {
    return await this.userService.enableFromUsername(username);
  }

  @Post("/disable")
  async disable(
    @SessionParam("username", { required : true }) username : string
  ) : Promise<void> {
    return await this.userService.disableFromUsername(username);
  }

  @Post("/delete")
  async delete(
    @SessionParam("username", { required : true }) username : string
  ) : Promise<void> {
    return await this.userService.deleteFromUsername(username);
  }
}
