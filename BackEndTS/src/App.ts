import express from "express";
import helmet from "helmet";

import "reflect-metadata";
import {
  useExpressServer,
  RoutingControllersOptions,
} from "routing-controllers";

import env from "./configEnv";

class App {
  public app : express.Application;

  constructor() {
    this.app = express();

    let cors : RoutingControllersOptions["cors"] = false;
    if (env.isProd) {
      cors = {
        origin: env.SERVER_HOSTNAME,
      }
    }

    useExpressServer(this.app, {
      cors,
      routePrefix: "/api",
      defaultErrorHandler: false,
      controllers: [__dirname + "/controllers/**/*.{j,t}s"],
      middlewares: [__dirname + "/middlewares/**/*.{j,t}s"],
      validation: {
        validationError: { target : false },
        skipMissingProperties: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      },
    });
  }

  public listen() {
    this.app.listen(env.SERVER_PORT);
    console.log(`Listening on port ${env.SERVER_PORT}...`)
  }
}

// Double export due to ambiguous syntax
// https://github.com/Microsoft/TypeScript/issues/18737
export const app = new App();
export default app;
