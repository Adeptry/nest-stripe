import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import pRetry from "p-retry";
import Stripe from "stripe";
import { NestStripeConfig } from "./nest-stripe.config.js";

/**
 * Provides Stripe service for NestJS.
 *
 * @class NestStripeService
 */
@Injectable()
export class NestStripeService {
  private readonly logger = new Logger(NestStripeService.name);

  readonly client: Stripe;

  constructor(
    @Inject(NestStripeConfig.KEY)
    private config: ConfigType<typeof NestStripeConfig>
  ) {
    this.logger.verbose(this.constructor.name);

    this.client = new Stripe(this.config.apiKey, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      apiVersion: null,
    });
  }

  /**
   * Retries the provided Stripe function or throws an error if unsuccessful.
   *
   * @template T The type of value returned by the Stripe function.
   * @param {(stripe: Stripe) => Promise<T>} stripeFn - A function that takes a Stripe client and returns a Promise.
   * @returns {Promise<T>} A Promise that resolves to the value returned by stripeFn or rejects if unsuccessful.
   */
  retryOrThrow<T>(stripeFn: (stripe: Stripe) => Promise<T>): Promise<T> {
    this.logger.verbose(this.retryOrThrow.name);
    return this.pRetryOrThrow(() => stripeFn(this.client));
  }

  private async pRetryOrThrow<T>(fn: () => Promise<T>): Promise<T> {
    this.logger.verbose(this.pRetryOrThrow.name);
    return pRetry(fn, {
      onFailedAttempt: (error) => {
        this.logger.error(error);
        if (error instanceof Stripe.errors.StripeAPIError) {
          const statusCode = error.statusCode ?? 0;
          const isRetryable =
            statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ||
            statusCode === HttpStatus.TOO_MANY_REQUESTS;

          if (!isRetryable || error.retriesLeft === 0) {
            this.logger.error(this.pRetryOrThrow.name, error);
            throw new InternalServerErrorException(error);
          }
        } else {
          throw error;
        }
      },
    });
  }
}
