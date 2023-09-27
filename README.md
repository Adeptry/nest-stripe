# nest-stripe

Nest-Stripe is a NestJS module for integrating Stripe into your application. This module makes it easy to configure and use Stripe in a straightforward and idiomatic way.

## Features

- Easy-to-use Stripe service that can be injected into your classes.
- Environment, Synchronous, Asynchronous initialization.
- Retrying

## Installation

```bash
npm install nest-stripe @nestjs/common @nestjs/config stripe
```

Nest.js and Stripe are peer dependencies.

## Quick Start

```typescript
import { NestStripeModule } from "nest-stripe";

@Module({
  imports: [
    NestStripeModule.forRoot({
      apiKey: "your_stripe_api_key",
    }),
  ],
  controllers: [YourController],
})
export class YourModule {}
```

If you set `STRIPE_API_KEY`, you may:

```typescript
@Module({
  imports: [
    NestStripeModule.fromEnv(),
  ],
  controllers: [YourController],
})
```

Then, use the service:

```typescript
import { Controller, Get, Inject } from "@nestjs/common";
import { StripeService } from "nest-stripe";

@Controller("your-route")
export class YourController {
  constructor(
    @Inject(StripeService)
    private readonly stripeService: StripeService
  ) {}

  @Get()
  async yourRoute() {
    const session = await this.stripeService.retryOrThrow((stripe) =>
      stripe.billingPortal.sessions.create({
        customer: stripeId,
        return_url: returnUrl,
      })
    );
  }
}
```

If you do not want to use the retry higher-order-function, you may get a client directly.

### Retry

The `retryOrThrow` method provides a built-in retry mechanism for dealing with transient issues in your API calls. It retries the provided client function multiple times before eventually throwing an error if all attempts are unsuccessful. This packages uses the default configuration of `p-retry`, and only retries HTTP >500 and 429, denoting an internal Square error or too many requests respectively.

If you find that in the course of development you trigger a 429, you are likely doing something wrong.

### Logging

`nest-stripe` uses Nest.js's default logger set with class-name context, and verbosely logs every invocation.

### Webhooks

If you would like to receive and propogate Stripe webhooks, consider the following:

```typescript
@Controller("tripe/webhook")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  constructor(
    private readonly service: NestStripeService,
    @Inject(MyConfig.KEY)
    private readonly config: ConfigType<typeof MyConfig>,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @ApiExcludeEndpoint()
  @Post()
  post(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response
  ) {
    this.logger.verbose(this.post.name);

    if (!request.rawBody) {
      return;
    }

    if (!this.config.stripeWebhookSecret) {
      throw new InternalServerErrorException();
    }

    let event: Stripe.Event | undefined;

    try {
      event = this.service.stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        this.config.stripeWebhookSecret
      );
    } catch (err: any) {
      this.logger.error(`Stripe webhook received: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);
    this.eventEmitter.emit(`stripe.${event.type}`, event);
  }
}
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
