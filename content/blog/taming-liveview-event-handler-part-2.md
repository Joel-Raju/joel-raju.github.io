+++
title = "Taming LiveView Event Handlers: A CRM Integration Story (Part 2)"
date = 2026-02-26
description = "How to use PhoenixCommands to decouple Phoenix LiveView UI events from complex business logic."

[taxonomies]
tags = ["Elixir", "Phoenix", "LiveView", "Architecture", "programming"]
+++

## A Simple Boundary

In [Part 1](/blog/taming-liveview-event-handlers-part-1/), I discussed the pitfalls of placing business logic—specifically external API integrations with Hubspot, Redtail, and MS Dynamics—directly inside LiveView `handle_event` callbacks. The coupling was tight, testing was hard, and handling retries or offline capabilities became complex.

To solve this, we introduced a simple rule to our architecture:

> **LiveViews emit commands. Domains handle commands.**

We wanted a clear boundary between our UI events and our business logic. This isn't event sourcing, and it isn't strict CQRS. It's just a way to make user intent explicit, serializable, and safely replayable. 

This philosophy eventually crystallized into a library called [PhoenixCommands](https://github.com/Joel-Raju/phoenix_commands).

## Enter PhoenixCommands

PhoenixCommands is a small, opinionated library that introduces explicit domain commands. 

The core idea is to turn the LiveView into a pure **UI adapter**. Instead of mutating state or calling external APIs directly in the `handle_event` function, the LiveView builds a command struct and dispatches it.

### Defining Intent

First, we define what the user wants to do as a struct. This is a plain Elixir module using `PhoenixCommands.Command`.

```elixir
defmodule MyApp.CRM.Commands.SyncContact do
  use PhoenixCommands.Command
  import Ecto.Changeset

  embedded_schema do
    field :contact_id,       :binary_id
    field :actor_id,         :binary_id
    field :expected_version, :integer
  end

  @impl PhoenixCommands.Command
  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:id, :contact_id, :actor_id, :expected_version])
    |> validate_required([:contact_id, :actor_id, :expected_version])
    |> validate_number(:expected_version, greater_than_or_equal_to: 0)
  end
end
```

Commands are immutable data, serializable, and explicitly state what the system should do.

### Handling the Command

Next, we write a handler. The handler is pure application logic. It has zero knowledge of WebSockets, sockets, or LiveView state. It validates the intent, authorizes it, and performs the necessary domain mutations (or external API calls).

```elixir
defmodule MyApp.CRM.SyncContactHandler do
  use PhoenixCommands.Handler

  @impl PhoenixCommands.Handler
  def handle(%SyncContact{} = cmd) do
    with {:ok, contact} <- Contacts.fetch(cmd.contact_id),
         :ok            <- check_version(contact, cmd.expected_version),
         :ok            <- authorize(cmd.actor_id, contact),
         :ok            <- Hubspot.sync(contact),
         :ok            <- Redtail.sync(contact),
         :ok            <- Dynamics.sync(contact) do
      {:ok, contact}
    else
      {:error, {:conflict, _}} = conflict -> conflict
      error -> error
    end
  end

  defp check_version(%{version: v}, v), do: :ok
  defp check_version(_, _), do: {:error, {:conflict, :stale_version}}
end
```

Handlers return a deterministic outcome: `{:ok, result}`, `{:error, {:conflict, reason}}`, or `{:error, reason}`.

### Dispatching from LiveView

Now, back in our LiveView, we simply dispatch the command. The LiveView handles the result and updates the UI accordingly. 

```elixir
def handle_event("sync_contact", %{"id" => contact_id}, socket) do
  case SyncContact.build(%{
    contact_id:       contact_id,
    actor_id:         socket.assigns.current_user.id,
    expected_version: socket.assigns.contact_versions[contact_id]
  }) do
    {:ok, cmd} ->
      case SyncContactHandler.handle(cmd) do
        {:ok, _contact}          -> {:noreply, put_flash(socket, :info, "Synced successfully!")}
        {:error, {:conflict, _}} -> {:noreply, put_flash(socket, :error, "Contact was updated by someone else")}
        {:error, reason}         -> {:noreply, put_flash(socket, :error, "Sync failed: #{inspect(reason)}")}
      end

    {:error, changeset} ->
      {:noreply, assign(socket, :form, to_form(changeset))}
  end
end
```

## The Payoff

This small architectural shift gave us immediate benefits:

### 1. Testability
We could now unit test our complex CRM synchronization logic without spinning up a Phoenix endpoint or simulating WebSocket events. The command handler is just a regular Elixir function that takes data and returns data.

### 2. Idempotency & Retries
Because commands have a unique ID, we can enforce at-most-once execution. If a user double-clicks the "Sync" button, the dispatcher sees the duplicate command ID and safely ignores it. No more duplicate records in Hubspot.

### 3. Optimistic Concurrency
By attaching an `expected_version` to the command, the handler can detect if the domain state has changed since the user loaded the page, returning a `{:conflict, reason}`.

### 4. Optional Offline Support
Because commands are serializable data, we gained a clear path to offline support. If the network drops, the frontend can serialize the command and store it in an offline queue. When the connection returns, we replay the *commands*, not the UI events. We never have to reconstruct the LiveView state to process offline actions.

## Conclusion

PhoenixCommands isn't a heavy framework; it's a boundary. If you have a simple CRUD application, you probably don't need it. But if your LiveView app involves real domain logic, multiple clients, or integrations with complex external systems like CRMs, making your user intent explicit is a game-changer.

Check out the [source code](https://github.com/Joel-Raju/phoenix_commands) and try extracting just one complex event handler to see how it feels. The library is designed to be adopted incrementally and disappear into your architecture.
