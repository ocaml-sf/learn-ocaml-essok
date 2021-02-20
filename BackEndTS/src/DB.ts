import mongoose from "mongoose";

import { MongoError } from "mongodb";

import env from "./configEnv";

class DB {
  public uri : string;
  public mongoose : Promise<typeof mongoose>;

  constructor() {
    this.uri = `mongodb://${env.DB_HOSTNAME}:${env.DB_PORT}/${env.DB_NAME}`;
    this.mongoose = mongoose.connect(this.uri, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology : true,
    });

    console.log("Connecting to Database...");
    this.mongoose.then(mongoose => {
      console.log("DB is ready");
      return mongoose;
    }).catch((err : MongoError) => {
      console.error("Can not connect to MongoDB");
      console.error(err.name, ':', err.message);
    });

    mongoose.set("debug", env.DB_DEBUG);
  }
}

// Double export due to ambiguous syntax
// https://github.com/Microsoft/TypeScript/issues/18737
export const db = new DB();
export default db;
