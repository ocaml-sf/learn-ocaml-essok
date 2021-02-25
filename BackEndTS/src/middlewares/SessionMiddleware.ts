import session from "express-session";
import MongoStore from "connect-mongo";

import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Request, Response, NextFunction } from "express";
import { Service } from "typedi";

import db from "../DB";
import env from "../configEnv";

@Middleware({ type : "before" })
@Service()
export class SessionMiddleware implements ExpressMiddlewareInterface {
  use(req : Request, res : Response, next : NextFunction) : void {
    session({
      name : env.SERVER_SESSION_NAME,
      secret : env.SERVER_SESSION_SECRET,
      resave : false,
      saveUninitialized : false,
      store : new MongoStore({
        mongoUrl : db.uri,
      })
    })(req, res, next);
  }
}
