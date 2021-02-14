import {
  Body,
  JsonController,
  OnUndefined,
  Post,
} from "routing-controllers";
import UserDTO from "../../dto/UserDTO";
import UserModel from "../../models/User";

@JsonController("/user")
export class UserController {
  @Post("/register")
  @OnUndefined(204)
  async register(@Body({ validate : { groups : ["registration"] } })
                 user : UserDTO) : Promise<void> {
    console.log("User:");
    console.log(user);
    await UserModel.make(user);
  }
}
