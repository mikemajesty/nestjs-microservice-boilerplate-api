export const skipParentheses = (filter: string) => {
  return filter?.replace('(', '\\(')?.replace(')', '\\)');
};
