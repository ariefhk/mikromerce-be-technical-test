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
      include: {
        category: true,
        cart: true,
        order_product: true,
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
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return products;
  }

  static async get(request) {
    const { productId } = request;

    const product = await this.checkProductMustBeExistById(productId);

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      createdAt: product.createdAt,
    };
  }

  static async getProductByCategory(request) {
    const { categoryId, name } = request;

    const existedCategory = await CategoryService.checkCategoryMustBeExistById(categoryId);

    const filter = {
      AND: [
        {
          category_id: existedCategory.id,
        },
      ],
    };

    if (name) {
      filter.AND.push({
        name: {
          contains: name,
          mode: "insensitive",
        },
      });
    }

    const product = await db.product.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

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
      include: {
        category: true,
      },
    });

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      createdAt: product.createdAt,
    };
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
      include: {
        category: true,
      },
    });

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      createdAt: product.createdAt,
    };
  }

  static async deleteProduct(request) {
    const { productId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedProduct = await ProductService.checkProductMustBeExistById(productId);

    await db.product.delete({
      where: {
        id: existedProduct.id,
      },
    });

    return true;
  }
}
