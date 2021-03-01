import app from "./App";
import db from "./DB";

import env from "./configEnv";

console.log(`Currently running in ${env.NODE_ENV} environment`);

void db.mongoose
  .then(() => app.listen())
  .catch(_err => {
    process.exit(1);
  });
