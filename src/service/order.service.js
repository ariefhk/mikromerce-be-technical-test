import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";
import { CloudinaryService } from "./cloudinary.service.js";
import { CLOUDINARY_FOLDER } from "../helper/cloudinary-storage.helper.js";

export class OrderService {
  static async checkOrderMustBeExistById(orderId) {
    if (!orderId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Order Id Not Inputed!");
    }

    const existedOrder = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!existedOrder) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Order not found!");
    }

    return existedOrder;
  }

  static async getAllOrder(request) {
    const { loggedUserRole, userId, status } = request;

    const filter = {};

    if (userId) {
      checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);
      const existedUser = await UserService.checkUserMustBeExistById(userId);
      filter.AND = [
        {
          user_id: existedUser.id,
        },
      ];
      switch (status) {
        case "process":
          filter.AND.push({
            status: {
              equals: "PENDING",
            },
          });
          break;
        case "accepted":
          filter.AND.push({
            status: {
              equals: "DONE",
            },
          });

          break;
        case "cancelled":
          filter.AND.push({
            status: {
              equals: "CANCELLED",
            },
          });

          break;
        case "done":
          filter.AND.push({
            status: {
              not: "PENDING",
            },
          });

          break;
        default:
          filter.AND.push({
            status: {
              in: ["PENDING", "CANCELLED", "DONE"],
            },
          });
          break;
      }
    } else {
      checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
      switch (status) {
        case "process":
          filter.status = {
            equals: "PENDING",
          };
          break;
        case "accepted":
          filter.status = {
            equals: "DONE",
          };
          break;
        case "cancelled":
          filter.status = {
            equals: "CANCELLED",
          };
          break;
        case "done":
          filter.status = {
            not: "PENDING",
          };
          break;
        default:
          filter.status = {
            in: ["PENDING", "CANCELLED", "DONE"],
          };
          break;
      }
    }

    const existedAllOrder = await db.order.findMany({
      where: filter,
      select: {
        id: true,
        order_date: true,
        status: true,
        proof_of_payment: true,
        total_price: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
          },
        },
        order_product: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                stock: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return existedAllOrder;
  }

  static async createOrder(request) {
    const { userId, proof_of_payment, requestedProducts, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedUser = await UserService.checkUserMustBeExistById(userId);

    if (!requestedProducts || requestedProducts?.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Products must not empty to order!");
    }

    if (!proof_of_payment) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Proof of payment must not empty!");
    }

    const proofOfPaymentUrl = await CloudinaryService.uploadImage(proof_of_payment, CLOUDINARY_FOLDER.TRANSACTION);

    const requestedProductIds = requestedProducts.map((product) => product.id);

    const existedProductInCarts = await db.cart.findMany({
      where: {
        user_id: userId,
        product_id: {
          in: requestedProductIds,
        },
      },
      include: {
        product: true,
      },
    });

    if (existedProductInCarts.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Products not found in cart!");
    }

    const existedProductIds = existedProductInCarts.map((cart) => cart.product.id);

    if (existedProductIds.length !== requestedProductIds.length) {
      const notFoundProductIds = requestedProductIds.filter((productId) => !existedProductIds.includes(productId));

      throw new APIError(API_STATUS_CODE.NOT_FOUND, `Products not found for IDs: ${notFoundProductIds.join(", ")}`);
    }

    const insufficientProductStock = existedProductInCarts.filter((cart) => {
      const requestedProduct = requestedProducts.find((r) => r.id === cart.product.id);

      return cart.product.stock < requestedProduct.quantity;
    });

    if (insufficientProductStock.length > 0) {
      const insufficientProductStockDetails = insufficientProductStock.map((cart) => ({
        id: cart?.product?.id,
        name: cart?.product?.name,
      }));
      const insufficientProductStockMessage = insufficientProductStockDetails.map((p) => `${p.name} (ID: ${p.id})`).join(", ");
      throw new APIError(
        API_STATUS_CODE.BAD_REQUEST,
        `Insufficient stock for requestedProducts: ${insufficientProductStockMessage}`
      );
    }

    const total_price = existedProductInCarts.reduce((acc, cart) => {
      const quantity = requestedProducts.find((p) => p.id === cart.product.id)?.quantity || 0;
      return acc + Number(cart.product.price) * quantity;
    }, 0);

    const createOrderProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const createdOrder = await prismaTrans.order.create({
          data: {
            user_id: existedUser.id,
            order_date: new Date(),
            status: "PENDING",
            proof_of_payment: proofOfPaymentUrl,
            total_price: total_price,
            order_product: {
              create: requestedProducts.map((requestedProduct) => ({
                product_id: requestedProduct.id,
                quantity: requestedProduct.quantity,
                price:
                  Number(existedProductInCarts.find((cart) => cart.product.id === requestedProduct.id).product.price) *
                  Number(requestedProduct.quantity),
              })),
            },
          },
          select: {
            id: true,
            order_date: true,
            status: true,
            total_price: true,
            proof_of_payment: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
            order_product: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    price: true,
                    stock: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        for (const cartProduct of existedProductInCarts) {
          const requestedProduct = requestedProducts.find((p) => p.id === cartProduct.product.id);

          const quantity = requestedProduct.quantity;
          await prismaTrans.product.update({
            where: {
              id: cartProduct.product.id,
            },
            data: {
              stock: {
                decrement: quantity,
              },
            },
          });
        }

        return createdOrder;
      } catch (error) {
        console.error("Error inside transaction update stock in create order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed update stock in create order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return createOrderProcess;
  }

  static async cancelOrder(request) {
    const { orderId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedOrder = await this.checkOrderMustBeExistById(orderId);

    if (existedOrder.status === "CANCELLED") {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Order already cancelled!");
    }

    if (existedOrder.status === "DONE") {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Order already done!");
    }

    const canceledOrderProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const cancelledOrder = await prismaTrans.order.update({
          where: {
            id: existedOrder.id,
          },
          data: {
            status: "CANCELLED",
          },
          select: {
            id: true,
            order_date: true,
            status: true,
            proof_of_payment: true,
            total_price: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
            order_product: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    stock: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        for (const orderProduct of cancelledOrder.order_product) {
          await prismaTrans.product.update({
            where: {
              id: orderProduct.product.id,
            },
            data: {
              stock: {
                increment: orderProduct.quantity,
              },
            },
          });
        }

        await db.cart.deleteMany({
          where: {
            user_id: cancelledOrder.user.id,
            product_id: {
              in: cancelledOrder.order_product.map((op) => op.product.id),
            },
          },
        });
      } catch (error) {
        console.error("Error inside transaction cancel order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed cancel order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return canceledOrderProcess;
  }

  static async acceptOrder(request) {
    const { orderId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedOrder = await this.checkOrderMustBeExistById(orderId);

    if (existedOrder.status === "DONE") {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Order already accepted!");
    }

    const acceptOrderProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const acceptOrder = await prismaTrans.order.update({
          where: {
            id: existedOrder.id,
          },
          data: {
            status: "DONE",
          },
          select: {
            id: true,
            order_date: true,
            status: true,
            proof_of_payment: true,
            total_price: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
            order_product: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    stock: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        await db.cart.deleteMany({
          where: {
            user_id: acceptOrder.user.id,
            product_id: {
              in: acceptOrder.order_product.map((op) => op.product.id),
            },
          },
        });
      } catch (error) {
        console.error("Error inside transaction accept order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed accept order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return acceptOrderProcess;
  }
}
