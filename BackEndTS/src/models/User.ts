import {
  pre,
  prop,
  getModelForClass,
  DocumentType,
  ReturnModelType
} from "@typegoose/typegoose";
import bcrypt from "bcrypt";

import { UserDTO } from "../dto/UserDTO";

// TODO: check if we should put this constant as env variable
const saltRounds = 10;

/**
 * General Email RegExp conform to RFC 5322 standart
 * https://emailregex.com/
 */
const regExpEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * User model
 * To create a user:
 *  - email, username and password are required
 *  - description, place and goal are optional
 */

// Password Hashing based on MongoDB's post
// https://www.mongodb.com/blog/post/
// password-authentication-with-mongoose-part-1
@pre<User>("save", async function() {
  // only hash the password if it has been modified (or is new)
  if(!this.isModified("password")) return;

  // auto-generate a salt and hash the password
  await bcrypt.hash(this.password, saltRounds)
    .then(hash => {
      this.password = hash;
    });
})

export class User {
  @prop({
    lowercase : true,
    match : /[a-z A-Z 0-9]+/,
    required : true,
    index : true,
    unique : true,
  })
  username! : string;

  @prop({
    lowercase : true,
    match : regExpEmail,
    required : true,
    unique : true,
    index : true,
  })
  email! : string;

  @prop({
    required : true,
  })
  password! : string;


  @prop()
  description? : string;

  @prop()
  place? : string;

  @prop()
  goal? : string;

  // An account can be disabled by the user
  // A disabled account can not create or launch servers until actived back
  @prop({
    default : false,
  })
  isDisabled! : boolean;

  /**
   * Account Status, there is actually 3 roles possible:
   * - user
   * - teacher
   * - admin
   */
  @prop({
    enum : ["User", "Teacher", "Admin"],
    default : "User",
  })
  role! : string;

  public async comparePassword(this : DocumentType<User>, password : string)
  : Promise<boolean> {
    return await bcrypt.compare(password, this.password)
  }

  public static async make(this : ReturnModelType<typeof User>,
                           doc : UserDTO)
  : Promise<void> {
    const user = new this(doc);
    await user.save();
  }
}

export const UserModel = getModelForClass(User);
