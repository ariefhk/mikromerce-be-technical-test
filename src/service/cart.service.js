import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";
import { ProductService } from "./product.service.js";

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

  static async checkCartMustBeExistByProductIdAndUserId(productId, userId) {
    if (!productId || !userId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Product Id or User Id Not Inputed!");
    }

    const existedCart = await db.cart.findFirst({
      where: {
        product_id: productId,
        user_id: userId,
      },
    });

    if (!existedCart) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Cart not found!");
    }

    return existedCart;
  }

  static async createCart(request) {
    const { userId, productId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedProduct = await ProductService.checkProductMustBeExistById(productId);
    const existedCart = await db.cart.findFirst({
      where: {
        product_id: existedProduct.id,
        user_id: userId,
      },
    });

    if (existedCart) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Product already in cart!");
    }

    const createCart = await db.cart.create({
      data: {
        product_id: existedProduct.id,
        user_id: userId,
      },
      select: {
        id: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            description: true,
          },
        },
      },
    });

    return createCart;
  }

  static async getUserCart(request) {
    const { name, userId, loggedUserRole, isAdmin } = request;
    const filter = {};

    if (!isAdmin) {
      await UserService.checkUserMustBeExistById(userId);
      checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);
      filter.AND = [
        {
          user_id: userId,
        },
      ];
    } else {
      checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
      filter.AND = [];
    }

    if (name) {
      filter.AND.push({
        product: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
    }

    const carts = await db.cart.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            description: true,
          },
        },
      },
    });

    return carts;
  }

  static async deleteCart(request) {
    const { cartId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedCart = await CartService.checkCartMustBeExistById(cartId);

    await db.cart.delete({
      where: {
        id: existedCart.id,
      },
    });

    return true;
  }
}
