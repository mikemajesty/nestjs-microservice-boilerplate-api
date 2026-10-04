# Date

Centralized date manipulation utility that handles timezone-aware operations, consistent formatting, and date calculations throughout the entire application. Eliminates timezone confusion and ensures consistent date handling across all modules.

## Why Centralized Date Management is Essential

Working with dates in applications is **notoriously complex** due to:

- **Timezone confusion** between client, server, and database
- **Inconsistent formatting** across different parts of the app
- **Date arithmetic mistakes** leading to off-by-one errors
- **UTC vs local time** mixing causing bugs in production

DateUtils solves all of this by providing a **single source of truth** for date operations.

## Design Principles

### UTC by default, timezone by parameter

`DateUtils` **does not** read a global `APP_TIMEZONE` from the environment. Every date is handled in **UTC** by default, and any method that needs a different timezone accepts it **explicitly** as a parameter.

Why:

- **Deterministic**: same code, same result, regardless of server timezone.
- **Multi-tenant friendly**: different users can have different timezones.
- **No hidden state**: no `process.env.TZ` frozen at import time.
- **Testable**: tests don't need to mock environment variables.

```typescript
// Default: UTC
const iso = DateUtils.now<string>({ type: 'iso' })
// → '2026-09-17T12:00:00.000Z'

// Explicit timezone
const spTime = DateUtils.now<string>({ type: 'iso', timezone: 'America/Sao_Paulo' })
// → '2026-09-17T09:00:00.000-03:00'
```

### When to use a timezone

Only pass a `timezone` when the **user-facing output** needs it. Business logic and persistence should always use **UTC**.

| Layer                                | Timezone                         |
| ------------------------------------ | -------------------------------- |
| Database                             | UTC                              |
| Business logic / calculations        | UTC                              |
| API responses (ISO)                  | UTC                              |
| Formatted output for a specific user | User's timezone                  |
| Formatted output for the server      | UTC (or server's tz, explicitly) |

## API Reference

### `DateUtils.build<T>(input: BuildInput): T`

Parses a date and returns either an ISO string (formatted) or a `Date`.

```typescript
type BuildInput = {
  date?: Date | string
  format?: string
  timezone?: string
} & { type: 'iso' | 'js' | 'timestamp' }
```

| Field      | Default                                   | Description                                              |
| ---------- | ----------------------------------------- | -------------------------------------------------------- |
| `date`     | `new Date()`                              | Date to parse. Accepts `Date` or ISO string.             |
| `format`   | `process.env.DATE_FORMAT ?? 'yyyy-MM-dd'` | Luxon format string (only used when `type: 'iso'`).      |
| `timezone` | `'utc'`                                   | Target timezone. Must be a valid IANA zone.              |
| `type`     | —                                         | `'iso'` returns formatted string; `'js'` returns `Date`. |

Throws `ApiInternalServerException` if the date string is invalid or the timezone is unknown.

```typescript
// Formatted string in UTC
DateUtils.build<string>({
  date: '2026-09-17T12:00:00Z',
  format: 'dd/MM/yyyy HH:mm',
  type: 'iso'
})
// → '17/09/2026 12:00'

// Formatted string in a specific timezone
DateUtils.build<string>({
  date: new Date(),
  format: 'dd/MM/yyyy HH:mm',
  timezone: 'America/Sao_Paulo',
  type: 'iso'
})
// → '17/09/2026 09:00'

// Native Date in UTC
DateUtils.build<Date>({
  date: '2026-09-17T12:00:00Z',
  type: 'js'
})
```

### `DateUtils.now<T>(input?: NowInput): T`

Returns the current date, in UTC by default.

```typescript
type NowInput = {
  timezone?: string
} & { type: 'iso' | 'js' | 'timestamp' }
```

```typescript
DateUtils.now<string>({ type: 'iso' })
// → '2026-09-17T12:00:00.000Z'

DateUtils.now<Date>({ type: 'js' })
// → Date object

DateUtils.now<string>({ type: 'iso', timezone: 'America/Sao_Paulo' })
// → '2026-09-17T09:00:00.000-03:00'
```

### `DateUtils.asLuxonDate(date?, timezone?): DateTime`

Returns a Luxon `DateTime` converted to the given timezone (UTC by default). Useful when you need Luxon's full API (`diff`, `toFormat`, `plus`, etc).

```typescript
const dt = DateUtils.asLuxonDate(new Date(), 'America/Sao_Paulo')
dt.toFormat('dd/MM/yyyy HH:mm')
```

### `DateUtils.isAfter(date, compareTo): boolean`

```typescript
if (DateUtils.isAfter(appointmentDate, now)) {
  /* ... */
}
```

### `DateUtils.isBefore(date, compareTo): boolean`

```typescript
if (DateUtils.isBefore(appointmentDate, now)) {
  /* ... */
}
```

### `DateUtils.addDays(date, days): Date`

```typescript
const followUp = DateUtils.addDays(appointmentDate, 7)
```

### `DateUtils.subtractDays(date, days): Date`

```typescript
const reminder = DateUtils.subtractDays(appointmentDate, 1)
```

### `DateUtils.isValidTimezone(timezone): boolean`

Validates an IANA timezone string. Use before passing a user-provided timezone into any other method.

```typescript
if (!DateUtils.isValidTimezone(input.timezone)) {
  throw new ApiBadRequestException('invalidTimezone')
}
```

## Usage Examples

### Business Hours and Scheduling

```typescript
export class AppointmentService {
  async scheduleAppointment(input: ScheduleInput): Promise<AppointmentOutput> {
    const now = DateUtils.now<Date>({ type: 'js' })
    const appointmentDate = DateUtils.build<Date>({
      date: input.requestedDate,
      type: 'js'
    })

    if (DateUtils.isBefore(appointmentDate, now)) {
      throw new ApiBadRequestException('appointmentInPast', {
        context: 'AppointmentService.scheduleAppointment',
        details: [
          {
            requestedDate: DateUtils.build<string>({
              date: appointmentDate,
              format: 'dd/MM/yyyy HH:mm',
              type: 'iso'
            }),
            currentDate: DateUtils.build<string>({
              date: now,
              format: 'dd/MM/yyyy HH:mm',
              type: 'iso'
            })
          }
        ]
      })
    }

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
    const startDate = DateUtils.build<Date>({
      date: `${year}-${month.padStart(2, '0')}-01T00:00:00Z`,
      type: 'js'
    })

    const endDate = DateUtils.build<Date>({
      date: `${year}-${month.padStart(2, '0')}-01T00:00:00Z`,
      type: 'js'
    })

    const lastDay = DateUtils.addDays(DateUtils.subtractDays(DateUtils.addDays(endDate, 32), endDate.getUTCDate()), 1)

    const transactions = await this.transactionRepository.findByDateRange(startDate, lastDay)

    return {
      report: {
        period: DateUtils.build<string>({
          date: startDate,
          format: 'MMMM yyyy',
          type: 'iso'
        }),
        generated: DateUtils.build<string>({
          format: 'dd/MM/yyyy HH:mm:ss',
          type: 'iso'
        }),
        transactions: transactions.map((t) => ({
          ...t.toObject(),
          dateFormatted: DateUtils.build<string>({
            date: t.createdAt,
            format: 'dd/MM/yyyy',
            type: 'iso'
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

    const now = DateUtils.now<Date>({ type: 'js' })
    const expiresAt = entity.toObject().expiresAt

    const warningDate = DateUtils.subtractDays(expiresAt, 3)

    if (DateUtils.isAfter(now, warningDate) && DateUtils.isBefore(now, expiresAt)) {
      await this.emailService.sendRenewalWarning({
        userId: entity.toObject().userId,
        expiresOn: DateUtils.build<string>({
          date: expiresAt,
          format: 'dd/MM/yyyy',
          type: 'iso'
        })
      })
    }

    const nextBillingDate = DateUtils.addDays(expiresAt, 30)
    const renewedSubscription = entity.renew(nextBillingDate)

    await this.subscriptionRepository.save(renewedSubscription)

    return {
      subscription: renewedSubscription.toObject(),
      nextBilling: DateUtils.build<string>({
        date: nextBillingDate,
        format: 'dd/MM/yyyy',
        type: 'iso'
      })
    }
  }
}
```

### Age Calculation and Validation

```typescript
export class UserRegistrationService {
  async validateUserAge(birthDate: string): Promise<boolean> {
    const birth = DateUtils.build<Date>({ date: birthDate, type: 'js' })
    const now = DateUtils.now<Date>({ type: 'js' })

    const age = DateUtils.asLuxonDate(now).diff(DateUtils.asLuxonDate(birth), 'years').years

    if (age < 18) {
      throw new ApiBadRequestException('userTooYoung', {
        context: 'UserRegistrationService.validateUserAge',
        details: [
          {
            age: Math.floor(age),
            birthDate: DateUtils.build<string>({
              date: birth,
              format: 'dd/MM/yyyy',
              type: 'iso'
            }),
            minimumAge: 18
          }
        ]
      })
    }

    return true
  }
}
```

## Multi-Timezone Support

When the app serves users across different timezones, the timezone must come from the **user/request context**, not from a global env var. Store all dates in **UTC** and convert only at the edges.

```typescript
export class GlobalEventService {
  async scheduleGlobalEvent(input: GlobalEventInput): Promise<EventOutput> {
    const organizerTimezone = input.organizerTimezone ?? 'UTC'

    if (!DateUtils.isValidTimezone(organizerTimezone)) {
      throw new ApiBadRequestException('invalidTimezone', {
        details: [{ providedTimezone: organizerTimezone }]
      })
    }

    const eventDate = DateUtils.asLuxonDate(input.eventDateTime, organizerTimezone).toUTC().toJSDate()

    const event = new EventEntity({
      title: input.title,
      scheduledAt: eventDate,
      organizerTimezone
    })

    const participants = await this.getEventParticipants(input.participantIds)

    const notificationData = participants.map((participant) => ({
      userId: participant.id,
      eventTime: DateUtils.build<string>({
        date: eventDate,
        format: 'dd/MM/yyyy HH:mm',
        timezone: participant.timezone,
        type: 'iso'
      }),
      timezone: participant.timezone
    }))

    return {
      event: event.toObject(),
      participantNotifications: notificationData
    }
  }
}
```

## Locale-Aware Formatting

Formatting is a **presentation concern**. Keep the locale in the user context, and build the format string accordingly.

```typescript
export class NotificationService {
  async sendDateBasedNotification(userId: string, date: Date): Promise<void> {
    const user = await this.userRepository.findById(userId)
    const userEntity = new UserEntity(user)
    const locale = userEntity.toObject().locale ?? 'pt-BR'

    const dateFormat =
      {
        'pt-BR': 'dd/MM/yyyy HH:mm',
        'en-US': 'MM/dd/yyyy hh:mm a',
        'en-GB': 'dd/MM/yyyy HH:mm'
      }[locale] ?? 'yyyy-MM-dd HH:mm'

    const formattedDate = DateUtils.build<string>({
      date,
      format: dateFormat,
      timezone: userEntity.toObject().timezone,
      type: 'iso'
    })

    await this.emailService.send({
      to: userEntity.toObject().email,
      template: 'date-notification',
      data: {
        userName: userEntity.toObject().name,
        eventDate: formattedDate,
        timezone: userEntity.toObject().timezone
      }
    })
  }
}
```

## Environment Configuration

`DateUtils` no longer reads a global `APP_TIMEZONE`. Only `DATE_FORMAT` is read from the environment, and it's used as the **default format** when none is provided.

```env
# .env
DATE_FORMAT=dd/MM/yyyy
```

| Variable      | Default        | Purpose                                                   |
| ------------- | -------------- | --------------------------------------------------------- |
| `DATE_FORMAT` | `'yyyy-MM-dd'` | Default Luxon format string for `build({ type: 'iso' })`. |

Timezones are **always** passed explicitly. There is no `TZ` or `APP_TIMEZONE` configuration at the utility level.

## Benefits of Centralized Date Management

### Consistency Across Teams

- **Same methods** used by all developers
- **UTC by default** eliminates timezone bugs
- **Explicit timezones** at the edges, where they belong
- **No hidden environment state**

### Production Reliability

- **Deterministic behavior** regardless of server timezone
- **Date arithmetic** tested once, reused everywhere
- **Locale-aware formatting** for international users
- **No environment-based surprises**

### Developer Experience

- **Simple API** for common date operations
- **Timezone validation** prevents invalid input
- **Luxon integration** provides powerful date manipulation
- **Type safety** with clear input/output types

### Maintenance Benefits

- **Single place** to update date logic across the entire app
- **Easy debugging** when date issues occur
- **Consistent testing** with predictable date behavior
- **Future extensibility** for new date features

## Migration Notes

If you're coming from the previous version of `DateUtils`:

| Old                                                   | New                                                      |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `process.env.TZ` as global timezone                   | Timezone passed explicitly per call                      |
| `DateUtils.getJSDate()`                               | `DateUtils.now<Date>({ type: 'js' })`                    |
| `DateUtils.getISODateString()`                        | `DateUtils.now<string>({ type: 'iso' })`                 |
| `DateUtils.createJSDate({ date })`                    | `DateUtils.build<Date>({ date, type: 'js' })`            |
| `DateUtils.getDateStringWithFormat({ date, format })` | `DateUtils.build<string>({ date, format, type: 'iso' })` |

## Summary

| Method                     | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `build<T>`                 | Parse + format a date (ISO string or `Date`)     |
| `now<T>`                   | Current date in UTC (or given timezone)          |
| `asLuxonDate`              | Get a Luxon `DateTime` for advanced manipulation |
| `isAfter` / `isBefore`     | Compare two dates                                |
| `addDays` / `subtractDays` | Date arithmetic                                  |
| `isValidTimezone`          | Validate IANA timezone strings                   |

**Default timezone:** `UTC`. **Configurable timezone:** via explicit parameter. **Configurable format:** via `DATE_FORMAT` env var or per-call `format`.
