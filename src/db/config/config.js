require("dotenv").config();

const buildConfig = require("./index");

module.exports = {
  development: buildConfig("development"),
  test: buildConfig("test"),
  production: buildConfig("production"),
};
