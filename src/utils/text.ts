export class TextUtils {
  static snakeCase = (text: string) => {
    return text
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('_');
  };

  static capitalizeFirstLetter = (text: string = '') => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  static removeAccentsFromString = (text: string = ''): string => {
    return text
      ? text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      : text;
  };
}
