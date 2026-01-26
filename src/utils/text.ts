/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/text.md
 */
export class TextUtils {
  /**
   * Converts a string to snake_case.
   * @param text Input text. Example: 'MyText Value'
   * @returns Text in snake_case. Example: 'my_text_value'
   */
  static snakeCase = (text: string): string => {
    if (!text) return ''

    return text
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
  }

  /**
   * Capitalizes the first letter of a string.
   * @param text Input text. Example: 'hello world'
   * @returns Text with the first letter capitalized. Example: 'Hello world'
   */
  static capitalizeFirstLetter = (text: string = ''): string => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  /**
   * Removes accents from a string.
   * @param text Input text. Example: 'ação'
   * @returns Text without accents. Example: 'acao'
   */
  static removeAccents = (text: string = ''): string => {
    return text
      ? text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      : text
  }

  /**
   * Converts a string to a slug (lowercase, no accents, hyphen-separated).
   * @param text Input text. Example: 'Hello World!'
   * @returns Slug generated from the text. Example: 'hello-world'
   */
  static slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
