+++
title = "Building a real-time chat with Socket.IO and ReactJS"
date = 2020-02-06
description = "Building a real-time chat with Socket.IO and ReactJS"

[taxonomies]
tags = ["ReactJS", "NodeJS", "SocketIO", "JavaScript", "programming"]
+++

## Why WebSockets ?

In the past, [long polling](https://en.wikipedia.org/wiki/Push_technology#Long_polling)
was the primary way of implementing real time communication. Each request involves setting up a TCP
connection by a three-way TCP handshake after the DNS lookup.

1. First the client sends its TCP sequence number and maximum segment size to the server.
   (**SYN**chronize)
2. Then the server responds by sending its sequence number and maximum segment size to the Client.
   (**SYN**chronize-**ACK**nowledgement)
3. And finally the client acknowledges receipt of the sequence number and segment size information.
   (**ACK**nowledgement)

Each packet is composed of an IP header and data (payload). In this case, the data section contains
TCP. The TCP header contains various fields including the source and destination ports, sequence and
acknowledgment numbers, window size, TCP flags, urgent pointer, and reserved bits.

Thus setting up a connection involves exchanging ~ [128-136 bytes](https://stackoverflow.com/questions/31378403/how-much-data-it-cost-to-set-up-a-tcp-connection) of data between the server and the client. And
tearing down the connection requires ~ 160 bytes by a four-way handshake.

So polling is not a viable option for a truly real-time connection.

## What is a WebSocket ?

The [WebSocket](https://html.spec.whatwg.org/multipage/web-sockets.html) specification defines an
API establishing "socket" connections between a web browser and a server. In plain words: There is
an persistent fully duplex connection between the client and the server and both parties can start
sending data at any time.

To establish a WebSocket connection, the browser sends a standard HTTP `GET` request to the server
with `Upgrade: websocket` & `Connection: websocket` request header.

```bash
GET / HTTP/1.1
Host: localhost:3000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: FfYGmWUfXRS+21DRrCLfiQ==
Sec-WebSocket-Version: 13
```

The main advantage here over XHR request is that
**once the connection is established it persists until the client or the server tears it down**. So
there is no need of performing the handshake on each request.

After running the demo, open the Network Tab in Dev Tools to see the WebSocket client handshake.

![Dev tools image](./media/websocket-post/dev-tools-image.png)

## Enter Socket.IO

[Socket.IO](https://socket.io) is a really popular library that enables real-time, bidirectional and
event-based communication. But Socket.IO is not a WebSocket implementation, it uses WebSocket
transport whenever possible, it adds some metadata to each packet: the packet type, the namespace
and the packet id when a message acknowledgement is needed.

## Building the WebSocket server

For this demo, we will be building a simple server that replys back what the client has sent.

Socket.IO has a robust event emitter mechanism build on top of Node's
[EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter), which provides
callbacks to events. The `connection` event (a system event) callback gets fired when a client gets
connected.

```js
// ....

io.on('connection', function(socket) {
  console.log('connected', socket);
});

// ....
```

After connection to the client is successful, all events on the live socket can be listened to by
the event name.

```js
// ....

io.on('connection', function(socket) {
  socket.on('event_name', function(data) {
    // here event_name is a custom event
    console.log('new event', data);
  });
});

// ....
```

We can create custom events, and send data to the clients connected on the socket using the `emit`
method.

```js
// ....

io.on('connection', function(socket) {
  socket.emit('event_name', {
    data: 'hello world'
  });
});

// ....
```

To close the current socket server use the `close` method.

```js
// ....

io.close();

// ....
```

Putting it all together with the express server.

```js
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uniqid = require('uniqid');

const PORT = 3001;

const MESSAGE_TYPE = {
  SENT: 'SENT',
  RECEIVED: 'RECEIVED'
};

io.on('connection', function(socket) {
  socket.on('message', function(data) {
    socket.emit('message', {
      ...data,
      type: MESSAGE_TYPE.RECEIVED,
      timestamp: Date.now(),
      id: uniqid()
    });
  });
});

http.listen(PORT, function() {
  console.log('listening on *:3001');
});

app.get('/', function(req, res) {
  res.send('Hello World');
});

module.exports = {
  app: app
};
```

## Building the web client

![Chat UI](./media/websocket-post/chat-demo.png)

The web client is a basic 2 pane layout with contacts on the left and the chat messages on the
right.

First we need to install the
[Socket.IO client library](https://github.com/socketio/socket.io-client#readme) to establish
connection to the server. The `io` object constructor accepts a url and
[options](https://socket.io/docs/client-api/#io-url-options).

```js
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  query: {
    CLIENT_ID: 1234
  }
});
```

The `query` option allows to send query parameters when connecting to the namespace (then found
in `socket.handshake.query` object on the server-side) which can be used to send token used to keep
track of and identify clients, etc. The query content can also be updated on reconnection.

Similar to the server, events on the client can be listened to by the event name. In addition to
**user created events**, Socket.IO client has a set of **system events** that can be subscribed to.

- `connect` - Fired upon connecting
- `error` - Fired upon a connection error
- `disconnect` - Fired upon a disconnection
- `reconnect` - Fired upon a successful reconnection
- `reconnect_attempt` - Fired upon an attempt to reconnect
- `reconnecting` - Fired upon an attempt to reconnect (receives reconnection attempt number as
  param)
- `reconnect_error` - Fired upon a reconnection attempt error
- `reconnect_failed` - Fired when couldn’t reconnect within `reconnectionAttempts`

Example usage of `connect` & `disconnect` event.

```js
// ....

socket.on('connect', socket => {
  console.log('connnected to socket', socket);
});

socket.on('disconnect', reason => {
  console.log('socket connection disconnected', reason);
});

// ....
```

To send events to the server, we can use the `emit` method, which accepts an **eventName**, **args**
and an **ack callback**.

```js
// ....

socket.emit('event_name', { data: 'any data' }, function(res) {
  console.log('ack message', res);
});

// ....
```

Now lets wire up all the pieces in our **redux actions**, where we listen for events `connect`,
`disconnect` and `message` (user created event). We also have an action to send messages.

```js
import io from 'socket.io-client';
import uniqid from 'uniqid';

import {
  UPDATE_MESSAGE_HISTORY,
  CLIENT_ID,
  MESSAGE_TYPE,
  SET_CONNECTION_STATUS
} from '../constants';

const socket = io('http://localhost:3001', {
  query: {
    CLIENT_ID: CLIENT_ID
  }
});

const listenConnectionChange = () => dispatch => {
  socket.on('connect', () => {
    dispatch({
      type: SET_CONNECTION_STATUS,
      payload: true
    });
  });

  socket.on('disconnect', () => {
    dispatch({
      type: SET_CONNECTION_STATUS,
      payload: false
    });
  });
};

const sendMessage = message => (dispatch, getState) => {
  const { friendsReducer } = getState();
  const messageTemplate = {
    message,
    type: MESSAGE_TYPE.SENT,
    receiverId: friendsReducer.activeReceiver.id,
    timestamp: Date.now(),
    id: uniqid()
  };
  socket.emit('message', messageTemplate, function(res) {
    console.log('emit message');
  });

  dispatch({
    type: UPDATE_MESSAGE_HISTORY,
    payload: messageTemplate
  });
};

const listenForIncomingMessage = () => dispatch => {
  socket.on('message', message => {
    dispatch({
      type: UPDATE_MESSAGE_HISTORY,
      payload: message
    });
  });
};

export { sendMessage, listenForIncomingMessage, listenConnectionChange };
```

And the **chat reducer** consists of two objects `messages` & `connectionStatus`.

```js
import { UPDATE_MESSAGE_HISTORY, SET_CONNECTION_STATUS } from '../constants';

const INITIAL_STATE = {
  messages: {},
  connectionStatus: false
};

export default function(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case UPDATE_MESSAGE_HISTORY:
      const messageTemplate = {
        message: action.payload.message,
        type: action.payload.type,
        timestamp: action.payload.timestamp,
        id: action.payload.id
      };
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.receiverId]: state.messages[action.payload.receiverId]
            ? state.messages[action.payload.receiverId].concat(messageTemplate)
            : [].concat(messageTemplate)
        }
      };

    case SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };

    default:
      return state;
  }
}
```

We have another reducer which keeps the list of contacts and the active contact. The UI components
are connected to the **redux store** renders the chat messages, contacts and the input box to send
message.

## Souce Code

Checkout the entire source code on [GitHub](https://github.com/Joel-Raju/chat-demo/).

## Further reading

I've just scratched the surface of what can be done with WebSockets and Socket.IO. Setting up
groups, receiving acknowledgements, broadcasting messages, etc can be done with a few lines of
code.

- [Socket.IO Docs](https://socket.io/docs/)
- [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [TCP Handshake](https://support.novell.com/techcenter/articles/nc2000_03d.html)