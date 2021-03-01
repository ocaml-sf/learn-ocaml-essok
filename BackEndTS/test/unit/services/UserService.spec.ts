import "reflect-metadata";
import assert from "assert";
import mongoose from "mongoose";
import { validateOrReject } from "class-validator";

import { WILSON, WILLOW, WOLFGANG } from "../USERS";
import {
  EmailAlreadyExistError,
  UsernameAlreadyExistError,
  UsernameDoesNotExistError,
  UsernameIsAlreadyEnabledError,
  UsernameIsAlreadyDisabledError,
} from "../../../src/errors";
import { UserService } from "../../../src/services";
import { UserModel } from "../../../src/models";

import env from "../../../src/configEnv";

describe("UserService", function() {
  let db : typeof mongoose;
  let userService : UserService;

  // A query could take more than 100ms
  this.slow(200);

  before(async function() {
    return await mongoose.connect(
      `mongodb://${env.DB_HOSTNAME}:${env.DB_PORT}/${env.DB_NAME}`, {
        useCreateIndex : true,
        useNewUrlParser : true,
        useUnifiedTopology : true,
        serverSelectionTimeoutMS: 1000,
      }).then(mongoose => {
        db = mongoose;
        mongoose.set("debug", env.DB_DEBUG);
        userService = new UserService();
        return UserModel.make(WILSON);
      }).catch(_err => {
        throw new Error(`Can not connect to ${env.DB_HOSTNAME}:${env.DB_PORT}`);
      });
  })

  describe("fromLogin(email, password)", function() {
    it("should return user when correct data is provided", async function() {
      return await userService.fromLogin(WILSON.email, WILSON.password)
        .then(user => {
          assert(user !== null);
          return validateOrReject(user, {
            groups : ["response"],
            skipMissingProperties : true,
            whitelist : true,
          });
        });
    });

    it("should return null when no user has email provided", async function() {
      return await userService.fromLogin(WILLOW.email, WILLOW.password)
        .then(user => assert(user === null));
    });

    it("should return null when password is invalid", async function() {
      return await userService.fromLogin(WILSON.email, WILLOW.password)
        .then(user => assert(user === null));
    });
  });

  describe("fromUsername(username)", function() {
    it("should return user found with username if it exist", async function() {
      return await userService.fromUsername(WILSON.username)
        .then(user => {
          assert(user !== null);
          return validateOrReject(user, {
            groups : ["response"],
            skipMissingProperties : true,
            whitelist : true,
          });
        });
    });

    it("should return null if no user has username provided", async function() {
      return await userService.fromUsername(WILLOW.username)
        .then(user => assert(user === null));
    });
  });

  describe("makeFromDTO(dto)", function() {
    it("should create a new user with correct data provided", async function() {
      return await userService.makeFromDTO({
        ...WILLOW,
      }).then(() => UserModel.findOne({
        email : WILLOW.email,
        username : WILLOW.username,
      })).then(user => assert(user !== null));
    });

    it("should throw error if email is already taken", async function() {
      return await assert.rejects(
        userService.makeFromDTO({
          ...WILLOW,
          email : WILSON.email,
        }),
        new EmailAlreadyExistError(WILSON.email)
      );
    });

    it("should throw error if username is already taken", async function() {
      return await assert.rejects(
        userService.makeFromDTO({
          ...WILLOW,
          username : WILSON.username,
        }),
        new UsernameAlreadyExistError(WILSON.username)
      );
    });

    afterEach(async function() {
      return await UserModel.deleteOne({
        $or : [{ email : WILLOW.email }, { username : WILLOW.username }],
      });
    });
  });

  describe("enableFromUsername(username)", function() {
    it("should enable a disabled user account", async function() {
      return await UserModel.updateOne({
        email : WILSON.email,
        username : WILSON.username,
      }, { isDisabled : true })
        .then(() => userService.enableFromUsername(WILSON.username))
        .then(() => UserModel.findOne({
          email : WILSON.email,
          username : WILSON.username,
        })).then(user => {
          assert(user !== null);
          assert(!user.isDisabled);
        });
    });

    it("should fail if no user has username provided", async function() {
      return await assert.rejects(
        userService.enableFromUsername(WILLOW.username),
        new UsernameDoesNotExistError(WILLOW.username)
      );
    });

    it("should fail if user account is already enabled", async function() {
      return await assert.rejects(
        UserModel.updateOne({
          email : WILSON.email,
          username : WILSON.username,
        }, { isDisabled : false })
          .then(() => userService.enableFromUsername(WILSON.username)),
        new UsernameIsAlreadyEnabledError(WILSON.username));
    });
  });

  describe("disableFromUsername(username)", function () {
    it("should disable user account", async function() {
      return await UserModel.updateOne({
        email : WILSON.email,
        username : WILSON.username,
      }, { isDisabled : false })
        .then(() => userService.disableFromUsername(WILSON.username))
        .then(() => UserModel.findOne({
          email : WILSON.email,
          username : WILSON.username,
        })).then(user => {
          assert(user !== null);
          assert(user.isDisabled);
        });
    });

    it("should fail if no user has username provided", async function() {
      return assert.rejects(
        userService.disableFromUsername(WILLOW.username),
        new UsernameDoesNotExistError(WILLOW.username)
      );
    });

    it("should fail if user is already disabled", async function() {
      return await assert.rejects(
        UserModel.updateOne({
          email : WILSON.email,
          username : WILSON.username,
        }, { isDisabled : true })
          .then(() => userService.disableFromUsername(WILSON.username)),
        new UsernameIsAlreadyDisabledError(WILSON.username));
    });
  });

  describe("deleteFromUsername", function() {
    it("should delete user from database", async function() {
      return await UserModel.make(WOLFGANG)
        .then(() => userService.deleteFromUsername(WOLFGANG.username))
        .then(() => UserModel.findOne({
          email : WOLFGANG.email,
          username : WOLFGANG.username,
        })).then(user => assert(user === null));
    });

    it("should fail if no user has username provided", async function() {
      return await assert.rejects(
        userService.deleteFromUsername(WILLOW.username),
        new UsernameDoesNotExistError(WILLOW.username)
      );
    });
  });

  after(async function() {
    return await UserModel.deleteMany({})
      .then(() => db.connection.close());
  });
});
