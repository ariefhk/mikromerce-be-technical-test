import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { OrderService } from "../service/order.service.js";

export class OrderController {
  static async getUserOrder(req, res, next) {
    try {
      const getUserOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
        status: String(req?.query?.status)?.toLocaleLowerCase(),
      };

      const result = await OrderService.getAllOrder(getUserOrderRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get user order", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrder(req, res, next) {
    try {
      const getAllOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        status: String(req?.query?.status)?.toLocaleLowerCase(),
      };

      const result = await OrderService.getAllOrder(getAllOrderRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all order", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        requestedProducts: req.body.requestedProducts ? JSON.parse(req.body.requestedProducts) : null,
        proof_of_payment: req?.file,
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
      };

      console.log(createOrderRequest);

      const result = await OrderService.createOrder(createOrderRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create product", result));
    } catch (error) {
      next(error);
    }
  }

  static async acceptOrder(req, res, next) {
    try {
      const acceptOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        orderId: req?.params?.orderId ? Number(req.params.orderId) : null,
      };

      const result = await OrderService.acceptOrder(acceptOrderRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success accept order", result));
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const cancelOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        orderId: req?.params?.orderId ? Number(req.params.orderId) : null,
      };

      const result = await OrderService.cancelOrder(cancelOrderRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success cancel order", result));
    } catch (error) {
      next(error);
    }
  }
}
