export class TextUtils {
  static snakeCase = (text: string) => {
    return text
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('_');
  };

  static capitalizeFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  static removeAccentsFromString = (text: string): string => {
    return text
      ? text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      : text;
  };

  static formatCapitalizeText = (text: string, matchLength = 4) => {
    const textList = text.split(' ');

    const NO_SPACE = 1;

    if (textList.length === NO_SPACE) {
      if (text.length >= matchLength) {
        return TextUtils.capitalizeFirstLetter(text);
      }

      return text;
    }

    const fullText = textList.reduce((accumulator, currentValue) => {
      if (accumulator.length >= matchLength) {
        accumulator = `${accumulator.charAt(0).toUpperCase()}${accumulator.slice(1)}`;
      }
      if (currentValue.length >= matchLength) {
        currentValue = `${currentValue.charAt(0).toUpperCase()}${currentValue.slice(1)}`;
      }
      return `${accumulator} ${currentValue}`.trim();
    });

    return fullText;
  };
}
