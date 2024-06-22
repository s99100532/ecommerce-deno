# Teck Stack

- Deno
- MySQL

# Prerequisite

- Install docker latest version (>= 24)

# Getting Started

1. Start the services.

```sh
docker compose up -d
```

2. Run the migration [here](./db_migration/init.sql)
3. Enter the app container

```sh
docker compose exec app bash
```

4. Run the migration for seed data

```sh
deno task db:migration
```

5. Start calling the API

# Testing

1. Enter app container as above
2. Run `deno task test`

# Remark

- if deno is installed with a existing database instead of using docker, the
  project can start with `deno task dev` after database setup.

# API Structure

- [constants.ts](./constants.ts) for available routes
- [types/dto.ts](./types/dto.ts) for payload and response

# Production consideration

- use `scripts/gen_jwt_secret.ts`to generate key for production
- Env should be stored securely (not .env file) and inject on deployment
