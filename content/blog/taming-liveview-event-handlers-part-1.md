+++
title = "Taming LiveView Event Handlers: A CRM Integration Story (Part 1)"
date = 2026-02-25
description = "Why putting business logic in Phoenix LiveView handle_event callbacks becomes a liability when integrating with external systems."
draft = true

[taxonomies]
tags = ["Elixir", "Phoenix", "LiveView", "Architecture", "programming"]
+++

## The Consulting Project

A while back, I was brought on for some consulting work to help a client build a robust system using Elixir and Phoenix LiveView. The core of the project wasn't just displaying data on a screen—it involved heavy integrations with multiple external CRMs, specifically **Hubspot CRM**, **Redtail CRM**, and **MS Dynamics**. 

LiveView is incredible for building rich, interactive web applications without writing a single line of JavaScript. The programming model is simple and elegant: an event happens on the client, it's pushed to the server over a WebSocket, and you handle it in a `handle_event/3` callback. 

But as the complexity of the CRM integrations grew, that simplicity started working against us.

## The `handle_event` Trap

When you first start building a LiveView application, it's very natural to put your business logic directly inside the `handle_event/3` callback. 

```elixir
def handle_event("sync_contact", %{"id" => contact_id}, socket) do
  contact = Contacts.get_contact!(contact_id)
  
  # Business logic creeping into the UI layer
  Hubspot.sync(contact)
  Redtail.sync(contact)
  Dynamics.sync(contact)

  {:noreply, put_flash(socket, :info, "Contact synced successfully")}
end
```

For simple CRUD apps, this is fine. But when you are dealing with distributed systems and external APIs, things get complicated quickly.

### The Network is Unreliable

External CRMs have rate limits, they experience downtime, and their response times can fluctuate. When a user clicks "Sync Contact", that request might fail halfway through.

If the user clicks the button again (a double submit) or if the WebSocket reconnects and resends the event (a reconnect storm), we risk executing the same side effects multiple times. How do we ensure safe retries without creating duplicate records in Hubspot or MS Dynamics?

### Hidden Intent

When you look at the `handle_event` callback above, the user's *intent* is implicit. The event is just a string `"sync_contact"`. There is no structured data representing the action the user wants to take.

This makes auditing difficult. If a client asks, "Who triggered the sync for this contact and when?", we don't have a formalized object representing that request to save to a database or an audit log.

### Tight Coupling to the UI

By placing the API integration logic inside the LiveView, we've tightly coupled our business domain to our UI adapter. If we later want to expose this same functionality via a REST API, a background job, or a mobile app, we have to extract that logic. The LiveView should just be a presentation layer, but it ended up owning the correctness of our application.

## Breaking Point

As we added more features—optimistic concurrency, handling flaky networks, and complex authorization rules—the LiveView modules became bloated orchestrators. Testing became a nightmare because we had to simulate WebSocket connections just to test our business logic.

We needed a clear boundary. We needed a way to decouple *what* the user wants to do from *how* the system does it. 

In the next part, I'll show you how we solved this architectural headache by introducing a small, opinionated boundary between our UI events and domain logic.
