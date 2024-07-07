import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { makeJwt, decodeJwt } from "../helper/jwt.helper.js";
import { createBcryptPassword, compareBcryptPassword } from "../helper/hashing.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class UserService {
  static async checkUserMustBeExistById(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Id Not Inputed!");
    }

    const existedUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    return existedUser;
  }

  static async checkUserMustBeExistByEmail(email) {
    if (!email) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Email Not Inputed!");
    }

    const existedUser = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    return existedUser;
  }

  static async register(request) {
    const { name, email, address, phone_number, role, password } = request;

    if (!password || !name || !email || !phone_number || !address) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email, Password, Address,  Phone Number, and Name must not missing!");
    }

    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    if (countUser !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already exists!");
    }

    const hashedPassword = await createBcryptPassword(password);

    const registerUser = await db.user.create({
      data: {
        name,
        email,
        address,
        phone_number,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
      },
    });

    return {
      id: registerUser.id,
      name: registerUser.name,
      email: registerUser.email,
      address: registerUser.address,
    };
  }

  static async login(request) {
    const { email, password } = request;

    if (!password || !email) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email, Or Password must not missing!");
    }

    const existedUser = await this.checkUserMustBeExistByEmail(email);

    const isValidPassword = await compareBcryptPassword(password, existedUser.password);

    if (!isValidPassword) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or Password wrong!");
    }

    const token = await makeJwt(
      {
        id: existedUser.id,
      },
      "7d"
    );

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        token,
      },
    });

    return {
      name: existedUser.name,
      email: existedUser.email,
      role: existedUser.role,
      token,
    };
  }

  static async getUserById(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedUser = await this.checkUserMustBeExistById(userId);

    return {
      id: existedUser.id,
      name: existedUser.name,
      email: existedUser.email,
      address: existedUser.address,
      phone_number: existedUser.phone_number,
      role: existedUser.role,
      createdAt: existedUser.createdAt,
    };
  }

  static async checkUserToken(token) {
    const existedToken = await db.user.findFirst({
      where: {
        token: token,
      },
    });

    if (!existedToken) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unauthorized!");
    }
    const decodedUser = await decodeJwt(token);
    const existedUser = await this.checkUserMustBeExistById(decodedUser.id);

    return {
      id: existedUser.id,
      name: existedUser.name,
      email: existedUser.email,
      address: existedUser.address,
      role: existedUser.role,
    };
  }

  static async getAllUsers(request) {
    const { name, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const users = await db.user.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone_number: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }

  static async update(request) {
    const { name, email, address, password, phone_number, role, userId } = request;

    const existedUser = await this.checkUserMustBeExistById(userId);

    const updatedUser = await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        name: name || existedUser.name,
        email: email || existedUser.email,
        address: address || existedUser?.address,
        phone_number: phone_number || existedUser.phone_number,
        password: password ? await createBcryptPassword(password) : existedUser.password,
        role: role && existedUser.role === "ADMIN" ? role : existedUser.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
    };
  }

  static async delete(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedUser = await this.checkUserMustBeExistById(userId);

    await db.user.delete({
      where: {
        id: existedUser.id,
      },
    });

    return true;
  }

  static async logout(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedUser = await this.checkUserMustBeExistById(userId);

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        token: null,
      },
    });

    return true;
  }
}
