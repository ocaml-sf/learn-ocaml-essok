const { colors } = require("mocha/lib/reporters/base");

colors.pass = 32;
colors.fast = 32;
colors.light = 0;

module.exports = {
    extension : ".spec.ts,.spec.js",
    recursive : true,
    reporter : "spec",
    require : "ts-node/register, dotenv/config",
    watch : true,
    watchFiles : "src/**/*.ts"
}
