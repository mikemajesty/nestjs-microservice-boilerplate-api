import { NormalizeTypeOrmFilter } from '../filter/typeorm/normalize-typeorm-filter.decorator'

describe(NormalizeTypeOrmFilter.name, () => {
  it('should add an IsNull soft-delete condition to each OR filter without mutating input', () => {
    let received: Record<string, unknown>[] = []
    const filters = [{ name: 'active' }, { email: 'active@example.com' }]

    class TestRepository {
      @NormalizeTypeOrmFilter()
      find(where: Record<string, unknown>[]) {
        received = where
      }
    }

    new TestRepository().find(filters)

    expect(received).toHaveLength(2)
    expect(received[0]).toMatchObject({ name: 'active', deletedAt: { _type: 'isNull' } })
    expect(received[1]).toMatchObject({ email: 'active@example.com', deletedAt: { _type: 'isNull' } })
    expect(filters).toEqual([{ name: 'active' }, { email: 'active@example.com' }])
  })

  it('should normalize a filter at the configured argument index', () => {
    let received: Record<string, unknown> | undefined

    class TestRepository {
      @NormalizeTypeOrmFilter(1)
      find(_fields: string[], where?: Record<string, unknown>) {
        received = where
      }
    }

    new TestRepository().find(['name'], { name: 'active' })

    expect(received).toMatchObject({ name: 'active', deletedAt: { _type: 'isNull' } })
  })
})
