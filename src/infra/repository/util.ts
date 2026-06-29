import { HttpStatus } from '@nestjs/common'
import { DefaultNamingStrategy, FindOptionsRelations, NamingStrategyInterface, Table } from 'typeorm'

import { CollectionUtil } from '@/utils/collection'
import { ApiBadRequestException, BaseException, MessageType, ParametersType } from '@/utils/exception'

import { DatabaseOperationCommand, DatabaseOperationEnum, JoinType } from './types'

export const validateFindByCommandsFilter = <T>(filterList: DatabaseOperationCommand<T>[]) => {
  const groupList = CollectionUtil.groupBy<DatabaseOperationCommand<T>>(filterList, 'property')

  for (const key in groupList) {
    const commands = groupList[`${key}`].map((g) => g.command)
    const isLikeAndNotAllowedOperation = commands.filter(
      (g) => g === DatabaseOperationEnum.CONTAINS || g === DatabaseOperationEnum.NOT_CONTAINS
    )

    const NOT_ALLOWED_COMBINATION = 2

    if (isLikeAndNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
      throw new ApiBadRequestException(
        `it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`
      )
    }

    const isEqualNotAllowedOperation = commands.filter(
      (g) => g === DatabaseOperationEnum.EQUAL || g === DatabaseOperationEnum.NOT_EQUAL
    )

    if (isEqualNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
      throw new ApiBadRequestException(
        `it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`
      )
    }
  }
}

export const createRelations = <T>(joins?: JoinType<T>): FindOptionsRelations<T> => {
  if (!joins) return {}

  const relations: FindOptionsRelations<T> = {}

  for (const key in joins) {
    if (!joins.hasOwnProperty(key)) continue

    const value = joins[key as keyof JoinType<T>]
    const propertyKey = key as keyof T

    if (value === true || Array.isArray(value)) {
      relations[propertyKey] = true as FindOptionsRelations<T>[keyof T]
    }
  }

  return relations
}

export const handleDatabaseError = ({ error, context }: { error: unknown; context: string }): ApiDatabaseException => {
  return new ApiDatabaseException((error as Error).message ?? String(error), {
    originalError: error,
    context,
    stack: (error as Error).stack
  })
}

export class ApiDatabaseException extends BaseException {
  static STATUS = HttpStatus.INTERNAL_SERVER_ERROR
  constructor(message: MessageType, parameters: ParametersType) {
    super(message, ApiDatabaseException.STATUS, parameters)
  }
}

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  private snakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .toLowerCase()
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    if (customName) return customName
    const prefix = embeddedPrefixes.length > 0 ? this.snakeCase(embeddedPrefixes.join('_')) + '_' : ''
    return prefix + this.snakeCase(propertyName)
  }

  tableName(className: string, customName: string): string {
    return customName || this.snakeCase(className.replace(/Schema$/, ''))
  }

  relationName(propertyName: string): string {
    return this.snakeCase(propertyName)
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.snakeCase(relationName + '_' + referencedColumnName)
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return this.snakeCase(firstTableName + '_' + secondTableName)
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.snakeCase(tableName + '_' + (columnName || propertyName))
  }

  joinTableInverseColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.snakeCase(tableName + '_' + (columnName || propertyName))
  }

  indexName(tableOrName: Table, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name
    const columns = columnNames.join('_')
    return `IDX_${tableName}_${columns}`
  }
}
