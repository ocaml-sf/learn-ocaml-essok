import "reflect-metadata";
import { Application } from "express";
import { Container } from "typedi";
import { Server as HttpServer } from "http";
import { createExpressServer, useContainer } from "routing-controllers";
import request from "supertest";

import { UserServiceMock } from "./UserServiceMock";
import { WILSON, WILLOW } from "../USERS";
import { SessionMiddleware } from "../SessionMiddleware";
import { AuthController, UserController } from "../../../src/controllers";
import * as errorHandlers from "../../../src/middlewares/ErrorHandler";

describe("UserController /user", function() {
  let app : Application;
  let server : HttpServer;
  let cookie : string;

  before(function () {
    Container.set("user", new UserServiceMock());

    useContainer(Container);
    app = createExpressServer({
      defaultErrorHandler : false,
      controllers : [AuthController, UserController],
      middlewares : [...Object.values(errorHandlers), SessionMiddleware],
      validation : {
        skipMissingProperties : true,
        whitelist : true,
        forbidNonWhitelisted : true,
        validationError : { value : false },
      },
    }) as Application;
    server = app.listen("3001");
  });

  describe("POST /register", function() {
    it("should register new user data", function(done) {
      request(app)
        .post("/user/register").send(WILLOW)
        .expect(204)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when email is not provided", function(done) {
      request(app)
        .post("/user/register").send({
          ...WILLOW,
          email : undefined,
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when password is not provided", function(done) {
      request(app)
        .post("/user/register").send({
          ...WILLOW,
          password : undefined,
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when username is not provided", function(done) {
      request(app)
        .post("/user/register").send({
          ...WILLOW,
          username : undefined,
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });
  });

  describe("POST /profile", function() {
    interface ResponseHeaders {
      "content-type" : string;
      [key : string] : string;
    }

    before(function(done) {
      request(app)
        .post("/login").send({
          ...WILSON,
          username : undefined,
        })
        .expect("set-cookie", /session/)
        .expect(204)
        .then(res => {
          const headers = res.headers as ResponseHeaders;
          cookie = headers["set-cookie"];
        })
        .then(_res => done())
        .catch(done);
    });

    it("should return the user data if user is logged", function(done) {
      request(app)
        .get("/user/profile").set("Cookie", cookie)
        .expect(200, WILSON)
        .then(_res => done())
        .catch(done);
    });

    it("should fail if user is not logged", function(done) {
      request(app)
        .get("/user/profile")
        .expect(401)
        .then(_res => done())
        .catch(done);
    });
  });

  after(function() {
    server.close();
  });
});
