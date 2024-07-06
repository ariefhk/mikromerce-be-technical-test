import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";
import { ProductController } from "../controller/product.controller.js";
import { authPrefix, productPrefix, categoryPrefix } from "./prefix.route.js";
import { CategoryController } from "../controller/category.controller.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/", HelloController.sayHello);

// AUTH ROUTE
publicRouter.post(authPrefix + "/login", UserController.login);
publicRouter.post(authPrefix + "/register", UserController.register);

// CATEGORY ROUTE
publicRouter.get(categoryPrefix, CategoryController.getAll);

// PRODUCT ROUTE
publicRouter.get(productPrefix + "/:productId", ProductController.get);
publicRouter.get(productPrefix, ProductController.getAll);

export { publicRouter };
