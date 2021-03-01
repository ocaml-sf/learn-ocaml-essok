import mongoose from "mongoose";

import env from "./configEnv";

class DB {
  public uri : string;
  public mongoose : Promise<typeof mongoose>;

  constructor() {
    this.uri = `mongodb://${env.DB_HOSTNAME}:${env.DB_PORT}/${env.DB_NAME}`;
    mongoose.set("debug", env.DB_DEBUG);
    console.log("Connecting to Database...");
    this.mongoose = mongoose.connect(this.uri, {
      useCreateIndex : true,
      useNewUrlParser : true,
      useUnifiedTopology : true,
      serverSelectionTimeoutMS: 1000,
    }).then(mongoose => {
      console.log("DB is ready");
      return mongoose;
    }).catch((err : Error) => {
      console.error(`Can not connect to ${env.DB_HOSTNAME}:${env.DB_PORT}`);
      throw err;
    });
  }
}

// Double export due to ambiguous syntax
// https://github.com/Microsoft/TypeScript/issues/18737
export const db = new DB();
export default db;
