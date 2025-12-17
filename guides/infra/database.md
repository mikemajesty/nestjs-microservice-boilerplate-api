# 🗄️ Database

## Overview

The database layer provides **schema definitions** and **migrations** for both databases:
- **MongoDB** — Document-based, uses Mongoose schemas
- **PostgreSQL** — Relational, uses TypeORM entities

Each database has its own folder with identical structure but different implementations.

```
src/infra/database/
├── adapter.ts          # Shared interface
├── mongo/
│   ├── config.ts       # mongo-migrate-ts configuration
│   ├── module.ts       # NestJS module
│   ├── schemas/        # Mongoose schemas
│   └── migrations/     # MongoDB migrations
└── postgres/
    ├── config.ts       # TypeORM DataSource configuration
    ├── module.ts       # NestJS module
    ├── schemas/        # TypeORM entities
    └── migrations/     # PostgreSQL migrations
```

---

# 🍃 MongoDB

## Schema Structure

MongoDB schemas use `@nestjs/mongoose` decorators with Mongoose under the hood.

### Schema Example

```typescript
// src/infra/database/mongo/schemas/cat.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CatEntity } from '@/core/cat/entity/cat'

export type CatDocument = Document & CatEntity

@Schema({
  collection: 'cats',           // Collection name
  autoIndex: true,              // Auto-create indexes
  timestamps: true,             // Add createdAt/updatedAt
  toJSON: { virtuals: true },   // Include virtuals in JSON
  toObject: { virtuals: true }
})
export class Cat {
  @Prop({ type: String })
  _id!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  name!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  breed!: string

  @Prop({ min: 0, max: 200, required: true, type: Number })
  age!: string

  @Prop({ type: Date, default: null })
  deletedAt!: Date
}

const CatSchema = SchemaFactory.createForClass(Cat)

// Indexes
CatSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } })
CatSchema.index({ deletedAt: 1 })
CatSchema.index({ deletedAt: 1, createdAt: -1 })
CatSchema.index({ deletedAt: 1, updatedAt: -1 })
CatSchema.index({ deletedAt: 1, createdAt: -1, _id: 1 })

// Plugins
CatSchema.plugin(paginate)

// Virtual 'id' field (maps _id to id)
CatSchema.virtual('id').get(function () {
  return this._id
})

export { CatSchema }
```

### Key Patterns

| Pattern | Description |
|---------|-------------|
| `@Schema({ collection: 'cats' })` | Explicit collection name |
| `@Prop({ required: true })` | Field validation |
| `timestamps: true` | Auto `createdAt`/`updatedAt` |
| `deletedAt: Date` | Soft delete support |
| `CatSchema.index(...)` | Performance indexes |
| `CatSchema.plugin(paginate)` | Pagination support |
| `virtual('id')` | Maps `_id` → `id` for consistency |

---

## MongoDB Migrations

Uses `mongo-migrate-ts` library.

### Migration Example

```typescript
// src/infra/database/mongo/migrations/1709943706267_createCatsCollection.ts
import { MigrationInterface } from 'mongo-migrate-ts'
import { Db } from 'mongodb'

export class CreateCatsCollection1709943706267 implements MigrationInterface {
  async up(db: Db): Promise<void> {
    await db.createCollection('cats')
  }

  async down(db: Db): Promise<void> {
    await db.dropCollection('cats')
  }
}
```

### Commands

```bash
# Create new migration
npm run migration-mongo:create

# Run migrations
npm run migration-mongo:run

# Revert last migration
npm run migration-mongo:undo
```

### Config

```typescript
// src/infra/database/mongo/config.ts
import { mongoMigrateCli } from 'mongo-migrate-ts'
import path from 'path'

mongoMigrateCli({
  uri: process.env['MONGO_URL'],
  database: process.env['MONGO_DATABASE'],
  migrationsDir: path.join(__dirname, './migrations'),
  migrationsCollection: 'migrations'
})
```

---

## How to Add New MongoDB Schema

### 1️⃣ Create the schema file

```typescript
// src/infra/database/mongo/schemas/product.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { ProductEntity } from '@/core/product/entity/product'

export type ProductDocument = Document & ProductEntity

@Schema({
  collection: 'products',
  autoIndex: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Product {
  @Prop({ type: String })
  _id!: string

  @Prop({ required: true, type: String })
  name!: string

  @Prop({ required: true, type: Number })
  price!: number

  @Prop({ type: String })
  description?: string

  @Prop({ type: Date, default: null })
  deletedAt!: Date
}

const ProductSchema = SchemaFactory.createForClass(Product)

// Indexes
ProductSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } })
ProductSchema.index({ deletedAt: 1 })
ProductSchema.index({ deletedAt: 1, createdAt: -1 })

// Plugins
ProductSchema.plugin(paginate)

// Virtual
ProductSchema.virtual('id').get(function () {
  return this._id
})

export { ProductSchema }
```

### 2️⃣ Create migration

```bash
npm run migration-mongo:create
# Rename file: 1234567890_createProductsCollection.ts
```

```typescript
// src/infra/database/mongo/migrations/1234567890_createProductsCollection.ts
import { MigrationInterface } from 'mongo-migrate-ts'
import { Db } from 'mongodb'

export class CreateProductsCollection1234567890 implements MigrationInterface {
  async up(db: Db): Promise<void> {
    await db.createCollection('products')
  }

  async down(db: Db): Promise<void> {
    await db.dropCollection('products')
  }
}
```

### 3️⃣ Run migration

```bash
npm run migration-mongo:run
```

---

# 🐘 PostgreSQL

## Schema Structure

PostgreSQL schemas use **TypeORM entities** with decorators.

### Schema Example (Simple)

```typescript
// src/infra/database/postgres/schemas/permission.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  UpdateDateColumn
} from 'typeorm'

@Entity({ name: 'permissions' })
@Index('idx_permissions_name_trgm', ['name'])
@Index('idx_permissions_deleted_name_created', ['deletedAt', 'name', 'createdAt'])
export class PermissionSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text', { unique: true })
  name!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
```

### Schema Example (With Relations)

```typescript
// src/infra/database/postgres/schemas/user.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm'

import { RoleSchema } from './role'
import { UserPasswordSchema } from './user-password'

@Entity({ name: 'users' })
@Index('idx_users_email_not_deleted', ['email'], {
  where: '"deleted_at" IS NULL'
})
@Index('idx_users_email_deleted_at', ['email', 'deletedAt'])
@Index('idx_users_name_trgm', ['name'])
@Index('idx_users_deleted_created_id', ['deletedAt', 'createdAt', 'id'])
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text')
  name!: string

  @Column('text')
  email!: string

  @OneToOne(() => UserPasswordSchema, { 
    cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] 
  })
  @JoinColumn()
  password!: Relation<UserPasswordSchema>

  @ManyToMany(() => RoleSchema, { eager: true, cascade: ['recover'] })
  @JoinTable({ name: 'users_roles' })
  roles!: Relation<RoleSchema[]>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
```

### Key Patterns

| Pattern | Description |
|---------|-------------|
| `@Entity({ name: 'users' })` | Table name |
| `@Column({ type: 'uuid', primary: true })` | UUID primary key |
| `@Column('text', { unique: true })` | Unique constraint |
| `@CreateDateColumn()` | Auto timestamp |
| `@DeleteDateColumn()` | Soft delete support |
| `@Index('name', ['field'], { where })` | Partial indexes |
| `@OneToOne`, `@ManyToMany` | Relationships |
| `cascade: ['insert', 'update', ...]` | Cascade operations |
| `eager: true` | Auto-load relation |

---

## PostgreSQL Migrations

Uses **TypeORM migrations** with raw SQL for full control.

### Migration: Create Table

```typescript
// src/infra/database/postgres/migrations/1727653462661-createPermissionTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class createPermissionTable1727653462661 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL,
        "name" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('permissions', true)
  }
}
```

### Migration: Create Relationships

```typescript
// src/infra/database/postgres/migrations/1727654289658-createTableRelationship.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class createTableRelationship1727654289658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper to check if constraint exists
    const constraintExists = async (constraintName: string): Promise<boolean> => {
      const result = await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = $1`,
        [constraintName]
      )
      return result.length > 0
    }

    // Add foreign keys only if they don't exist
    if (!(await constraintExists('FK_users_password'))) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "FK_users_password" 
        FOREIGN KEY ("password_id") REFERENCES "users_password"("id")
      `)
    }

    if (!(await constraintExists('FK_users_roles_users'))) {
      await queryRunner.query(`
        ALTER TABLE "users_roles" 
        ADD CONSTRAINT "FK_users_roles_users" 
        FOREIGN KEY ("users_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('users', 'FK_users_password')
    await queryRunner.dropForeignKey('users_roles', 'FK_users_roles_users')
  }
}
```

### Migration: Insert Data (Seed)

```typescript
// src/infra/database/postgres/migrations/1727654555722-insertPermissions.ts
import { MigrationInterface, QueryRunner } from 'typeorm'
import { PermissionEntity } from '@/core/permission/entity/permission'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { PermissionSchema } from '../schemas/permission'

export const permissions = [
  'cat:create',
  'cat:update',
  'cat:getbyid',
  'cat:list',
  'cat:delete',
  'user:create',
  'user:update',
  'user:list',
  // ...
]

export class insertPermissions1727654555722 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionsPromises = []
    
    for (const permission of permissions) {
      const entity = new PermissionEntity({ 
        id: IDGeneratorUtils.uuid(), 
        name: permission 
      })
      
      permissionsPromises.push(
        queryRunner.manager.insert(PermissionSchema, entity.toObject())
      )
    }
    
    await Promise.all(permissionsPromises)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(PermissionSchema, {})
  }
}
```

### Migration: Add Indexes

```typescript
// src/infra/database/postgres/migrations/1734199200000-AddPerformanceIndexes.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPerformanceIndexes1734199200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`)

    // Trigram indexes for fuzzy search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_name_trgm" 
      ON "users" USING gin (name gin_trgm_ops)
    `)

    // Partial indexes (only active records)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_name_lower" 
      ON "users" (lower(name)) 
      WHERE "deleted_at" IS NULL
    `)

    // Composite indexes for common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_roles_role_id" 
      ON "users_roles" ("roles_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
```

### Commands

```bash
# Create new migration
npm run migration-postgres:create
# Rename: 1234567890-createProductTable.ts

# Run migrations
npm run migration-postgres:run

# Revert last migration
npm run migration-postgres:undo

# Run both (Mongo + Postgres)
npm run migration:run
```

### Config

```typescript
// src/infra/database/postgres/config.ts
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  schema: process.env.POSTGRES_SCHEMA,
  namingStrategy: new SnakeNamingStrategy(), // snake_case columns
  ssl: process.env.POSTGRES_SSL === 'true' 
    ? { rejectUnauthorized: false } 
    : false,
  extra: {
    max: 20,
    min: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 300000,
    // ...
  },
  migrationsTableName: 'migrations',
  migrations: ['src/infra/database/postgres/migrations/*.{ts,js}'],
  entities: ['src/infra/database/postgres/schemas/*.{ts,js}'],
  synchronize: false, // NEVER true in production!
})
```

---

## How to Add New PostgreSQL Schema

### 1️⃣ Create the schema file

```typescript
// src/infra/database/postgres/schemas/product.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  UpdateDateColumn
} from 'typeorm'

@Entity({ name: 'products' })
@Index('idx_products_name_trgm', ['name'])
@Index('idx_products_deleted_created', ['deletedAt', 'createdAt'])
export class ProductSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text')
  name!: string

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number

  @Column('text', { nullable: true })
  description?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
```

### 2️⃣ Create migration

```bash
npm run migration-postgres:create
# Rename: 1234567890-createProductTable.ts
```

```typescript
// src/infra/database/postgres/migrations/1234567890-createProductTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class createProductTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL,
        "name" text NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `)

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_name_trgm" 
      ON "products" USING gin (name gin_trgm_ops)
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_deleted_created" 
      ON "products" ("deleted_at", "created_at")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products', true)
  }
}
```

### 3️⃣ Run migration

```bash
npm run migration-postgres:run
```

---

## Comparison Table

| Feature | MongoDB | PostgreSQL |
|---------|---------|------------|
| **Library** | `@nestjs/mongoose` | `typeorm` |
| **Schema** | `@Schema`, `@Prop` | `@Entity`, `@Column` |
| **Migration Tool** | `mongo-migrate-ts` | TypeORM CLI |
| **Soft Delete** | `deletedAt: Date` | `@DeleteDateColumn()` |
| **Timestamps** | `timestamps: true` | `@CreateDateColumn()` |
| **Indexes** | `Schema.index()` | `@Index()` decorator |
| **Pagination** | `mongoose-paginate-v2` | Built-in |
| **Naming** | camelCase | snake_case (via strategy) |

---

## Migration Commands Summary

| Command | Description |
|---------|-------------|
| `npm run migration:run` | Run both Mongo + Postgres |
| `npm run migration-postgres:create` | Create PostgreSQL migration |
| `npm run migration-postgres:run` | Run PostgreSQL migrations |
| `npm run migration-postgres:undo` | Revert last PostgreSQL migration |
| `npm run migration-mongo:create` | Create MongoDB migration |
| `npm run migration-mongo:run` | Run MongoDB migrations |
| `npm run migration-mongo:undo` | Revert last MongoDB migration |

---

## Related Links

- [Repository](./repository.md) — Database-agnostic repository pattern
- [Secrets](./secrets.md) — Database connection strings
