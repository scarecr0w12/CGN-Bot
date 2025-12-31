/* eslint node/exports-style: ["error", "exports"] */

// Load environment variables early - this file may be required before main app loads dotenv
require("dotenv").config();

// MariaDB is now the only supported database backend
// Delegate to DriverSQL
// eslint-disable-next-line node/exports-style
module.exports = require("./DriverSQL");
