# Teck Stack

- Deno
- MySQL

# Prerequisite

- Install docker latest version (>= 24)

# Getting Started

1. Start the database and app. The db container will create table automatically according to [here](./db_migration/init.sql).

```sh
docker compose up -d
```

2. Enter the app container

```sh
docker compose exec app bash
```

3. Run the migration for seed data

```sh
deno task db:migration
```

4. test the API using endpoint http://localhost:8080/health

# Testing

1. Enter app container as above
2. Run `deno task test`

> [!WARNING]
> Run test will TRUNCATE all the tables, make sure to use dev database.

# Remark

- if deno is installed with a existing database instead of using docker, the
  project can start with `deno task dev` after database setup.

# API Structure

- [constants.ts](./constants.ts) for available routes
- [types/dto.ts](./types/dto.ts) for payload and response

# Production consideration

- use `scripts/gen_jwt_secret.ts`to generate key for production
- Env should be stored securely (not .env file) and inject on deployment
