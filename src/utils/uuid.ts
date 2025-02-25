import { v4 as uuidv4 } from 'uuid';

export class UUIDUtils {
  static create() {
    return uuidv4();
  }

  static isUUID = (uuid: string) => {
    const regex = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
    const isUUID = new RegExp(regex).exec(uuid) || [];

    return isUUID.length > 0;
  };
}
