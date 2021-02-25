const { colors } = require("mocha/lib/reporters/base");

colors.pass = 32;
colors.fast = 32;
colors.light = 0;

module.exports = {
    recursive : true,
    reporter : "spec",
    require : "ts-node/register",
    watch : true,
    watchFiles : "src/**/*.ts"
}
