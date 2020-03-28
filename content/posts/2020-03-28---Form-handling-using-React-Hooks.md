---
title: Effective form handling using React Hooks
date: '2020-03-28T00:00:00.001Z'
template: 'post'
draft: true
slug: '/posts/form-handling-using-react-hooks'
category: 'programming'
tags:
  - 'ReactJS'
  - 'JavaScript'
  - 'TypeScript'
  - 'ES6'
  - 'programming'

description: 'Use React Hooks to build a reusable and effective form handling'
socialImage: '/media/react-logo.png'
---

## Introduction

There have been interesting (and opposing) ideas of how form state should be handled in React. Some
lean towards keeping the form state in a globally (like in Redux, MobX etc;), some prefer keeping it
locally, some prefer to render forms with a schema etc.

Some of the popular libraries for form handling in React

- [Redux Form](https://github.com/redux-form/redux-form)
- [React Final form](https://github.com/final-form/react-final-form)
- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)
- [uniforms](https://github.com/vazco/uniforms)

## Why forms state should be local ?

I could be hitting the hornet's nest with this, but I believe form state should be kept locally in
the component and not in the global state container. The primary reason for this argument is because
if we reuse the same form component elsewhere in our app, we often want different state for both the
forms. Sure we could create additional pieces state for each instance of the form component, but
this defeats the purpose of the global state which is to share same state across different
components.

## Handling form state locally

Lets start by handling the input state change using Hooks.

```typescript
// ....

const [firstName, setFirstName] = React.useState('');
const handleFirstNameChange = ({ target: value }) => setFirstName(value);

// ....

<input type='text' name='firstname' onChange={handleFirstNameChange} />;

// ....
```

Now lets throw in some validation and error message.

```typescript
// ....

const [firstName, setFirstName] = React.useState('');
const handleFirstNameChange = ({ target: { value } }) => setFirstName(value);
const [firstNameError, setFirstNameError] = React.useState('');

// ....

<input type='text' name='firstname' onChange={handleFirstNameChange} />;

// ....
```

Looking pretty good, but imagine doing this for 5 input fields in a form, across 5 different
forms in our app. If we decide to copy the same code over we are bloating the codebase, and the
headache would kick in if try to debug or modify the form.

## Can we do better ?

The main

## Conclusion

Using plain React can lead to making our components more readable, understandable and maintainable.
You can port and extend this hook and use across your apps.

If you need a more mature library built with the same philosophy, checkout [Formik](https://github.com/jaredpalmer/formik).
It has a fully fledged API with support for focus management, touched state, handling blur and more.
It is one of most versatile form library out there !
