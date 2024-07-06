import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";

export class OrderService {
  static async checkOrderMustExist(orderId) {
    if (!orderId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Order Id Not Inputed!");
    }

    const existedOrder = await db.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        order_date: true,
        status: true,
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
            product_id: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!existedOrder) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Order not found!");
    }

    return existedOrder;
  }

  static async createOrder(request) {
    // Inside requestedProducts array, each product should have id, quantity
    const { userId, requestedProducts, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedUser = await UserService.checkUserMustBeExistById(userId);

    if (!requestedProducts || requestedProducts?.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Products must not empty to order!");
    }

    // collect all product ids
    const requestedProductIds = requestedProducts?.map((p) => p.id);

    // check if all requestedProducts exist
    const dbProducts = await db.product.findMany({
      where: {
        id: {
          in: requestedProductIds,
        },
      },
    });

    // check if all requestedProducts exist
    if (dbProducts.length !== requestedProductIds.length) {
      const foundProductIds = dbProducts.map((p) => p.id);
      const missingProductIds = requestedProductIds.filter((id) => !foundProductIds.includes(id));
      throw new APIError(API_STATUS_CODE.NOT_FOUND, `Products not found for IDs: ${missingProductIds.join(", ")}`);
    }

    // Check if requested quantity is available in stock
    const insufficientStockProducts = dbProducts.filter((dbProduct) => {
      const requestedQuantity = requestedProducts.find((p) => p.id === dbProduct.id)?.quantity || 0;
      return dbProduct.stock < requestedQuantity;
    });

    // If there are requestedProducts with insufficient stock, throw an error
    if (insufficientStockProducts.length > 0) {
      const insufficientStockDetails = insufficientStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
      }));
      const insufficientStockMessage = insufficientStockDetails.map((p) => `${p.name} (ID: ${p.id})`).join(", ");
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, `Insufficient stock for requestedProducts: ${insufficientStockMessage}`);
    }

    // Calculate total price
    const total_price = dbProducts.reduce((acc, product) => {
      const quantity = requestedProducts.find((p) => p.id === product.id)?.quantity || 0;
      return acc + Number(product.price) * quantity;
    }, 0);

    // Deduct stock from requestedProducts
    await db.$transaction(async (prismaTrans) => {
      try {
        for (const product of dbProducts) {
          const requestedQuantity = requestedProducts.find((p) => p.id === product.id)?.quantity || 0;
          await prismaTrans.product.update({
            where: { id: product.id },
            data: { stock: { decrement: requestedQuantity } },
          });
        }
        return updatedProducts;
      } catch (error) {
        console.error("Error inside transaction update stock in create order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed update stock in create order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    // Create order
    const order = await db.$transaction(async (prismaTrans) => {
      try {
        const createdOrder = await prismaTrans.order.create({
          data: {
            user_id: existedUser.id,
            order_date: new Date(),
            status: "PENDING", // Initial status is false (not accepted)
            total_price: total_price,
            order_product: {
              create: requestedProducts.map((p) => ({
                product_id: p.id,
                quantity: p.quantity,
                price: Number(dbProducts.find((product) => product.id === p.id)?.price),
              })),
            },
          },
        });

        return createdOrder;
      } catch (error) {
        console.error("Error inside transaction order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed create order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return order;
  }

  static async acceptOrder(request) {
    const { orderId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedOrder = await this.checkOrderMustExist(orderId);

    if (existedOrder.status === "DONE") {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Order already accepted!");
    }

    await db.$transaction(async (prismaTrans) => {
      try {
        // Update the order status to accepted
        const acceptedOrder = await prismaTrans.order.update({
          where: { id: existedOrder.id },
          data: { status: "DONE" },
          select: {
            id: true,
            order_date: true,
            status: true,
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
                  },
                },
              },
            },
          },
        });

        // Update the product stock based on the order products
        for (const orderProduct of existedOrder.order_product) {
          await prismaTrans.product.update({
            where: { id: orderProduct.product_id },
            data: { stock: { decrement: orderProduct.quantity } },
          });
        }

        await prismaTrans.orderHistory.create({
          data: {
            order_id: acceptedOrder.id,
            status: "DONE",
            user_id: acceptedOrder.user.id,
            order_date: acceptedOrder.order_date,
            total_price: acceptedOrder.total_price,
            user_name: acceptedOrder.user.name,
            order_product_history: {
              create: acceptedOrder.order_product.map((p) => ({
                order_product_id: p.id,
                product_id: p.product.id,
                product_name: p.product.name,
                quantity: p.quantity,
                price: p.price,
              })),
            },
          },
        });
      } catch (error) {
        console.error("Error inside transaction accepted order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed accept order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return true;
  }

  static async getOrder(request) {
    const { orderId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const order = await this.checkOrderMustExist(orderId);

    return order;
  }

  static async getCurrentUserOrder(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedUser = await UserService.checkUserMustBeExistById(userId);

    const orders = await db.order.findMany({
      where: {
        AND: [
          {
            user_id: existedUser.id,
          },
          {
            status: {
              equals: "PENDING",
            },
          },
        ],
      },
      orderBy: [
        {
          order_date: "desc",
        },
      ],
      select: {
        id: true,
        order_date: true,
        status: true,
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
            product_id: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return orders;
  }

  static async getAllOrders(request) {
    const { name, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const orders = await db.order.findMany({
      orderBy: [
        {
          order_date: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        order_date: true,
        status: true,
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
            product_id: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return orders;
  }

  static async cancelOrder(request) {
    const { orderId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedOrder = await this.checkOrderMustExist(orderId);

    if (existedOrder.status === "CANCEL") {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Order already canceled!");
    }

    await db.$transaction(async (prismaTrans) => {
      try {
        // Update the order status to accepted
        const cancelledOrder = await prismaTrans.order.update({
          where: { id: existedOrder.id },
          data: { status: "CANCEL" },
          select: {
            id: true,
            order_date: true,
            status: true,
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
                  },
                },
              },
            },
          },
        });

        // Update the product stock based on the order products
        for (const orderProduct of existedOrder.order_product) {
          await prismaTrans.product.update({
            where: { id: orderProduct.product_id },
            data: { stock: { increment: orderProduct.quantity } },
          });
        }

        await prismaTrans.orderHistory.create({
          data: {
            order_id: cancelledOrder.id,
            status: "DONE",
            user_id: cancelledOrder.user.id,
            order_date: cancelledOrder.order_date,
            total_price: cancelledOrder.total_price,
            user_name: cancelledOrder.user.name,
            order_product_history: {
              create: cancelledOrder.order_product.map((p) => ({
                order_product_id: p.id,
                product_id: p.product.id,
                product_name: p.product.name,
                quantity: p.quantity,
                price: p.price,
              })),
            },
          },
        });
      } catch (error) {
        console.error("Error inside transaction cancel order:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed cancel order!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return true;
  }
}
