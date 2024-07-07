import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ProductService } from "../service/product.service.js";

export class ProductController {
  static async getAll(req, res, next) {
    try {
      const getAllProductRequest = {
        name: req?.query?.name,
      };

      const result = await ProductService.getAllProducts(getAllProductRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all product", result));
    } catch (error) {
      next(error);
    }
  }

  static async get(req, res, next) {
    try {
      const getProductRequest = {
        productId: req?.params?.productId ? Number(req.params.productId) : null,
      };

      const result = await ProductService.get(getProductRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get product", result));
    } catch (error) {
      next(error);
    }
  }

  static async getProductByCategory(req, res, next) {
    try {
      const getProductByCategoryRequest = {
        name: req?.query?.name,
        categoryId: req?.params?.categoryId ? Number(req.params.categoryId) : null,
      };

      const result = await ProductService.getProductByCategory(getProductByCategoryRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get product by category", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createProductRequest = {
        category_id: req.body.category_id ? Number(req.body.category_id) : null,
        loggedUserRole: req?.loggedUser?.role,
        image: req?.file,
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock ? Number(req.body.stock) : null,
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
        image: req?.file,
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock ? Number(req.body.stock) : null,
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

      await ProductService.deleteProduct(deleteProductRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete product"));
    } catch (error) {
      next(error);
    }
  }
}
