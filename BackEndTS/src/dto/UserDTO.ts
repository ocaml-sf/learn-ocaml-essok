import { plainToClass } from "class-transformer";
import {
  IsAlphanumeric,
  IsDefined,
  IsEmail,
  IsString,
  validateOrReject,
} from "class-validator";

export class UserDTO {
  @IsDefined({ groups : [ "login", "registration", "response" ] })
  @IsEmail(undefined, { always : true })
  email! : string;

  @IsDefined({ groups : [ "login", "registration" ] })
  @IsString({ groups : [ "login", "registration" ] })
  password! : string;

  @IsDefined({ groups : [ "registration", "response" ] })
  @IsAlphanumeric(undefined, { always : true })
  username! : string;

  @IsString({ always : true })
  description? : string;

  @IsString({ always : true })
  place? : string;

  @IsString({ always : true })
  goal? : string;

  // TODO : find a way to annotate result of function with a type "Self" ?
  public static async fromObj(obj : Object) {
    const dto = plainToClass(this, obj);
    await validateOrReject(dto, {
      groups : ["response"],
      skipMissingProperties : true,
      whitelist : true,
    }).catch(console.error);
    return dto;
  }
}

