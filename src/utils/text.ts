export class TextUtils {
  static snakeCase = (text: string): string => {
    if (!text) return '';

    return text
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_');
  };

  static capitalizeFirstLetter = (text: string = '') => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  static removeAccents = (text: string = ''): string => {
    return text
      ? text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      : text;
  };

  static slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
}
