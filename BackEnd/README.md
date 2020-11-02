# ![Essok BackEnd](../FrontEnd/src/assets/essok-logo/logo_white.jpg)

# BackEnd

# Getting started

To get the Node server running locally:

- Clone this repo
- `npm install` to install all required dependencies
- `npm update` to update all required dependencies
- Install MongoDB Community Edition ([instructions](https://docs.mongodb.com/manual/installation/#tutorials)) and run it by executing `mongod`
- `npm run dev` to start the local server

# Code Overview

## Dependencies

- [@kubernetes/client-node](https://github.com/kubernetes-client/javascript) - A Kubernetes client for node
- [archiver](https://github.com/kubernetes-client/javascript) - A streaming interface for archive generation
- [body-parser](https://github.com/expressjs/body-parser) - Node.js body parsing middleware
- [cors](https://github.com/expressjs/cors) - Node.js CORS middleware
- [ejs](https://github.com/mde/ejs) - Embedded JavaScript templates
- [errorhandler](https://github.com/expressjs/errorhandler) - Development-only error handler middleware
- [express](https://github.com/expressjs/express) - The server for handling and routing HTTP requests
- [express-jwt](https://github.com/auth0/express-jwt) - Middleware for validating JWTs for authentication
- [formidable](https://github.com/node-formidable/formidable) - A node.js module for parsing form data, especially file uploads
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - It contains methods that aren't included in the vanilla Node.js fs package. Such as recursive mkdir, copy, and remove
- [gulp](https://gulpjs.com) - The streaming build system
- [helmet](https://helmetjs.github.io/) - Help secure Express/Connect apps with various HTTP headers
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - For generating JWTs used by authentication
- [mongoose](https://github.com/Automattic/mongoose) - For modeling and mapping MongoDB data to javascript 
- [mongoose-unique-validator](https://github.com/blakehaswell/mongoose-unique-validator) - For handling unique validation errors in Mongoose. Mongoose only handles validation at the document level, so a unique index across a collection will throw an exception at the driver level. The `mongoose-unique-validator` plugin helps us by formatting the error like a normal mongoose `ValidationError`.
- [morgan](https://github.com/expressjs/morgan) - HTTP request logger middleware for node.js
- [passport](https://github.com/jaredhanson/passport) - For handling user authentication
- [pkgcloud](https://github.com/pkgcloud/pkgcloud) - A provider agnostic cloud library for Node.js
- [rimraf](https://github.com/isaacs/rimraf) - A deep deletion module for node (like `rm -rf`)
- [slug](https://github.com/dodo/node-slug) - For encoding titles into a URL-friendly format

## Application Structure

- `app.js` - The entry point to our application. This file defines our express server and connects it to MongoDB using mongoose. It also requires the routes and models we'll be using in the application.
- `clients/` - This folder contains the clients for some external API such as swift.
- `configs/` - This folder contains configuration for passport as well as a central location for configuration/environment variables.
- `libs/` - This folder contains librairies used for our BackEnd.
- `models/` - This folder contains the schema definitions for our Mongoose models.
- `routes/` - This folder contains the route definitions for our API.

## Error Handling

In `routes/api/index.js`, we define a error-handling middleware for handling Mongoose's `ValidationError`. This middleware will respond with a 422 status code and format the response to have [error messages the clients can understand]

## Authentication

Requests are authenticated using the `Authorization` header with a valid JWT. We define two express middlewares in `routes/auth.js` that can be used to authenticate requests. The `required` middleware configures the `express-jwt` middleware using our application's secret and will return a 401 status code if the request cannot be authenticated. The payload of the JWT can then be accessed from `req.payload` in the endpoint. The `optional` middleware configures the `express-jwt` in the same way as `required`, but will *not* return a 401 status code if the request cannot be authenticated.