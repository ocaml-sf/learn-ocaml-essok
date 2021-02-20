import "reflect-metadata";
import express from "express";
import { Container } from "typedi";
import {
  createExpressServer,
  useContainer,
  RoutingControllersOptions,
} from "routing-controllers";

import env from "./configEnv";

class App {
  public app : express.Application;

  constructor() {
    let cors : RoutingControllersOptions["cors"] = false;
    if (env.isProd) {
      cors = {
        origin: env.SERVER_HOSTNAME,
      }
    }

    useContainer(Container);

    this.app = createExpressServer({
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
