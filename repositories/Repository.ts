import { Client } from "mysql";
import helper from "../helpers.ts";
import { Logger } from "@std/log";

export default class Repository {
  dbClient: Client;
  logger: Logger;
  constructor(dbClient: Client) {
    this.dbClient = dbClient;
    this.logger = helper.getAppLogger();
  }
}
