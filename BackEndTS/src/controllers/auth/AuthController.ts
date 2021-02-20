import { promisify } from "util";
import {
  Body, Session,
  JsonController,
  Post, OnUndefined,
  BadRequestError, InternalServerError,
} from "routing-controllers";
import { Inject, Service } from "typedi";

import UserInterface from "../user/UserInterface";
import UserDTO from "../../dto/UserDTO";

@JsonController()
@Service()
export class AuthController {
  constructor(@Inject("user") private userService : UserInterface) {}

  @Post("/login")
  @OnUndefined(204)
  async login(@Body({ validate : { groups: ["login"] } }) dto : UserDTO,
              @Session() session: any) : Promise<void> {
    if(session !== undefined && session.username !== undefined) {
      throw new BadRequestError("Already logged");
    }

    const user = await this.userService.fromDTO(dto);
    if(user === null) {
      throw new BadRequestError("Incorrect email or password");
    }
    session.username = user.username;
  }

  // Promisifying session.destroy based on
  // https://github.com/expressjs/session/pull/737
  @Post("/logout")
  @OnUndefined(204)
  async logout(@Session() session: any) : Promise<void> {
    if(session.username === undefined) {
      throw new BadRequestError("User is not logged");
    } else {
      await promisify(session.destroy.bind(session))()
        .catch((err : Error) => {
          console.error(`logout: ${err}`);
          throw new InternalServerError("Logout");
        });
    }
  }
}
