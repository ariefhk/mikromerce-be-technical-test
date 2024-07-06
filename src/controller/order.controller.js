import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { OrderService } from "../service/order.service.js";

export class OrderController {
  static async getCurrentUserOrder(req, res, next) {
    try {
      const getUserOrderRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
      };

      const result = await OrderService.getCurrentUserOrder(getUserOrderRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current user order", result));
    } catch (error) {
      next(error);
    }
  }

  static async get(req, res, next) {
    try {
      const getProductRequest = {
        productId: req?.params?.productId ? Number(req.params.productId) : null,
      };

      const result = await ProductService.getAllProducts(getProductRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get product", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createProductRequest = {
        category_id: req.body.category_id ? Number(req.body.category_id) : null,
        loggedUserRole: req?.loggedUser?.role,
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock,
        description: req.body.description,
      };

      const result = await ProductService.createProduct(createProductRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create product", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateProductRequest = {
        loggedUserRole: req?.loggedUser?.role,
        productId: req?.params?.productId ? Number(req.params.productId) : null,
        category_id: req.body.category_id ? Number(req.body.category_id) : null,
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock,
        description: req.body.description,
      };

      const result = await ProductService.updateProduct(updateProductRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update product", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteProductRequest = {
        loggedUserRole: req?.loggedUser?.role,
        productId: req?.params?.productId ? Number(req.params.productId) : null,
      };

      const result = await ProductService.deleteProduct(deleteProductRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete product", result));
    } catch (error) {
      next(error);
    }
  }
}
