import express from "express";
import { UserController } from "../controller/user.controller.js";
import { CategoryController } from "../controller/category.controller.js";
import { ProductController } from "../controller/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { userPrefix, productPrefix, categoryPrefix } from "./prefix.route.js";

const privateRouter = express.Router();

// USER ROUTES
privateRouter.delete(userPrefix + "/current/logout", authMiddleware, UserController.logout);
privateRouter.delete(userPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.put(userPrefix + "/:userId", authMiddleware, UserController.update);
privateRouter.get(userPrefix + "/current", authMiddleware, UserController.get);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);

// CATEGORY ROUTES
privateRouter.delete(categoryPrefix + "/:categoryId", authMiddleware, CategoryController.delete);
privateRouter.put(categoryPrefix + "/:categoryId", authMiddleware, CategoryController.update);
privateRouter.post(categoryPrefix, authMiddleware, CategoryController.create);

// PRODUCT ROUTE
privateRouter.delete(productPrefix + "/:productId", authMiddleware, ProductController.delete);
privateRouter.put(productPrefix + "/:productId", authMiddleware, ProductController.update);
privateRouter.post(productPrefix, authMiddleware, ProductController.create);

export { privateRouter };
