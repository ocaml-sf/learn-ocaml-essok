import {
  Body,
  JsonController,
  OnUndefined,
  Post,
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
  async register(@Body({ validate : { groups : ["registration"] } })
                 user : UserDTO) : Promise<void> {
    console.log("User:");
    console.log(user);
    await this.userService.makeFromDTO(user);
  }
}
