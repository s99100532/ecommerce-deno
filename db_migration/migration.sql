CREATE DATABASE IF NOT EXISTS shopping;

USE shopping;

CREATE TABLE IF NOT EXISTS orders (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  status varchar(20) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS order_item (
  order_id int NOT NULL,
  product_id char(20) NOT NULL,
  unique (order_id, product_id),
  INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS products (
  id char(20) NOT NULL,
  quantity int NOT NULL,
  product_name varchar(100),
  category varchar(100),
  price float NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id int NOT NULL AUTO_INCREMENT,
  username varchar(100) NOT NULL,
  password_hash char(100) NOT NULL,
  balance float NOT NULL,
  PRIMARY KEY (id),
  unique (username)
);