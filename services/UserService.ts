import UserRepository from "../repositories/UserRepository.ts";
import { hash, compare } from "bcrypt";
import { getNumericDate } from "djwt";
import helper from "../helpers.ts";
import { ERROR_MESSAGE } from "../constants.ts";
import { JWTPayload } from "../types/request.ts";
import { UserError } from "../exceptions.ts";

export default class UserService {
  userRepository: UserRepository;
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async signup(username: string, password: string) {
    const passwordHash = await hash(password);

    const userExists = await this.userRepository.checkUsernameExists(username);

    if (userExists) {
      throw new UserError(ERROR_MESSAGE.ERROR_USERNAME_EXISTS);
    }

    const defaultBalance = parseInt(helper.getEnv("USER_DEFAULT_BALANCE"));
    const user = await this.userRepository.createUser(
      username,
      passwordHash,
      defaultBalance
    );

    return user;
  }

  async login(username: string, password: string) {
    const credential = await this.userRepository.getUserCredential(username);

    if (!credential) {
      throw new UserError(ERROR_MESSAGE.ERROR_USER_NOT_EXISTS);
    }

    const passwordMatch = await compare(password, credential.password_hash);

    if (!passwordMatch) {
      throw new UserError(ERROR_MESSAGE.ERROR_INVALID_PASSWORD);
    }

    const payload: JWTPayload = {
      sub: credential.id + "",
      // Expire after 7 days
      exp: getNumericDate(60 * 60 * 24 * 7),
    };

    const token = await helper.generateToken(payload);

    return token;
  }
}
