import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "../service/user.service.js";

export class UserController {
  static async getAll(req, res, next) {
    try {
      const getAllUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const result = await UserService.getAllUsers(getAllUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all user", result));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const loginUserRequest = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await UserService.login(loginUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success login user", result));
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const registerUserRequest = {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        password: req.body.password,
        role: req.body.role,
      };

      const result = await UserService.register(registerUserRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create user", result));
    } catch (error) {
      next(error);
    }
  }

  static async get(req, res, next) {
    try {
      const loggedUser = req?.loggedUser;

      const user = {
        id: loggedUser?.id,
        name: loggedUser?.namem,
        email: loggedUser?.email,
        address: loggedUser?.address,
        role: loggedUser?.role,
      };

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get user", user));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req.params.userId ? Number(req.params.userId) : null,
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        password: req.body.password,
        role: req.body.role,
      };

      const result = await UserService.update(updateUserRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update user", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req.params.userId ? Number(req.params.userId) : null,
      };

      const result = await UserService.delete(deleteUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete user", result));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const logoutUserRequest = {
        userId: req.loggedUser.id,
      };

      const result = await UserService.logout(logoutUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success logout user", result));
    } catch (error) {
      next(error);
    }
  }
}
