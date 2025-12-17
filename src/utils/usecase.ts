/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/usecase.md
 */
export interface IUsecase {
  execute(...input: unknown[]): Promise<unknown>
}
