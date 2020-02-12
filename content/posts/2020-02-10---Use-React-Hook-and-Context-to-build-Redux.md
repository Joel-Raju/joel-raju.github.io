---
title: Use React Hooks & Context API to build a Redux style state container
date: '2020-02-10T00:00:00.001Z'
template: 'post'
draft: false
slug: '/posts/use-react-hooks-and-context-to-create-a-redux-style-state-container'
category: 'programming'
tags:
  - 'ReactJS'
  - 'JavaScript'
  - 'TypeScript'
  - 'ES6'
  - 'programming'

description:
  'Use React hooks useReducer & useContext along with the Context API to build a Redux
  style global state container'
socialImage: '/media/react-logo.png'
---

## State management is hard

State management is hard get right in complex React apps for most of us. State can include UI state
like routes, form states, pagination, selected tabs, etc as well as the response from http calls,
loading states, cached data etc.

Even at Facebook, they [had difficulty](https://youtu.be/nYkdrAPrdcw?t=877) in showing the correct
notification count for chat messages.

The necessity to tame this increasing complexity gave rise to some interesting libraries and
paradigms.

Some of the popular state-management libraries out there:

- [Redux](https://github.com/reduxjs/redux)
- [Redux Saga](https://github.com/redux-saga/redux-saga)
- [MobX](https://github.com/mobxjs/mobx)
- [XState](https://github.com/davidkpiano/xstate)
- [Constate](https://github.com/diegohaz/constate)

Redux might be the single most popular library used in tandem with React. It popularized the notion
of uni-directional flow of data and made state updates predictable and manageable.

We'll try to build a utility with the same principles in mind, a single source of truth with
uni-directional flow of data where state updates are performed by dispatching an action (pure
functions).

### Context API

> Context provides a way to pass data through the component tree without having to pass props down
> manually at every level.

Context is a powerful tool to have. In fact,
[Redux binding for React](https://github.com/reduxjs/react-redux/blob/9fc599317927b7e0d8fdaf1304b8efb2008c3cf7/src/components/Context.js#L3)
itself uses the `Context` API. Along with the `useReducer` & `useContext` hooks we have all the
pieces to build our state management utility.

## Demo time

We'll be building a basic counter with 2 buttons to increment and decrement the count. Our global
store will have a single piece of state called `count`. The demo will be using Typescript.

### Building the global store and the reducer

First lets create the context object. It will have two properties the state object itself and the
dispatch function.

```typescript
// ...

const GlobalStateContext = createContextcreateContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({ state: INITIAL_STATE, dispatch: () => {} });

// ...
```

When React renders a component that subscribes to this Context object it will read the current
context value from the closest matching Provider above it in the tree.

The reducer function is fairly the same as a Redux reducer, which performs state updates on incoming
Action and then returning the new state.

Putting it all together.

```typescript
import { createContext, Reducer } from 'react';
import { ActionTypes } from './globalActions';

interface State {
  count: number;
}

export const INITIAL_STATE: State = {
  count: 0
};

export interface Action {
  type: ActionTypes;
  payload?: any;
}

export const GlobalStateContext = createContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({ state: INITIAL_STATE, dispatch: () => {} });

export const globalReducer: Reducer<State, Action> = (state, action) => {
  const { type } = action;
  switch (type) {
    case ActionTypes.INCREMENT:
      return { ...state, count: state.count + 1 };
    case ActionTypes.DECREMENT:
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
};
```

We have 2 actions `INCREMENT` & `DECREMENT` and corresponding action creators which dispatches those
actions.

```typescript
export enum ActionTypes {
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT'
}

export const incrementAction = () => ({
  type: ActionTypes.INCREMENT
});

export const decrementAction = () => ({
  type: ActionTypes.DECREMENT
});
```

### Connecting the store to the components

Every Context object comes with a `Provider` React component that allows consuming components to
subscribe to context changes. It receives a prop `value` consuming components that are descendants
of this Provider.

`useReducer` is a hook that accepts the reducer and the initial state and returns the current
state paired with a dispatch method. (If you’re familiar with Redux, you already know how this
works.)

We need to wrap the root component of our app in the `Provider`, and pass the returned state and
dispatch as the `value` prop.

```typescript
// ...

const [globalState, dispatchToGlobal] = React.useReducer(
  globalReducer,
  INITIAL_STATE
);

return (
  <GlobalStateContext.Provider
    value={{ state: globalState, dispatch: dispatchToGlobal }}
  >
    <div className='App'>
      <Layout />
    </div>
  </GlobalStateContext.Provider>
);

// ...
```

At this point, our entire app has access to the global state and can dispatch actions to the
store. Now lets connect the UI components to the store.

The `useContext` hook accepts a Context object and returns the current context value for that
context, which in our case is the `state` & `dispatch` method.

```typescript
import * as React from 'react';
import { GlobalStateContext } from './context/globalStore';
import { incrementAction, decrementAction } from './context/globalActions';

const Layout: React.FC = () => {
  const { state, dispatch } = React.useContext(GlobalStateContext);

  return (
    <div>
      <div>
        <h2>Count : {state.count}</h2>
      </div>
      <div>
        <button onClick={() => dispatch(incrementAction())}>Increment</button>
        <button onClick={() => dispatch(decrementAction())}>Decrement</button>
      </div>
    </div>
  );
};

export default Layout;
```

## Souce code

Checkout the full source at [CodeSandbox](https://codesandbox.io/s/react-hooks-redux-state-v5x4j)

## Conclusion

The state management utility we created in this article shows what's possible with React Hooks &
Context API. This approach is best suited for small to medium-sized apps that needs a global state
container like Redux but doesn't need all the bells and whistles like middlewares, debugging
extensions etc. For complex apps I still use Redux and you should try it too.
