# Mikromerce - Backend Technical Test

## Tech Stack

- Express Js
- Prisma ORM
- PostgreSQL

## Service

- Cloudinary

## Technical Docs

- [DB Diagram](https://s.id/mikromerce-db-diagram)
- [Flow Diagram](https://s.id/mikromerce-flow)
- [API Docs](https://s.id/mikromerce-docs)

## How To Run

1. Install Library

```bash
pnpm i
```

2. Create an .env file on root folder

```bash
DATABASE_URL=
JWT_SECRET_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

3. Create Database

```bash
pnpm db:push
```

4. Create Seed

```bash
pnpm db:seed
```

5. Running Project on development

```bash
pnpm dev
```
