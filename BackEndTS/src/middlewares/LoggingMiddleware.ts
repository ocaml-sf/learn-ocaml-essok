import morgan from "morgan";

import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Request, Response, NextFunction } from "express";
import { Service } from "typedi";

import env from "../configEnv";

@Middleware({ type : "before" })
@Service()
export class LoggingMiddleware implements ExpressMiddlewareInterface {
  use(req : Request, res : Response, next : NextFunction) : void {
    morgan(env.SERVER_MORGAN_FORMAT)(req, res, next);
  }
}
