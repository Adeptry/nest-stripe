import { registerAs } from "@nestjs/config";
import { plainToClass } from "class-transformer";
import { IsString, validateSync } from "class-validator";

export const NEST_STRIPE_CONFIG_INJECTION_KEY = "NEST_STRIPE_CONFIG";

export type NestStripeConfigType = {
  apiKey: string;
};

class StripeConfigValidator {
  @IsString()
  STRIPE_API_KEY!: string;
}

export const NestStripeConfig = registerAs<NestStripeConfigType>(
  "stripe",
  () => {
    const errors = validateSync(
      plainToClass(StripeConfigValidator, process.env, {
        enableImplicitConversion: true,
      }),
      {
        skipMissingProperties: false,
      }
    );

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      apiKey: process.env.STRIPE_API_KEY!,
    };
  }
);
