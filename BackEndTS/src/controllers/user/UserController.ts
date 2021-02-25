import {
  JsonController,
  Get, Post,
  OnUndefined,
  Body, SessionParam,
  BadRequestError,
} from "routing-controllers";
import { Inject, Service } from "typedi";

import UserDTO from "../../dto/UserDTO";
import UserInterface from "./UserInterface";

@JsonController("/user")
@Service()
export class UserController {
  constructor(@Inject("user") private userService : UserInterface) {}

  @Post("/register")
  @OnUndefined(204)
  async register(
    @Body({ validate : { groups : ["registration"] } }) user : UserDTO
  ) : Promise<void> {
    await this.userService.makeFromDTO(user);
  }

  @Get("/profile")
  async get(@SessionParam("username", { required : true }) username : string)  {
    const user = await this.userService.fromUsername(username);
    if(user === null) {
      throw new BadRequestError("Invalid User");
    } else {
      return user;
    }
  }
}
