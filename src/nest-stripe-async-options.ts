import {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
  Type,
} from "@nestjs/common";
import { NestStripeConfigType } from "./nest-stripe.config";

export interface NestStripeAsyncOptions {
  imports?: (
    | Type<any>
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardReference<any>
  )[];
  useFactory: (
    ...args: any[]
  ) => Promise<NestStripeConfigType> | NestStripeConfigType;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}
