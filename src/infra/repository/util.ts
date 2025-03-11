import { CollectionUtil } from '@/utils/collection';
import { ApiBadRequestException } from '@/utils/exception';

import { DatabaseOperationCommand, DatabaseOperationEnum } from './types';

export const validateFindByCommandsFilter = <T>(filterList: DatabaseOperationCommand<T>[]) => {
  const groupList = CollectionUtil.groupBy<DatabaseOperationCommand<T>>(filterList, 'property');

  for (const key in groupList) {
    const commands = groupList[`${key}`].map((g) => g.command);
    const isLikeAndNotAllowedOperation = commands.filter(
      (g) => g === DatabaseOperationEnum.CONTAINS || g === DatabaseOperationEnum.NOT_CONTAINS
    );

    const NOT_ALLOWED_COMBINATION = 2;

    if (isLikeAndNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
      throw new ApiBadRequestException(
        `it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`
      );
    }

    const isEqualNotAllowedOperation = commands.filter(
      (g) => g === DatabaseOperationEnum.EQUAL || g === DatabaseOperationEnum.NOT_EQUAL
    );

    if (isEqualNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
      throw new ApiBadRequestException(
        `it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`
      );
    }
  }
};
