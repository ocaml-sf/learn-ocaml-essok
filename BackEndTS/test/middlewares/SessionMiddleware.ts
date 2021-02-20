import session from "express-session";
import sessionFileStore from "session-file-store";

import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Request, Response, NextFunction } from "express";
import { Service } from "typedi";

const FileStore = sessionFileStore(session);

@Middleware({ type : "before" })
@Service()
export class SessionMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction) {
    session({
      name : "session",
      secret: "dst",
      resave: false,
      saveUninitialized: false,
      store: new FileStore(),
    })(req, res, next);
  }
}
