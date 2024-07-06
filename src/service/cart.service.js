import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class CartService {
  static async checkCartMustBeExistById(cartId) {
    if (!cartId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Cart Id Not Inputed!");
    }

    const existedCart = await db.cart.findUnique({
      where: {
        id: cartId,
      },
    });

    if (!existedCart) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Cart not found!");
    }

    return existedCart;
  }

  static async createCart(request) {
    const { userId, productId, quantity, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_USER, loggedUserRole);

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User Id must not missing!");
    }

    if (!productId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Product Id must not missing!");
    }

    if (!quantity) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Quantity must not missing!");
    }

    const countCart = await db.cart.count({
      where: {
        userId,
        productId,
      },
    });

    if (countCart !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Cart already exists!");
    }

    const createCart = await db.cart.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });

    return createCart;
  }

  static async updateCart(request) {
    const { userId, productId, quantity, cartId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_USER, loggedUserRole);

    const existedCart = await CartService.checkCartMustBeExistById(cartId);

    const updateCart = await db.cart.update({
      where: {
        id: cartId,
      },
      data: {
        userId,
        productId,
        quantity,
      },
    });

    return updateCart;
  }

  static async deleteCart(request) {
    const { cartId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_USER, loggedUserRole);

    const existedCart = await CartService.checkCartMustBeExistById(cartId);

    const deleteCart = await db.cart.delete({
      where: {
        id: cartId,
      },
    });

    return deleteCart;
  }

  static async getCart(request) {
    const { userId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_USER, loggedUserRole);
  }
}
