# Entity

Base entity foundation that provides essential functionality for all domain entities, including validation, soft delete, ID generation, and object conversion. This is the **core building block** for the entire domain layer and **the home of all business rules**.

## Why in Utils?

Even though this is **core domain functionality**, it's located in utils because it provides **shared infrastructure** that all entities across different modules need. Think of it as **foundational tooling** rather than business logic - it's the common foundation that enables clean entity implementation throughout the application.

## Business Rules Central Hub

**CRITICAL**: Every business rule that involves **state changes** or **state comparisons** must be implemented in the entity, never in services or usecases. The entity is the **guardian of business logic** and domain invariants.

### ✅ Business Logic BELONGS in Entity:
- **State validation** (can user perform action?)
- **State transitions** (pending → confirmed → shipped)  
- **Business rule enforcement** (user cannot delete own account if admin)
- **Domain calculations** (order total, user age, etc.)
- **Conditional logic** (based on entity state)

### ❌ Business Logic NEVER in Service/UseCase:
- Services only **orchestrate** entities and external calls
- UseCases only **coordinate** between repositories and entities  
- No domain logic in application layer

## Essential Integration Pattern

Every domain entity **must extend** BaseEntity to ensure consistency and access to core functionality:

```typescript
// Entity contains ALL business logic and rules
export class UserEntity extends BaseEntity<UserEntityProps>() {
  constructor(entity: UserEntityProps) {
    super(userEntitySchema)
    this.validate(entity)
    this.ensureID()
  }

  // ✅ Domain rules and state changes belong HERE
  updateEmail(newEmail: string): UserEntity {
    // Business rule: cannot change email if user is deleted
    if (this.isDeleted()) {
      throw new ApiUnprocessableEntityException('cannotUpdateDeletedUser')
    }

    // Business rule: email cannot be same as current
    if (this.email === newEmail) {
      throw new ApiUnprocessableEntityException('emailAlreadyCurrent')
    }

    return this.merge({ email: newEmail, updatedAt: new Date() })
  }

  makeAdmin(): UserEntity {
    // Business rule: only active users can become admin
    if (this.isDeleted()) {
      throw new ApiUnprocessableEntityException('cannotPromoteDeletedUser')
    }

    // Business rule: already admin check
    if (this.role === 'admin') {
      throw new ApiUnprocessableEntityException('userAlreadyAdmin')
    }

    return this.merge({ role: 'admin', updatedAt: new Date() })
  }

  canDelete(): boolean {
    // Business rule: admins cannot delete themselves
    return this.toObject().role !== 'admin'
  }

  requestDeletion(): UserEntity {
    // Business rule enforcement
    if (!this.canDelete()) {
      throw new ApiUnprocessableEntityException('adminCannotSelfDelete')
    }

    return this.deactivate()
  }
}

type UserEntityProps = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

const userEntitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().nullable().optional()
})
```

## toObject() - Critical for Data Flow

The `toObject()` method is **essential** for converting entities back to plain objects. This is used constantly throughout the application:

### Repository Layer
```typescript
export class UserRepository implements IUserRepository {
  async save(user: UserEntity): Promise<void> {
    // Convert entity to plain object for database persistence
    const userData = user.toObject()
    await this.model.create(userData)
  }

  async update(user: UserEntity): Promise<void> {
    const userData = user.toObject()
    await this.model.findByIdAndUpdate(user.id, userData)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const userData = await this.model.findById(id)
    if (!userData) return null
    
    // Always instantiate entity in usecase, not repository
    return userData  // Returns plain object
  }
}
```

### UseCase Layer - Entity Instantiation
```typescript
export class GetUserUsecase implements IUsecase {
  async execute(input: GetUserInput): Promise<GetUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    
    if (!userData) {
      throw new ApiNotFoundException('userNotFound')
    }

    // Always create entity instance in usecase
    const user = new UserEntity(userData)
    
    // Entity handles all business logic
    if (user.isDeleted()) {
      throw new ApiNotFoundException('userNotFound')
    }

    return { user: user.toObject() }
  }
}

export class UpdateUserUsecase implements IUsecase {
  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    const user = new UserEntity(userData)  // Instantiate entity
    
    // All business rules happen in entity
    const updatedUser = user.updateProfile(input.updates)
    
    // Convert back to plain object for persistence
    await this.userRepository.save(updatedUser)
    
    return { user: updatedUser.toObject() }
  }
}
```

### API Response Serialization
```typescript
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    const result = await this.getUserUsecase.execute({ userId: id })
    
    // toObject() already called in usecase
    return {
      success: true,
      data: result.user  // Already plain object from usecase
    }
  }

  @Post(':id/promote')
  async promoteUser(@Param('id') id: string): Promise<UserResponse> {
    const result = await this.promoteUserUsecase.execute({ userId: id })
    
    return {
      success: true,
      data: result.user  // Plain object for API response
    }
  }
}
```

### Event Publishing
```typescript
export class PromoteUserUsecase implements IUsecase {
  async execute(input: PromoteUserInput): Promise<PromoteUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    const user = new UserEntity(userData)  // Instantiate entity
    
    // Business logic handled by entity
    const promotedUser = user.makeAdmin()  // All validation inside entity
    
    await this.userRepository.save(promotedUser)

    // Publish event with plain object data
    await this.eventBus.publish('user.promoted', {
      userId: promotedUser.id,
      userData: promotedUser.toObject()  // Plain object for event payload
    })

    return { user: promotedUser.toObject() }
  }
}
```

## Core Method Usage Examples

### isActive() / isDeleted() - Status Checking

```typescript
export class GetUserProfileUsecase implements IUsecase {
  async execute(input: GetUserProfileInput): Promise<GetUserProfileOutput> {
    const userData = await this.userRepository.findById(input.userId)
    
    if (!userData) {
      throw new ApiNotFoundException('userNotFound')
    }

    // Always instantiate entity to check business rules
    const user = new UserEntity(userData)
    
    // Entity handles business logic for status checking
    if (user.isDeleted()) {
      throw new ApiNotFoundException('userNotFound', {
        context: 'GetUserProfileUsecase.execute',
        details: [{ userId: input.userId, reason: 'User has been deactivated' }]
      })
    }
    
    return { user: user.toObject() }
  }
}

export class ListActiveUsersUsecase implements IUsecase {
  async execute(): Promise<ListActiveUsersOutput> {
    const usersData = await this.userRepository.findAll()
    
    // Instantiate entities and use business logic
    const users = usersData.map(data => new UserEntity(data))
    const activeUsers = users.filter(user => user.isActive())

    return { 
      users: activeUsers.map(user => user.toObject()) 
    }
  }
}
```

### activate() / deactivate() - Soft Delete

```typescript
export class DeactivateUserUsecase implements IUsecase {
  async execute(input: DeactivateUserInput): Promise<DeactivateUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    const user = new UserEntity(userData)
    
    // Entity handles the deactivation business logic
    const deactivatedUser = user.deactivate()
    await this.userRepository.save(deactivatedUser)

    // Publish deactivation event
    await this.eventBus.publish('user.deactivated', {
      userId: user.id,
      deactivatedAt: deactivatedUser.deletedAt
    })

    return { user: deactivatedUser.toObject() }
  }
}

export class ReactivateUserUsecase implements IUsecase {
  async execute(input: ReactivateUserInput): Promise<ReactivateUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    const user = new UserEntity(userData)
    
    // Entity handles the reactivation business logic
    const activatedUser = user.activate()
    await this.userRepository.save(activatedUser)

    return { user: activatedUser.toObject() }
  }
}
```

### ensureID() - ID Generation

```typescript
export class UserEntity extends BaseEntity<UserEntityProps>() {
  constructor(entity: UserEntityProps) {
    super(userEntitySchema)
    this.validate(entity)
    
    // Automatically generate ID if not provided
    this.ensureID()  // Uses UUID by default
  }

  static createNew(userData: Omit<UserEntityProps, 'id' | 'createdAt'>): UserEntity {
    return new UserEntity({
      ...userData,
      id: '', // Will be generated by ensureID()
      createdAt: new Date()
    })
  }
}

// Usage in service
export class UserService {
  async createUser(input: CreateUserInput): Promise<UserEntity> {
    // ID is automatically generated
    const user = UserEntity.createNew({
      name: input.name,
      email: input.email,
      role: 'user'
    })

    return await this.userRepository.save(user)
  }
}
```

### clone() - Entity Duplication

```typescript
export class UserService {
  async duplicateUserAsTemplate(userId: string, newEmail: string): Promise<UserEntity> {
    const originalUser = await this.userRepository.findById(userId)
    
    // Clone the user with modifications
    const clonedUser = originalUser.clone()
    const newUser = clonedUser.merge({
      id: IDGeneratorUtils.uuid(),  // New ID
      email: newEmail,              // New email
      createdAt: new Date(),        // New creation date
      updatedAt: undefined,         // Reset update date
      deletedAt: null               // Ensure it's active
    })

    return await this.userRepository.save(newUser)
  }
}
```

### merge() - Immutable Updates

```typescript
export class UserService {
  async updateUserProfile(userId: string, updates: Partial<UserEntityProps>): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId)
    
    // Create new instance with merged data
    const updatedUser = user.merge({
      ...updates,
      updatedAt: new Date()  // Always update timestamp
    })

    // Validate the merged result
    updatedUser.validate(updatedUser.toObject())
    
    return await this.userRepository.save(updatedUser)
  }

  async promoteToAdmin(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId)
    
    // Immutable update to admin role
    const adminUser = user.merge({
      role: 'admin',
      updatedAt: new Date()
    })

    await this.eventBus.publish('user.promoted', {
      userId: user.id,
      oldRole: user.toObject().role,
      newRole: 'admin'
    })

    return await this.userRepository.save(adminUser)
  }
}
```

### nameOf() - Type-Safe Field Access

```typescript
export class UserService {
  async findUsersByField(fieldName: keyof UserEntityProps, value: string): Promise<UserEntity[]> {
    // Type-safe field name access
    const field = UserEntity.nameOf(fieldName)
    
    return await this.userRepository.findByField(field, value)
  }

  async validateEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    // Type-safe field reference
    const emailField = UserEntity.nameOf('email')
    
    const existingUser = await this.userRepository.findByField(emailField, email)
    
    if (!existingUser) return true
    if (excludeUserId && existingUser.id === excludeUserId) return true
    
    return false
  }
}
```

## Complete Entity Example

```typescript
export class OrderEntity extends BaseEntity<OrderEntityProps>() {
  constructor(entity: OrderEntityProps) {
    super(orderEntitySchema)
    this.validate(entity)
    this.ensureID()
  }

  // Domain methods using base functionality
  cancel(): OrderEntity {
    return this.merge({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    })
  }

  complete(): OrderEntity {
    if (this.isDeleted()) {
      throw new ApiUnprocessableEntityException('cannotCompleteDeletedOrder')
    }

    return this.merge({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    })
  }

  addItem(item: OrderItem): OrderEntity {
    const currentItems = this.toObject().items || []
    return this.merge({
      items: [...currentItems, item],
      total: this.calculateTotal([...currentItems, item]),
      updatedAt: new Date()
    })
  }

  // Usage in repository
  toDbFormat(): DbOrderData {
    const orderData = this.toObject()
    return {
      ...orderData,
      _id: orderData.id  // Map to MongoDB _id if needed
    }
  }
}
```

## Benefits of BaseEntity Architecture

### Consistency Across Entities
- **Standard interface** for all domain entities
- **Unified validation** using Zod schemas
- **Consistent ID management** across all entities
- **Standard soft delete** behavior

### Data Flow Optimization
- **toObject()** ensures clean serialization for APIs, databases, events
- **Immutable updates** with merge() prevent accidental mutations
- **Validation** ensures data integrity at entity level
- **Type safety** with nameOf() prevents field name typos

### Developer Experience  
- **Familiar patterns** across all entities in the codebase
- **Built-in functionality** reduces boilerplate in entity classes
- **Type-safe operations** with full TypeScript support
- **Clear separation** between domain logic and infrastructure concerns




## Domain Events

BaseEntity natively supports domain events, allowing entities to publish relevant events whenever a significant state change occurs. This enables integration between contexts, traceability, and the implementation of reactive patterns (DDD, Event Sourcing, etc).

### What are Domain Events?

A domain event is an asynchronous notification that represents a meaningful state change in an aggregate (entity or root). It captures something that has happened in the domain that other parts of the system may be interested in, such as "UserPromoted", "OrderCompleted", etc. Domain events are not direct actions—they are facts about the past, emitted after the aggregate's state has changed and committed.

**A domain event is:**
- An async message/fact about a state change in the aggregate (e.g., user promoted, order shipped)
- Used to decouple business logic and enable eventual consistency, integration, or side effects
- Emitted only after the aggregate's invariants and rules have been enforced

**A domain event is NOT:**
- A direct command to perform an external action (e.g., send email, call payment API)
- An infrastructure or application event (e.g., log entry, HTTP request, notification)
- A technical event unrelated to business meaning

For example, sending an email or calling an external service is not a domain event, but you may have a domain event like `UserPromoted` and then, in a separate handler, trigger the email or integration as a reaction to that event.

### How to use

**Adding an event:**

```typescript
user.addEvent({
  name: 'UserPromoted',
  payload: { userId: user.id, promotedAt: new Date() }
})
```

**Retrieving events:**

```typescript
const events = user.getEvents()
```

**Releasing (consuming) events:**

```typescript
const events = user.releaseEvents()
for (const event of events) {
  await eventBus.publish(event.name, event.payload)
}
```

### Best Practices

- Emit events only for relevant business changes (e.g., status, promotions, deletions, etc).
- Always consume and clear events after publishing them, using `releaseEvents()`.
- Use clear and standardized names for events (`UserPromoted`, `OrderCancelled`, etc).
- Include in the payload only the data necessary for the consumer context.
- Do not use events for internal entity logic, only for integration/communication.

### Complete Example

```typescript
export class PromoteUserUsecase implements IUsecase {
  async execute(input: PromoteUserInput): Promise<PromoteUserOutput> {
    const userData = await this.userRepository.findById(input.userId)
    const user = new UserEntity(userData)
    const promotedUser = user.makeAdmin()
    promotedUser.addEvent({
      name: 'UserPromoted',
      payload: { userId: promotedUser.id, promotedAt: new Date() }
    })
    await this.userRepository.save(promotedUser)
    // Publish and clear events
    for (const event of promotedUser.releaseEvents()) {
      await this.eventBus.publish(event.name, event.payload)
    }
    return { user: promotedUser.toObject() }
  }
}
```

---

### Production Benefits
- **Automatic ID generation** prevents missing identifiers
- **Soft delete** preserves data integrity and audit trails
- **Validation** catches data issues at the entity level
- **Clean serialization** prevents circular references and unwanted fields
