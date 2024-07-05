import express from "express";
import { HelloController } from "../controller/hello.controller.js";

const publicRouter = express.Router();
const authPrefix = "/api/auth";

publicRouter.get("/", HelloController.sayHello);

export { publicRouter };
