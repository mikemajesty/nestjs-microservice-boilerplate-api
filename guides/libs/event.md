# Event Service

Simple **pub/sub event system** using NestJS EventEmitter2. Enables decoupled communication between services through events.

## The Problem

```
❌ Without Events:
- Services tightly coupled
- Direct method calls create dependencies
- Hard to extend functionality

✅ With Events:
- Loose coupling between services
- Easy to add new listeners
- Async processing
```

## How It Works

```
┌─────────────────┐         ┌─────────────────┐
│    Publisher    │  emit   │   EventEmitter  │
│   (Any Service) │────────▶│    (Event Bus)  │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌──────────┐     ┌──────────┐     ┌──────────┐
             │ Listener │     │ Listener │     │ Listener │
             │    A     │     │    B     │     │    C     │
             └──────────┘     └──────────┘     └──────────┘
```

## Event Names

```typescript
// src/libs/event/types.ts
export enum EventNameEnum {
  SEND_EMAIL = 'send-email'
}
```

## API Usage

### Emitting Events

```typescript
@Injectable()
export class UserService {
  constructor(private readonly event: IEventAdapter) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const user = await this.userRepository.create(input)

    // Emit event - fire and forget
    this.event.emit(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Welcome!',
      template: 'welcome',
      payload: { name: user.name }
    })

    return user
  }
}
```

### Listening to Events

```typescript
import { OnEvent } from '@nestjs/event-emitter'

@Injectable()
export class EmailService {
  @OnEvent(EventNameEnum.SEND_EMAIL)
  async handleSendEmail(payload: SendEmailInput) {
    await this.send(payload)
    this.logger.info({ message: 'email sent successfully' })
  }
}
```

## Adding New Events

### 1. Add to Enum

```typescript
// src/libs/event/types.ts
export enum EventNameEnum {
  SEND_EMAIL = 'send-email',
  USER_CREATED = 'user-created',
  ORDER_PLACED = 'order-placed'
}
```

### 2. Emit Event

```typescript
this.event.emit(EventNameEnum.USER_CREATED, { userId: user.id })
```

### 3. Create Listener

```typescript
@OnEvent(EventNameEnum.USER_CREATED)
async onUserCreated(payload: { userId: string }) {
  // Handle event
}
```

## Summary

| Feature | Description |
|---------|-------------|
| **Pattern** | Pub/Sub with EventEmitter2 |
| **Emit** | `event.emit(EventNameEnum.X, payload)` |
| **Listen** | `@OnEvent(EventNameEnum.X)` decorator |
| **Async** | Non-blocking, fire and forget |

**Event Service** - *Decoupled service communication through events.*
