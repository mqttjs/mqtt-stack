![mqtt-stack](https://raw.githubusercontent.com/kokeksibir/mqtt-stack/master/mqtt-stack.png)

[![Build Status](https://travis-ci.org/mqttjs/mqtt-stack.png)](https://travis-ci.org/mqttjs/mqtt-stack) [![npm version](https://badge.fury.io/js/mqtt-stack.svg)](http://badge.fury.io/js/mqtt-stack)

**middleware based components to build a custom mqtt broker**

*In development, not yet stable.*

## Usage

mqtt-stack is available in npm, first you need to install

```bash
npm install mqtt-stack --save
```

require it in your project

```js
var mqttStack = require('mqtt-stack');
```

instantiate stack

```js
var stack = new mqttStack.Stack();
```

register any middleware to be used by calling `use` method

```js
stack.use(new mqttStack.MemoryBackend());
```

## Middlewares
In a broad terms, mqtt-stack middlewares are components that listen mqtt connection stream to perform actions according to their specific broker functionality.

### Interface
`Middleware` base class implementation is available in module exports, developpers are encouraged to inherit from that base class. mqtt-stack middlewares may implement following interface methods.

#### constructor (config)
Standard object constructor function takes configuration object as argument. If middleware is inherited from `Middleware` base class `super(config, defaults)` call sets up `config` member attribute of middleware object.

```js
class MyMiddleware {
  constructor(config) {
    let defaults = {some: 'value'};
    /* calling super function sets this.config and
     * this.name attributes */
    super(config, defaults);
  }
}
```
#### install (client)
Method is called once a new connection is established.

#### handle (client, packet, next, done)
Method is called once a packet is received. Once middleware finishes its action, it should either call `next` function to propagate to next middleware or call `done` function to terminate propagation.

#### callback handlers (ctx, store, next, done)
Other than these interface methods, middleware may handle a stack `callback` by exposing a method function with callback name. For instance, please check OutboundManager middleware (path: `src/middlewares/outbound_manager.js`) to see `forwardMessage` callback handler. `ctx` argument is an object which contains any relevant data required for callback handling. `store` is an output argument, that is updated by callback handlers. `done` terminates callback chain and returns callback.  

### Built-in Middlewares
mqtt-stack provide some built-in middlewares to provide basic MQTT Broker functionality. Keep in mind that those middlewares are not mandatory, on contrary they are designed to be easily replacible.

#### Authentication
Simple authentication binder middleware that executes `authenticateConnection` callback handler with `{client, packet, username, password}` context if client is not authenticated.

#### Authorize
Simple authorization binder middleware that executes `authorizePacket` callback handler with `{client, packet}` context for every received packet.

#### Connection
Simple connection management middleware. It observes connection status.

When connection is closed gracefully it executes `cleanDisconnect` callback handler with `{client}` context.
When connection is closed unexpectedly it executes `uncleanDisconnect` callback handler with `{client}` context.

It exposes `closeClient` callback handler that  will terminate client connection.

#### InboundManager
Handles client's `PUBLISH` command by executing `relayMessage` callback handler with `{client, packet, topic, payload}` context. Once callback handler finishes and it sends `PUBACK` message to client if its QoS is 1.

#### KeepAlive
Manages client connection's life span. Once client's  `CONNECT` command is received, if it contains `keepalive` duration, middleware bounds life time of connection with this duration and resets the time on every received packet. It executes `closeClient` callback handler with `{client}` context if no packet is received within `keepalive` time frame.

It also responds received `PINGREQ` commands with `PINGRESP`.

#### LastWill
Sends `last will` packet if client is disconnected unexpectedly. Once client's  `CONNECT` command is received if it contains `last will` packet, will packet is stored. This middleware exposes `uncleanDisconnect` callback handler that sends will packet.

#### MemoryBackend
Simple non-persistent backend storage middleware. It stores clients' subscription list and topics' retained messages in memory. It exposes following callback handlers

  * `storeSubscription` stores that `ctx.client` is subscribed to `ctx.topic` with `ctx.qos` QoS level.
  * `clearSubscriptions` removes all stored subscription data for `ctx.client`
  * `lookupSubscriptions` returns all stored subscription data for `ctx.client` in `store` argument.
  * `storeRetainedMessage` clears previous retained message of `ctx.topic` and if `ctx.packet.payload` is not empty stores `ctx.packet` as new retained message.
  * `lookupRetainedMessages` returns stored retained message of `ctx.topic` in `store` argument.
  * `relayMessage` relays `ctx.packet` to subscribers of `ctx.packet.topic` by executing `forwardMessage` callback handler with context `{client, packet}`.
  * `subscribeTopic` subscribes `ctx.client` to `ctx.topic` with QoS level defined by `ctx.qos`.
  * `unsubscribeTopic` unsubscribes `ctx.client` from `ctx.topic`.

#### OutboundManager
Manages outgoing messages. Handles client's `PUBACK` command. Exposes `forwardMessage` that publishes message to client.

#### PacketEmitter
Simple event bridge that establishes connection with an eventemitter and connection. Event emitter should be set by calling `setClientHandler` method before it is used.

#### RetainManager
Manages retained messages for topics. If client's `PUBLISH` command has flag `retain` it executes `storeRetainedMessage` callback handler with `{client, topic of packet, packet}` context.

It exposes `subscribeTopic` callback handler that first executes `lookupRetainedMessages` callback handler with `{topic}` then if topic has retained message executes `forwardMessage` handler with `{client, retained packet}`

#### SessionManager
Manages the clients session and calls callbacks to manage the stored subscriptions for clean and unclean clients. Once client's `CONNECT` command is received,
  * if it contains `clean` flag, session manager does not store its subscriptions for later connections and also executes `clearSubscriptions` callback handler with `{client, packet, clientId}` context to destroy clients previous session. then sends `CONNACK` to client.
  * it it `clean` flag is false or not exists, session manager first executes `lookupSubscriptions` callback handler with `{client, packet, clientId}` context to retrieve old subscription list, then executes `subscribeTopic` callback handler for each subscription in list with `{client, packet, topic, subscription QoS}` context to restore old subscriptions. After session is restored, `CONNACK` is sent to client.

#### SubscriptionManager
Manages client's `SUBSCRIBE` and `UNSUBSCRIBE` commands. For subscibe, it executes `subscribeTopic` callback handler with `{client, packet, topic, QoS level}` context, then `SUBACK` is sent to client. For unsubscribe it executes `unsubscribeTopic` callback handler with `{client, packet, topic}` context, then `UNSUBACK` is sent to client.

## Tests
Unit test are available in test folder. Project includes `mqtt-spec` as git submodule. Stack is tested for mqtt specifications using `mqtt-spec` module. Very primitive benchmarking results +20k message per second for loopback network.

## Contributing

mqtt-stack is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [CONTRIBUTING.md](https://github.com/mqttjs/mqtt-stack/blob/master/CONTRIBUTING.md) file for more details.

### Contributors

mqtt-stack is only possible due to the excellent work of the following contributors:

<table><tbody>
<tr><th align="left">Joël Gähwiler</th><td><a href="https://github.com/256dpi">GitHub/256dpi</a></td><td><a href="http://twitter.com/256dpi">Twitter/@256dpi</a></td></tr>
<tr><th align="left">Matteo Collina</th><td><a href="https://github.com/mcollina">GitHub/mcollina</a></td><td><a href="http://twitter.com/matteocollina">Twitter/@matteocollina</a></td></tr>
<tr><th align="left">M Kamil Sulubulut</th><td><a href="https://github.com/kokeksibir">GitHub/kokeksibir</a></td><td><a href="http://twitter.com/kokeksibir">Twitter/@kokeksibir</a></td></tr>
</tbody></table>

### License

MIT
