import { Session as SessionCookie } from "express-session";
import { promisify } from "util";
import {
  Body, Session,
  JsonController,
  Post, OnUndefined,
  BadRequestError,
} from "routing-controllers";
import { Inject, Service } from "typedi";

import { UserDTO } from "../dto/UserDTO";
import { UserInterface } from "../services";

type SessionUserData = SessionCookie & { username : string };

@JsonController()
@Service()
export class AuthController {
  constructor(@Inject("user") private userService : UserInterface) {}

  @Post("/login")
  @OnUndefined(204)
  async login(@Body({ validate : { groups : ["login"] } }) dto : UserDTO,
              @Session() session : SessionUserData) : Promise<void> {
    if(session !== undefined && session.username !== undefined) {
      throw new BadRequestError("Already logged.");
    } else {
      const user = await this.userService.fromLogin(dto.email, dto.password);
      if(user === null) {
        throw new BadRequestError("Incorrect email or password.");
      }
      session.username = user.username;
    }
  }

  // Promisifying session.destroy based on
  // https://github.com/expressjs/session/pull/737
  @Post("/logout")
  @OnUndefined(204)
  async logout(@Session() session : SessionUserData) : Promise<void> {
    if(session.username === undefined) {
      throw new BadRequestError("No user logged.");
    } else {
      await promisify(session.destroy.bind(session))();
    }
  }
}
