import { Request, Response, NextFunction } from "express";
import {
  HttpError,
  Middleware,
  ExpressErrorMiddlewareInterface,
} from "routing-controllers";
import { ValidationError } from "class-validator";
import { Service } from "typedi";

@Middleware({ type: "after" })
@Service()
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  // Note that if errors is undefined,
  // it will not be sent as property to the client
  error(error: HttpError & { errors?: ValidationError[] },
        _request: Request, response: Response, next: NextFunction) {
    // Used to debug tests only
    /*
    if(error.errors) {
      console.error("errors:");
      console.error(error.errors);
    }
    console.error({
      name : error.name,
      message : error.message,
      httpCode: error.httpCode,
    });
    */

    response.status(error.httpCode).json({
      name: error.name,
      message: error.message,
      errors: error.errors,
    });
    next();
  }
}
