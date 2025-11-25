import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

export class UUIDUtils {
  static create(): string {
    return uuidv4();
  }

  static isUUID(uuid: string): boolean {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
  }
}
