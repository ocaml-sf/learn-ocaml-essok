import "reflect-metadata";
import { Application } from "express";
import { Container } from "typedi";
import { Server as HttpServer } from "http";
import { createExpressServer, useContainer } from "routing-controllers";
import request from "supertest";

import { AuthController } from "../../../src/controllers/auth/AuthController";
import { UserController } from "../../../src/controllers/user/UserController";
import { UserServiceMock } from "./UserServiceMock";
import { WILSON, WILLOW } from "./USERS";

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
      middlewares : [__dirname + "/../../middlewares/**/*.{j,t}s"],
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

    // Question: should we migrate theses tests as integration tests?
    //           or database unit tests ?
    it("should fail when email is already taken", function(done) {
      request(app)
        .post("/user/register").send({
          ...WILLOW,
          email : WILSON.email,
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when username is already taken", function(done) {
      request(app)
        .post("/user/register").send({
          ...WILLOW,
          username : WILSON.username,
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
