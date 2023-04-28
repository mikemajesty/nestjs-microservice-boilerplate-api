import { ApiBadRequestException } from './../../exception';
export function ValidateDatabaseSortAllowed(allowedSortList: string[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const input = args[0];

      const sort = {};

      Object.keys(input.sort || {}).forEach((key) => {
        const allowed = allowedSortList.includes(key);
        if (!allowed) throw new ApiBadRequestException(`allowed sorts are: ${allowedSortList.join(', ')}`);
      });

      for (const allowedFilter of allowedSortList) {
        if (!input.sort) continue;
        const filter = input.sort[allowedFilter];
        if (filter) {
          sort[allowedFilter] = filter;
        }
      }

      args[0].sort = sort;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
