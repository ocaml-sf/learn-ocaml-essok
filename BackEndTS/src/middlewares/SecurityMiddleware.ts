import helmet from "helmet";

import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Request, Response, NextFunction } from "express";

import env from "../configEnv";

@Middleware({ type : "before" })
export class SecurityMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction) {
    if(env.isProd) {
      helmet()(req, res, next);
    } else {
      next();
    }
  }
}
