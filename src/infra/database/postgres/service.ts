import { TypeOrmModuleOptions } from '@nestjs/typeorm'

import { name } from '../../../../package.json'
import { IDataBaseAdapter } from '../adapter'
import { ConnectionType } from '../types'

export class PostgresService implements Partial<IDataBaseAdapter> {
  getConnection<TOpt = TypeOrmModuleOptions & { url: string }>({ URI }: ConnectionType): TOpt {
    const postgresUrl = new URL(URI)
    const sslMode = postgresUrl.searchParams.get('sslmode')
    const requireSsl = sslMode === 'require'

    if (requireSsl) {
      postgresUrl.searchParams.delete('sslmode')
    }

    return {
      type: 'postgres',
      url: postgresUrl.toString(),
      database: name,
      ...(requireSsl && { ssl: { rejectUnauthorized: false } })
    } as TOpt
  }
}
