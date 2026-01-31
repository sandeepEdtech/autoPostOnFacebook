"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
require("./jobs/autoPost.job");
const env_1 = require("./config/env");
app_1.app.listen(env_1.env.PORT, () => {
    console.log(`🚀 Server running on port ${env_1.env.PORT}`);
});
