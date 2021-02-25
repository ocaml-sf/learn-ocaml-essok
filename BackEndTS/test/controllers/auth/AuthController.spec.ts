import "reflect-metadata";
import { Application } from "express";
import { Container } from "typedi";
import { Server as HttpServer } from "http";
import { createExpressServer, useContainer } from "routing-controllers";
import request from "supertest";

import { AuthController } from "../../../src/controllers/auth/AuthController";
import { UserServiceMock } from "../user/UserServiceMock";
import { WILSON } from "../user/USERS";

describe("AuthController", function() {
  let app : Application;
  let server : HttpServer;
  let cookie : string;

  before(function() {
    Container.set("user", new UserServiceMock());

    useContainer(Container);
    app = createExpressServer({
      defaultErrorHandler : false,
      controllers : [AuthController],
      middlewares : [__dirname + "/../../middlewares/**/*.{j,t}s"],
      validation : {
        skipMissingProperties : true,
        whitelist : true,
        forbidNonWhitelisted : true,
        validationError : { target : false, value : false },
      },
    }) as Application;
    server = app.listen("3001");
  })

  describe("POST /login", function() {
    interface ResponseHeaders {
      "content-type" : string;
      [key : string] : string;
    }

    it("should log with correct email and password", function(done) {

      request(app)
        .post("/login").send({
          email : WILSON.email,
          password : WILSON.password,
        })
        .expect("set-cookie", /session/)
        .expect(204)
        .then(res => {
          const headers = res.headers as ResponseHeaders;
          cookie = headers["set-cookie"];
        })
        .then(done)
        .catch(done);
    });

    it("should fail when a session already exist", function(done) {
      request(app)
        .post("/login").send({
          email : WILSON.email,
          password : WILSON.password,
        })
        .set("Cookie", cookie)
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    // TODO: should we fuse the next 3 tests ? if yes, how ?
    it("should fail when neither email nor password is provided",
       function(done) {
      request(app)
        .post("/login")
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when email is not provided...", function(done) {
      request(app)
        .post("/login").send({ password : WILSON.password })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when password is not provided", function(done) {
      request(app)
        .post("/login").send({ email : WILSON.email })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when unexpected data is provided", function(done) {
      // Let's send username for example
      request(app)
        .post("/login").send(WILSON)
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    // Question: should we migrate theses tests as integration tests?
    //           or database unit tests ?
    it("should fail when email is incorrect", function(done) {
      request(app)
        .post("/login").send({
          email : "willow@lighter.com",
          password : "lighter",
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when password is incorrect", function(done) {
      request(app)
        .post("/login").send({
          email : "wilson@beard.com",
          password : "lighter",
        })
        .expect(400)
        .then(_res => done())
        .catch(done);
    });
  });

  describe("POST /logout", function() {
    it("should log out connected user", function(done) {
      request(app)
        .post("/logout").set("Cookie", cookie)
        .expect(204)
        .then(_res => done())
        .catch(done);
    });

    it("should fail when no user is connected", function(done) {
      request(app)
        .post("/logout")
        .expect(400)
        .then(_res => done())
        .catch(done);
    });
  });

  after(function() {
    server.close();
  });
});
