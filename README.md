# nest-stripe

Nest-Stripe is a NestJS module for integrating Stripe into your application. This module makes it easy to configure and use Stripe in a straightforward and idiomatic way.

## Features

- Easy-to-use Stripe service that can be injected into your classes.
- Environment, Synchronous, Asynchronous initialization.
- Retrying

## Installation

```bash
npm install nest-stripe2 @nestjs/common @nestjs/config stripe
```

Nest.js and Stripe are peer dependencies.

## Quick Start

```typescript
import { NestStripeModule } from "nest-stripe2";

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

If you set the `STRIPE_API_KEY` environment variable, you may:

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
    const stripeCustomer = await this.stripeService.retryOrThrow((client) =>
      client.customers.create({
        email: user.email,
        phone: user.phoneNumber,
        name: user.firstName,
      })
    );
  }
}
```

If you do not want to use the retry higher-order-function, you may use the client directly.

```typescript
await this.stripeService.client.billingPortal.sessions.create({
  return_url: "http://localhost:3000",
  customer: stripeCustomer?.id,
});
```

### Version

From Stripe:

> If you wish to remain on your account's default API version, you may pass null or another version instead of the latest version, and add a @ts-ignore comment here and anywhere the types differ between API versions.

This library passes null for the API version.

### Retry

The `retryOrThrow` method provides a built-in retry mechanism for dealing with transient issues in your API calls. It retries the provided client function multiple times before eventually throwing an error if all attempts are unsuccessful. This package uses the default configuration of `p-retry`, and only retries HTTP >500 and 429, denoting an internal Square error or too many requests respectively.

If you find that in the course of development you trigger a 429, you are likely doing something wrong.

### Logging

`nest-stripe` uses Nest.js's default logger set with class-name context, and verbosely logs every invocation.

### Webhooks

If you would like to receive and propagate Stripe webhooks, consider the following:

```typescript
@Controller("stripe/webhook")
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
    @Req() request: RawBodyRequest<Request>, // essential
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
