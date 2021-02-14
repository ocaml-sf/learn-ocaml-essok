import session from "express-session";
import connectMongo from "connect-mongo";

import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Request, Response, NextFunction } from "express";

import db from "../DB";
import env from "../configEnv";

const MongoStore = connectMongo(session);

@Middleware({ type : "before" })
export class SessionMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction) {
    session({
      name : env.SERVER_SESSION_NAME,
      secret: env.SERVER_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({
        url: db.uri,
      })
    })(req, res, next);
  }
}
