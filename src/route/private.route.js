import express from "express";
import { UserController } from "../controller/user.controller.js";
import { CategoryController } from "../controller/category.controller.js";
import { ProductController } from "../controller/product.controller.js";
import { CartController } from "../controller/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { OrderController } from "../controller/order.controller.js";
import { userPrefix, productPrefix, categoryPrefix, authPrefix, cartPrefix, orderPrefix } from "./prefix.route.js";
import { imgUploader } from "../middleware/img-uploader.middleware.js";

const privateRouter = express.Router();

// AUTH ROUTES
privateRouter.delete(authPrefix + "/logout", authMiddleware, UserController.logout);

// USER ROUTES
privateRouter.delete(userPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.put(userPrefix + "/current", authMiddleware, imgUploader, UserController.updateCurrentUser);
privateRouter.put(userPrefix + "/:userId", authMiddleware, imgUploader, UserController.update);
privateRouter.get(userPrefix + "/current", authMiddleware, UserController.getCurrentUser);
privateRouter.get(userPrefix + "/:userId", authMiddleware, UserController.getUserById);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);

// CATEGORY ROUTES
privateRouter.delete(categoryPrefix + "/:categoryId", authMiddleware, CategoryController.delete);
privateRouter.put(categoryPrefix + "/:categoryId", authMiddleware, CategoryController.update);
privateRouter.post(categoryPrefix, authMiddleware, CategoryController.create);

// PRODUCT ROUTE
privateRouter.delete(productPrefix + "/:productId", authMiddleware, ProductController.delete);
privateRouter.put(productPrefix + "/:productId", authMiddleware, imgUploader, ProductController.update);
privateRouter.post(productPrefix, authMiddleware, imgUploader, ProductController.create);

// CART ROUTE
privateRouter.delete(cartPrefix + "/:cartId", authMiddleware, CartController.delete);
privateRouter.get(cartPrefix + "/current", authMiddleware, CartController.getCurrentUserCart);
privateRouter.post(cartPrefix, authMiddleware, CartController.create);
privateRouter.get(cartPrefix, authMiddleware, CartController.getUserCart);

// ORDER ROUTE
privateRouter.post(orderPrefix + "/:orderId/accept", authMiddleware, OrderController.acceptOrder);
privateRouter.post(orderPrefix + "/:orderId/cancel", authMiddleware, OrderController.cancelOrder);
privateRouter.post(orderPrefix, authMiddleware, imgUploader, OrderController.create);
privateRouter.get(orderPrefix + "/current", authMiddleware, OrderController.getUserOrder);
privateRouter.get(orderPrefix, authMiddleware, OrderController.getAllOrder);

export { privateRouter };
