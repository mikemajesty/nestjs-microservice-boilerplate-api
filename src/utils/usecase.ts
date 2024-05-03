export interface IUsecase {
  execute(...input: unknown[]): Promise<unknown>;
}
