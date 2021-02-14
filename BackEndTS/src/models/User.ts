import {
  pre,
  prop,
  getModelForClass,
  DocumentType,
  ReturnModelType
} from "@typegoose/typegoose";
import bcrypt from "bcrypt";

import UserDTO from "../dto/UserDTO";

// TODO: check if we should put this constant as env variable
const saltRounds = 10;

/**
 * General Email RegExp conform to RFC 5322 standart
 */
const regExpEmail : RegExp =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

/**
 * User model
 * To create a user:
 *  - email, username and password are required
 *  - description, place and goal are optional
 */

// Password Hashing based on MongoDB's post
// https://www.mongodb.com/blog/post/
// password-authentication-with-mongoose-part-1
@pre<User>("save", function() {
  // only hash the password if it has been modified (or is new)
  if(!this.isModified("password")) return;

  // auto-generate a salt and hash the password
  bcrypt.hash(this.password, saltRounds)
    .then(hash => {
      this.password = hash;
    });
})

class User {
  @prop({
    lowercase : true,
    match : /[a-z A-Z 0-9]+/,
    required : true,
    index : true,
    unique: true,
  })
  username! : string;

  @prop({
    lowercase: true,
    match: regExpEmail,
    required : true,
    unique : true,
    index: true,
  })
  email! : string;

  @prop({
    required : true,
  })
  password! : string;


  @prop()
  description? : string;

  @prop()
  place?: string;

  @prop()
  goal?: string;

  // An account can be disabled by the user
  // A disabled account can not create or launch servers until actived back
  @prop({
    default: false,
  })
  isActivated!: boolean;

  /**
   * Account Status, there is actually 3 roles possible:
   * - user
   * - teacher
   * - admin
   */
  @prop({
    enum: ["User", "Teacher", "Admin"],
    default: "User",
  })
  role!: string;

  public comparePassword(this: DocumentType<User>, password: string) {
    return bcrypt.compare(password, this.password)
  }

  public static async make(this : ReturnModelType<typeof User>,
                           doc: UserDTO) {
    const user = new this(doc);
    user.save();
  }
}

const UserModel = getModelForClass(User);

export default UserModel;
