import { ERROR_MESSAGE } from "../constants.ts";
import { RepositoryError } from "../exceptions.ts";
import { User } from "../types/models.ts";
import Repository from "./Repository.ts";

type UserCredentialKey = "password_hash";

export default class UserRepository extends Repository {
  async getUserCredential(
    username: string
  ): Promise<Pick<User, UserCredentialKey | "id"> | null> {
    try {
      const result = await this.dbClient.query(
        "select id, password_hash from users where username = ?",
        [username]
      );

      return result[0];
    } catch (e) {
      this.logger.error(e);
      throw new RepositoryError(e.message);
    }
  }
  async getUserInfo(
    user_id: number
  ): Promise<Pick<User, "id" | "username" | "balance"> | null> {
    try {
      const result = await this.dbClient.query(
        "select id, username, balance from users where id = ?",
        [user_id]
      );

      return result[0];
    } catch (e) {
      this.logger.error(e);
      throw new RepositoryError(e.message);
    }
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const result = await this.dbClient.query(
        "select count(*) as user_count from users where username = ?",
        [username]
      );

      return result[0].user_count > 0;
    } catch (e) {
      throw new RepositoryError(e.message);
    }
  }
  async createUser(
    username: string,
    password_hash: string,
    balance: number
  ): Promise<Omit<User, UserCredentialKey>> {
    try {
      const result = await this.dbClient.execute(
        `INSERT INTO users (username, password_hash, balance) VALUES
    (?, ?, ?)
    `,
        [username, password_hash, balance]
      );

      if (result.affectedRows == 1 && result.lastInsertId) {
        return {
          id: result.lastInsertId,
          username,
          balance,
        };
      } else {
        throw new RepositoryError(ERROR_MESSAGE.ERROR_DB_INSERT);
      }
    } catch (e) {
      this.logger.error(e);

      throw new RepositoryError(ERROR_MESSAGE.ERROR_DB_INSERT);
    }
  }
}
