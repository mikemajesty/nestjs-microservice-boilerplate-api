export type TranslateOptions = {
  args?:
    | (
        | {
            [k: string]: unknown;
          }
        | string
      )[]
    | {
        [k: string]: unknown;
      };
  defaultValue?: string;
  debug?: boolean;
};
