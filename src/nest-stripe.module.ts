import { DynamicModule, Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NestStripeAsyncOptions } from "./nest-stripe-async-options.js";
import {
  NEST_STRIPE_CONFIG_INJECTION_KEY,
  NestStripeConfig,
  NestStripeConfigType,
} from "./nest-stripe.config.js";
import { NestStripeService } from "./nest-stripe.service.js";

@Global()
@Module({})
export class NestStripeModule {
  static fromEnv(): DynamicModule {
    return {
      module: NestStripeModule,
      imports: [ConfigModule.forFeature(NestStripeConfig)],
      providers: [
        NestStripeService,
        {
          provide: NEST_STRIPE_CONFIG_INJECTION_KEY,
          useFactory: (config: ConfigService) =>
            config.get<NestStripeConfigType>("stripe"),
          inject: [ConfigService],
        },
      ],
      exports: [NestStripeService],
    };
  }

  static forRoot(options: NestStripeConfigType): DynamicModule {
    return {
      module: NestStripeModule,
      providers: [
        NestStripeService,
        {
          provide: NEST_STRIPE_CONFIG_INJECTION_KEY,
          useValue: options,
        },
      ],
      exports: [NestStripeService],
    };
  }

  static forRootAsync(options: NestStripeAsyncOptions): DynamicModule {
    return {
      module: NestStripeModule,
      imports: [...(options.imports || [])],
      providers: [
        NestStripeService,
        {
          provide: NEST_STRIPE_CONFIG_INJECTION_KEY,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [NestStripeService],
    };
  }
}
