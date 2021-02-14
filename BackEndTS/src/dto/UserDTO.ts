import {
  IsAlphanumeric,
  IsDefined,
  IsEmail,
  IsString,
} from "class-validator";

class UserDTO {
  @IsDefined({
    groups: ["registration", "login"],
  })
  @IsEmail()
  email!: string;

  @IsDefined({
    groups: ["registration", "login"],
  })
  @IsString()
  password!: string;

  @IsDefined({
    groups: ["registration"],
  })
  @IsAlphanumeric()
  username!: string;
}

export default UserDTO;
