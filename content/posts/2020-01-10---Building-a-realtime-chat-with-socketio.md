---
title: Building a realtime chat with Socket-IO and ReactJS
date: '2020-01-10T00:00:00.001Z'
template: 'post'
draft: true
slug: '/posts/building-a-realtime-chat-with-socketio'
category: 'programming'
tags:
  - 'programming'
  - 'JavaScript'
  - 'React'
  - 'NodeJS'
  - 'SocketIO'
description: 'Building a realtime chat with Socket-IO and ReactJS'
---

## Why websockets and how it works ?

In the past, [long polling](https://en.wikipedia.org/wiki/Push_technology#Long_polling)
was the primary way of implementing real time communication. The
48 byte HTTP handshake is not realistic for todays age.

Websockets allow you to send server side events by maintaing
a fully duplex communication channel. It is build on top of the HTTP protocol.
Socket IO can be used for sending low payload frequently. Sending a large
payload defats the purspose.

To establish the websocket connection, the browser sends a normal HTTP request
to the server with an `Upgrade` request header. The server opens a persistant
connection which allows bi-directional communication.

See this in the Devtools image

## Building the Websocket server

For this demo, we will be building a simple server that responds

We could build websockets based upon the HTTP standard.
Socket IO provides a nicer interface to

```js
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
```

## Building the web client

## Souce Code

See this [GitHub repo](https://github.com/Joel-Raju/chat-demo/) for the entire source code.

## Further reading

I've just scratched the surface of what can be done with websockets and Socket IO. Setting up
groups, receiving acknowledgements, broadcasting messages, etc can be achieved with a few lines of
code. Checkout the [Socket IO docs](https://socket.io/docs/).

## Reference

[MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
