import { promisify } from "util";
import {
  Body,
  InternalServerError,
  JsonController,
  OnUndefined,
  Post,
  Session,
  BadRequestError,
} from "routing-controllers";

import UserDTO from "../../dto/UserDTO";

import UserModel from "../../models/User";

@JsonController()
export class AuthController {
  @Post("/login")
  @OnUndefined(204)
  async login(@Body({ validate : { groups: ["login"] } }) dto : UserDTO,
              @Session() session: any) : Promise<void> {
    const user = await UserModel.findOne({ email: dto.email });
    if(user === null || !user.comparePassword(dto.password)) {
      throw new BadRequestError("Incorrect email or password");
    }
    session.username = user.username;
    console.log(`Hello ${session.username}`);
  }

  // Question: is it usefull to check if cookies are correctly setup ?
  // Promisifying session.destroy based on
  // https://github.com/expressjs/session/pull/737
  @Post("/logout")
  @OnUndefined(204)
  async logout(@Session() session: any) : Promise<void> {
    console.log(`Goodbye ${session.username}`);
    await promisify(session.destroy.bind(session))()
      .catch((err : Error) => {
        console.error(`logout: ${err}`);
        throw new InternalServerError("Logout");
      });
  }
}
