import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { CartService } from "../service/cart.service.js";

export class CartController {
  static async create(req, res, next) {
    try {
      const createCartRequest = {
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
        loggedUserRole: req?.loggedUser?.role,
        productId: req.body.productId ? Number(req.body.productId) : null,
      };

      const result = await CartService.createCart(createCartRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create cart", result));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUserCart(req, res, next) {
    try {
      const getCurrentUserCartRequest = {
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
        name: req?.query?.name,
        loggedUserRole: req?.loggedUser?.role,
        isAdmin: req?.loggedUser?.role === "ADMIN",
      };

      const result = await CartService.getUserCart(getCurrentUserCartRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current user cart", result));
    } catch (error) {
      next(error);
    }
  }

  static async getUserCart(req, res, next) {
    try {
      const getUserCartRequest = {
        name: req?.query?.name,
        loggedUserRole: req?.loggedUser?.role,
        isAdmin: req?.loggedUser?.role === "ADMIN",
      };

      const result = await CartService.getUserCart(getUserCartRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get users cart", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteCartRequest = {
        cartId: req?.params?.cartId ? Number(req.params.cartId) : null,
        loggedUserRole: req?.loggedUser?.role,
      };

      await CartService.deleteCart(deleteCartRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete cart"));
    } catch (error) {
      next(error);
    }
  }
}
