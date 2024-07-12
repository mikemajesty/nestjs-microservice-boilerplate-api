import { z } from 'zod';

import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { UserRequest } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { IUserRepository } from '../repository/user';

export const RefreshTokenSchema = z.object({ refreshToken: z.string().trim().min(1) });

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenOutput = { accessToken: string; refreshToken: string };

export class RefreshTokenUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter
  ) {}

  @ValidateSchema(RefreshTokenSchema)
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const userToken = await this.tokenService.verify<{ userId: string }>(input.refreshToken);

    if (!userToken.userId) {
      throw new ApiBadRequestException('incorrectToken');
    }

    const user = await this.userRepository.findOneWithRelation(
      {
        id: userToken.userId
      },
      { role: true }
    );

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    if (!user.role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const { token } = this.tokenService.sign({
      email: user.email,
      name: user.name,
      role: user.role.name
    } as UserRequest);

    const { token: refreshToken } = this.tokenService.sign({ userId: user.id });

    return { accessToken: token, refreshToken: refreshToken };
  }
}
