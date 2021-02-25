import {
  IsAlphanumeric,
  IsDefined,
  IsEmail,
  IsString,
} from "class-validator";

class UserDTO {
  @IsDefined({
    groups : ["registration", "login"],
  })
  @IsEmail()
  email! : string;

  @IsDefined({
    groups : ["registration", "login"],
  })
  @IsString()
  password! : string;

  @IsDefined({
    groups : ["registration", "update"],
  })
  @IsAlphanumeric()
  username! : string;

  @IsString()
  description? : string;
}

export default UserDTO;
