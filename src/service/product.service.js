import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { CategoryService } from "./category.service.js";

export class ProductService {
  static async checkProductMustBeExistById(productId) {
    if (!productId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Product Id Not Inputed!");
    }

    const existedProduct = await db.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!existedProduct) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Product not found!");
    }

    return existedProduct;
  }

  static async getAllProducts(request) {
    const { name } = request;
    const filter = {};

    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const products = await db.product.findMany({
      where: filter,
    });

    return products;
  }

  static async get(request) {
    const { productId } = request;

    const product = await ProductService.checkProductMustBeExistById(productId);

    return product;
  }

  static async createProduct(request) {
    const { name, price, stock, description, category_id, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!name || !price || !stock || !category_id) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name, Price, Category, and Stock must not missing!");
    }

    const existedCategory = await CategoryService.checkCategoryMustBeExistById(category_id);

    const product = await db.product.create({
      data: {
        description: description || "",
        name,
        price,
        stock,
        category_id: existedCategory.id,
      },
    });

    return product;
  }

  static async updateProduct(request) {
    const { productId, name, price, stock, description, category_id, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedProduct = await ProductService.checkProductMustBeExistById(productId);

    let updatedCategory;

    if (category_id) {
      updatedCategory = await CategoryService.checkCategoryMustBeExistById(category_id);
    }

    const product = await db.product.update({
      where: {
        id: existedProduct.id,
      },
      data: {
        name: name || existedProduct.name,
        price: price || existedProduct.price,
        stock: stock || existedProduct.stock,
        description: description || existedProduct.description,
        category_id: updatedCategory?.id || existedProduct.category_id,
      },
    });

    return product;
  }

  static async deleteProduct(request) {
    const { productId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedProduct = await ProductService.checkProductMustBeExistById(productId);

    await db.product.delete({
      where: {
        id: productId,
      },
    });

    return existedProduct;
  }
}
