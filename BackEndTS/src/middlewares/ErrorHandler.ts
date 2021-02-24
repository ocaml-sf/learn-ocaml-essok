import { Request, Response, NextFunction } from "express";
import {
  BadRequestError, HttpError,
  Middleware,
  ExpressErrorMiddlewareInterface,
  InternalServerError,
} from "routing-controllers";
import { ValidationError } from "class-validator";
import { Service } from "typedi";
import AlreadyExistError from "../errors/AlreadyExistError";

type BadRequestValidationError =
  BadRequestError & { errors : ValidationError[] };

// Error handlers are managed by order of implementation

// TODO : change to ServiceError ?
@Middleware({ type : "after" })
@Service()
export class AlreadyExistErrorHandler
implements ExpressErrorMiddlewareInterface {
  error(error : AlreadyExistError, _request : Request,
        _response : Response, next : NextFunction) : void {
    if(error instanceof AlreadyExistError) {
      next(new BadRequestError(error.message));
    } else {
      next(error);
    }
  }
}

@Middleware({ type : "after" })
@Service()
export class ValidationErrorsHandler
implements ExpressErrorMiddlewareInterface {
  error(error : BadRequestValidationError ,_request : Request,
        response : Response, next : NextFunction) : void {
    if(error instanceof BadRequestError &&
      Array.isArray(error.errors) &&
      error.errors.every(err => err instanceof ValidationError)) {

      console.error("ValidationErrorsHandler :", {
        name : error.name,
        message : error.message,
        httpCode : error.httpCode,
      });
      console.error("errors :", error.errors);

      response.status(400).json({
        name : error.name,
        message : error.message,
        errors : error.errors,
      });
      next();
    } else {
      next(error);
    }
  }
}

@Middleware({ type : "after" })
@Service()
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error : HttpError, _request : Request,
        response : Response, next : NextFunction) : void {
    if(error instanceof HttpError) {
      console.error("HttpErrorHandler :", {
        name : error.name,
        message : error.message,
        httpCode : error.httpCode,
      });

      response.status(error.httpCode).json({
        name : error.name,
        message : error.message,
      });
      next();
    } else {
      next(error);
    }
  }
}

@Middleware({ type : "after" })
@Service()
export class UnexpectedErrorsHandler
implements ExpressErrorMiddlewareInterface {
  error(error : Error, _request : Request,
        response : Response, next : NextFunction) : void {
    console.error("Unexpected Error happens :", {
      name : error.name,
      message : error.message,
    });

    const internalError = new InternalServerError(
      "Unexpected error, please contact support to investigate.");

    response.status(internalError.httpCode).json({
      name : internalError.name,
      message : internalError.message,
    });

    next();
  }
}
