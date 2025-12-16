# Date

Centralized date manipulation utility that handles timezone-aware operations, consistent formatting, and date calculations throughout the entire application. Eliminates timezone confusion and ensures consistent date handling across all modules.

## Why Centralized Date Management is Essential

Working with dates in applications is **notoriously complex** due to:
- **Timezone confusion** between client, server, and database
- **Inconsistent formatting** across different parts of the app  
- **Date arithmetic mistakes** leading to off-by-one errors
- **UTC vs local time** mixing causing bugs in production

DateUtils solves all of this by providing a **single source of truth** for date operations.

## Timezone Management - The Game Changer

### Automatic Timezone Handling

```typescript
// Environment configuration
process.env.TZ = 'America/Sao_Paulo'  // Your app timezone

export class OrderService {
  async createOrder(input: CreateOrderInput): Promise<OrderOutput> {
    const order = new OrderEntity({
      ...input,
      // Always use DateUtils for consistent timezone handling
      createdAt: DateUtils.getJSDate(),  // Automatically in São Paulo timezone
      deliveryDate: DateUtils.addDays(DateUtils.getJSDate(), 3)
    })

    await this.orderRepository.save(order)
    
    return {
      order: order.toObject(),
      // Formatted for Brazilian users
      createdAtFormatted: DateUtils.getDateStringWithFormat({
        date: order.createdAt,
        format: 'dd/MM/yyyy HH:mm'
      })
    }
  }
}
```

### Why This Matters

**Without DateUtils:**
```typescript
// ❌ WRONG: Different developers, different approaches
const date1 = new Date()                    // Local timezone (inconsistent)
const date2 = new Date().toISOString()      // UTC (good, but inconsistent usage)
const date3 = moment().format('YYYY-MM-DD') // Another library (inconsistent)
```

**With DateUtils:**
```typescript
// ✅ CORRECT: Consistent across entire application
const date1 = DateUtils.getJSDate()         // Always app timezone
const date2 = DateUtils.getISODateString()  // Always UTC format
const date3 = DateUtils.getDateStringWithFormat({ format: 'yyyy-MM-dd' })
```

## Useful Methods for Real Scenarios

### Business Hours and Scheduling

```typescript
export class AppointmentService {
  async scheduleAppointment(input: ScheduleInput): Promise<AppointmentOutput> {
    const now = DateUtils.getJSDate()
    const appointmentDate = DateUtils.createJSDate({ 
      date: input.requestedDate 
    })

    // Business rule validation with timezone-aware dates
    if (DateUtils.isBefore(appointmentDate, now)) {
      throw new ApiBadRequestException('appointmentInPast', {
        context: 'AppointmentService.scheduleAppointment',
        details: [{
          requestedDate: DateUtils.getDateStringWithFormat({
            date: appointmentDate,
            format: 'dd/MM/yyyy HH:mm'
          }),
          currentDate: DateUtils.getDateStringWithFormat({
            date: now,
            format: 'dd/MM/yyyy HH:mm'
          })
        }]
      })
    }

    // Calculate reminder dates
    const reminderDate = DateUtils.subtractDays(appointmentDate, 1)
    const followUpDate = DateUtils.addDays(appointmentDate, 7)

    return {
      appointment: {
        scheduledFor: appointmentDate,
        reminderAt: reminderDate,
        followUpAt: followUpDate
      }
    }
  }
}
```

### Report Generation with Date Ranges

```typescript
export class FinancialReportService {
  async generateMonthlyReport(month: string, year: string): Promise<ReportOutput> {
    // Parse user input consistently
    const startDate = DateUtils.createJSDate({
      date: `${year}-${month.padStart(2, '0')}-01T00:00:00`
    })
    
    const endDate = DateUtils.createJSDate({
      date: `${year}-${month.padStart(2, '0')}-01T00:00:00`
    })
    const lastDay = DateUtils.addDays(
      DateUtils.subtractDays(DateUtils.addDays(endDate, 32), endDate.getDate()), 
      1
    )

    const transactions = await this.transactionRepository.findByDateRange(
      startDate, 
      lastDay
    )

    return {
      report: {
        period: DateUtils.getDateStringWithFormat({
          date: startDate,
          format: 'MMMM yyyy'  // "Janeiro 2024"
        }),
        generated: DateUtils.getDateStringWithFormat({
          format: 'dd/MM/yyyy HH:mm:ss'
        }),
        transactions: transactions.map(t => ({
          ...t.toObject(),
          dateFormatted: DateUtils.getDateStringWithFormat({
            date: t.createdAt,
            format: 'dd/MM/yyyy'
          })
        }))
      }
    }
  }
}
```

### Subscription and Billing Logic

```typescript
export class SubscriptionService {
  async processSubscriptionRenewal(subscriptionId: string): Promise<RenewalOutput> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId)
    const entity = new SubscriptionEntity(subscription)

    const now = DateUtils.getJSDate()
    const expiresAt = entity.toObject().expiresAt

    // Check if subscription is about to expire (3 days warning)
    const warningDate = DateUtils.subtractDays(expiresAt, 3)
    
    if (DateUtils.isAfter(now, warningDate) && DateUtils.isBefore(now, expiresAt)) {
      // Send renewal warning
      await this.emailService.sendRenewalWarning({
        userId: entity.toObject().userId,
        expiresOn: DateUtils.getDateStringWithFormat({
          date: expiresAt,
          format: 'dd/MM/yyyy'
        })
      })
    }

    // Calculate next billing cycle
    const nextBillingDate = DateUtils.addDays(expiresAt, 30)
    
    const renewedSubscription = entity.renew(nextBillingDate)
    await this.subscriptionRepository.save(renewedSubscription)

    return {
      subscription: renewedSubscription.toObject(),
      nextBilling: DateUtils.getDateStringWithFormat({
        date: nextBillingDate,
        format: 'dd/MM/yyyy'
      })
    }
  }
}
```

### Age Calculation and Validation

```typescript
export class UserRegistrationService {
  async validateUserAge(birthDate: string): Promise<boolean> {
    const birth = DateUtils.createJSDate({ date: birthDate })
    const now = DateUtils.getJSDate()

    // Calculate age in years
    const birthDateTime = DateTime.fromJSDate(birth)
    const nowDateTime = DateTime.fromJSDate(now)
    const age = nowDateTime.diff(birthDateTime, 'years').years

    // Business rule: must be 18 or older
    if (age < 18) {
      throw new ApiBadRequestException('userTooYoung', {
        context: 'UserRegistrationService.validateUserAge',
        details: [{
          age: Math.floor(age),
          birthDate: DateUtils.getDateStringWithFormat({
            date: birth,
            format: 'dd/MM/yyyy'
          }),
          minimumAge: 18
        }]
      })
    }

    return true
  }
}
```

## Advanced Timezone Operations

### Multi-Timezone Support for Global Apps

```typescript
export class GlobalEventService {
  async scheduleGlobalEvent(input: GlobalEventInput): Promise<EventOutput> {
    // Event time in organizer's timezone
    const organizerTimezone = input.organizerTimezone || 'UTC'
    
    // Validate timezone
    if (!DateUtils.isValidTimezone(organizerTimezone)) {
      throw new ApiBadRequestException('invalidTimezone', {
        details: [{ providedTimezone: organizerTimezone }]
      })
    }

    // Create event in organizer timezone then convert to UTC for storage
    const eventDate = DateTime.fromISO(input.eventDateTime, { 
      zone: organizerTimezone 
    }).toUTC().toJSDate()

    const event = new EventEntity({
      title: input.title,
      scheduledAt: eventDate,  // Stored as UTC in database
      organizerTimezone
    })

    // For participants in different timezones
    const participants = await this.getEventParticipants(input.participantIds)
    
    const notificationData = participants.map(participant => ({
      userId: participant.id,
      eventTime: DateTime.fromJSDate(eventDate)
        .setZone(participant.timezone)
        .toFormat('dd/MM/yyyy HH:mm'),
      timezone: participant.timezone
    }))

    return {
      event: event.toObject(),
      participantNotifications: notificationData
    }
  }
}
```

### Date Formatting for Different Locales

```typescript
export class NotificationService {
  async sendDateBasedNotification(userId: string, date: Date): Promise<void> {
    const user = await this.userRepository.findById(userId)
    const userEntity = new UserEntity(user)
    
    // Format date according to user's locale preference
    const locale = userEntity.toObject().locale || 'pt-BR'
    
    let dateFormat: string
    switch (locale) {
      case 'pt-BR':
        dateFormat = 'dd/MM/yyyy HH:mm'
        break
      case 'en-US':
        dateFormat = 'MM/dd/yyyy hh:mm a'
        break
      case 'en-GB':
        dateFormat = 'dd/MM/yyyy HH:mm'
        break
      default:
        dateFormat = 'yyyy-MM-dd HH:mm'
    }

    const formattedDate = DateUtils.getDateStringWithFormat({
      date,
      format: dateFormat
    })

    await this.emailService.send({
      to: userEntity.toObject().email,
      template: 'date-notification',
      data: {
        userName: userEntity.toObject().name,
        eventDate: formattedDate,
        timezone: process.env.TZ
      }
    })
  }
}
```

## Environment Configuration

```typescript
// .env configuration
TZ=America/Sao_Paulo           // App timezone
DATE_FORMAT=dd/MM/yyyy         // Default date format

// Usage in different environments
// Development: TZ=America/Sao_Paulo
// Production: TZ=UTC (recommended for global apps)
// Testing: TZ=UTC (for consistent test results)
```

## Benefits of Centralized Date Management

### Consistency Across Teams
- **Same methods** used by all developers
- **Consistent timezone handling** preventing bugs
- **Standard formatting** across all features
- **Easy environment switching** (dev/prod timezones)

### Production Reliability  
- **Timezone bugs eliminated** through centralization
- **Date arithmetic errors** reduced with tested methods
- **Locale-aware formatting** for international users
- **Environment-based configuration** for different deployments

### Developer Experience
- **Simple API** for common date operations
- **Timezone validation** prevents invalid configurations
- **Luxon integration** provides powerful date manipulation
- **Type safety** with clear input/output types

### Maintenance Benefits
- **Single place** to update date logic across entire app
- **Easy debugging** when date issues occur
- **Consistent testing** with predictable date behavior
- **Future extensibility** for new date features