---
title: Handling multiple click events in React Native
date: '2020-06-30T23:59:00.001Z'
template: 'post'
draft: false
slug: '/posts/handling-multiple-click-events-in-react-native'
category: 'programming'
tags:
  - 'programming'
  - 'React Native'
  - 'React'
description:
  'Handling multiple click events (single click, double click and longpress) on the same
  element in React Native'
socialImage: '/media/react-native-logo.jpg'
---

![React Native Logo](./media/react-native-logo.jpg)

## Introduction to click events in React Native

React Native provides 3 main primitives to handle click events.

- TouchableHighlight
- TouchableOpacity
- TouchableWithoutFeedback

Using any of these is a pretty standard affair. Just wrap our component that needs to respond to
click events.

```jsx
// imports...

<TouchableHighlight onPress={() => console.log('Clicked')}>
  <Text>Click me</Text>
</TouchableHighlight>
```

## Problem with Touchables

Though they work well for most of the use cases, there are some tricky situations which they cannot
handle. Consider the case of handling a single click, double click and a long press event, all on
the same element.

## PanResponder to the rescue

PanResponder provides a predicatable wrapper to the lower level
[Gesture Responder System](https://reactnative.dev/docs/gesture-responder-system) API. It provides
much granular control over the touch events and also gives access to useful meta info like touch
start position, touch end position, velocity of the gesture etc.

Let's learn how to make a `View` component respond to touch events using PanResponder.

```jsx
import { View, PanResponder, Text } from 'react-native';

const MyComponent = () => {
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderStart: (event) => {
      console.log('Touch has started !');
    },

    onPanResponderRelease: (event, gestureState) => {
      console.log('Touch has ended !');
    },

    onPanResponderTerminate: () => {},
  });

  return (
    <View {...responder.panHandlers}>
      <Text>Click Me </Text>
    </View>
  );
};
```

`onStartShouldSetPanResponder` should return `true` to allow the view to become the responder at the
start of a touch event.

`onMoveShouldSetPanResponder` should return `true` to allow the view to become the responder at the
start of a drag event.

`onPanResponderStart` callback is fired when the `PanResponder` registers touch events.

`onPanResponderRelease` callback is fired when the touch has been released.

`onPanResponderTerminate` callback is fired when the responder has been taken from the View. This
can happen when other views makes a call to `onPanResponderTerminationRequest` or it can be taken by
the OS without asking (happens with control center/ notification center on iOS).

To make the **double click** work, we need to use a counter and set a maximum time duration between the
click so as to treat it as a double click. 400ms of delay between the clicks is a good place to
start. We'll use the `handleTap` to determine the type of click event based on the timer.

```jsx
const MyComponent = () => {
  const [isTerminated, setTerminated] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const DOUBLE_PRESS_DELAY = 400;

  const handleTap = (event, gestureState) => {
    const timeNow = Date.now();
    if (lastTap && timeNow - lastTap < DOUBLE_PRESS_DELAY) {
      console.log('Handle double press');
    } else {
      setLastTap(timeNow);

      const timeout = setTimeout(() => {
        setLastTap(0);
        console.log('Handle single press');
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderStart: () => {
      const timeout = setTimeout(() => {
        if (!isTerminated) {
          setTouchStartTime(Date.now());
        }
      });
    },

    onPanResponderRelease: (event, gestureState) => {
      handleTap(event, gestureState);
    },

    onPanResponderTerminate: () => {
      setTerminated(true);
    },
  });

  return (
    <View {...responder.panHandlers}>
      <Text>Click Me </Text>
    </View>
  );
};
```

And now to make the **long press** work we need another counter with a delay of 700ms. We'll first
check if it is a long press before checking it was a single press or a double press. We'll use
`handlePressOut` to determine the type of click and deligate the action for it.

```jsx
const MyComponent = () => {
  const [isTerminated, setTerminated] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const [longPressTimer, setLongPressTimer] = useState(0);
  const [singlePressTimer, setSinglePressTimer] = useState(0);

  const DOUBLE_PRESS_DELAY = 400;
  const LONG_PRESS_DELAY = 700;

  const cancelLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(0);
    }
  };

  const cancelSinglePressTimer = () => {
    if (singlePressTimer) {
      clearTimeout(singlePressTimer);
      setSinglePressTimer(0);
    }
  };

  const handleTap = (event, gestureState) => {
    cancelSinglePressTimer();

    const timeNow = Date.now();
    if (lastTap && timeNow - lastTap < DOUBLE_PRESS_DELAY) {
      console.log('Handle double press');
    } else {
      setLastTap(timeNow);

      const timeout = setTimeout(() => {
        setLastTap(0);
        console.log('Handle single press');
      }, DOUBLE_PRESS_DELAY);

      setSinglePressTimer(timeout);
    }
  };

  const handlePressOut = (event, gestureState) => {
    const elapsedTime = Date.now() - touchStartTime;
    if (elapsedTime > LONG_PRESS_DELAY) {
      console.log('Handle long press');
    } else {
      handleTap(event, gestureState); // handles the single or double click
    }
    setTouchStartTime(0);
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderStart: () => {
      cancelLongPressTimer();

      const timeout = setTimeout(() => {
        if (!isTerminated) {
          setTouchStartTime(Date.now());
        }
      });

      setLongPressTimer(timeout);
    },

    onPanResponderRelease: (event, gestureState) => {
      handlePressOut(event, gestureState);
    },

    onPanResponderTerminate: () => {
      setTerminated(true);
    },
  });

  return (
    <View {...responder.panHandlers}>
      <Text>Click Me </Text>
    </View>
  );
};
```

## Conclusion

I've made [react-native-gifted-touch](https://github.com/Joel-Raju/react-native-gifted-touch) which
exactly does this so you can handle multiple clicks on the same element effortlessly. The default time
delays in the library can be configured using `props` to better suit your requirements. Feel free to
check it out.
