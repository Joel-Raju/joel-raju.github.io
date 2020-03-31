---
title: Effective form handling using React Hooks
date: '2020-03-28T00:00:00.001Z'
template: 'post'
draft: false
slug: '/posts/form-handling-using-react-hooks'
category: 'programming'
tags:
  - 'ReactJS'
  - 'JavaScript'
  - 'TypeScript'
  - 'ES6'
  - 'programming'

description: 'Handle forms effectively by creating a custom hook'
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
forms. Sure, we could create additional pieces state for each instance of the form component, but
this defeats the purpose of the global state which is to share same state across different
components.

## Handling form state locally

Lets start by handling the input state change using Hooks.

```typescript
// ....

const [firstName, setFirstName] = React.useState('');
const handleFirstNameChange = ({ target: value }) => setFirstName(value);

// ....

<input
  type='text'
  name='firstname'
  value={firstname}
  onChange={handleFirstNameChange}
/>;

// ....
```

Now lets add validation and error message.

```typescript
// ....

const [firstName, setFirstName] = React.useState('');
const [firstNameError, setFirstNameError] = React.useState('');

const handleFirstNameChange = ({ target: { value } }) => {
  if (value.match(/^[a-zA-Z]*$/)) {
    firstNameError('');
  } else {
    firstNameError('Field firstname is not valid !');
  }
  setFirstName(value);
};

// ....

<input
  type='text'
  name='firstname'
  value={firstname}
  onChange={handleFirstNameChange}
/>;
{
  firstNameError && <span>{firstNameError}</span>;
}

// ....
```

Looking pretty good, but imagine doing this for 5 input fields in a form, across 5 different
forms in our app. If we decide to copy the same code over, we are bloating the codebase, and the
headache would kick in if try to debug or extend the form.

## Can we do better ?

Lets start by creating a custom hook and tracking the input change.

```typescript
// ...

const useForm = () => {
  const [values, setValues] = React.useState({});

  const onChangeField = ({
    target: { name, value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prevState => ({ ...prevState, name: value }));
  };

  return { values, onChangeField };
};

// ...

const { values, onChangeField } = useForm();

<input
  type='text'
  name='firstname'
  value={values.firstname}
  onChange={onChangeField}
/>;

// ...
```

Now, lets add the initial field state.

```typescript
// ...

const useForm = (props) => {
  const { initialState } = props;
  const [values, setValues] = React.useState(initialState || {});

  const onChangeField = ({
    target: { name, value }
  } => {
    setValues(prevState => ({ ...prevState, [name]: value }));
  };

  return { values, onChangeField };
};

// ...

const {values, onChangeField} = useForm({initialState: {
  firstname: 'John'
}})

<input type='text' name='firstname' onChange={onChangeField} value={values.firstname} />;

// ...
```

The key point here is that we use the `name` of each field as the `key` for the different pieces of
state we create. So for example `error.firstName` will contain the error of the `firstName` field
and `touched.firstName` will contain the touched state of `firstName` and so on.

Now lets throw in some validation and the form submit handler.

```typescript
// ...

const useForm = props => {
  const [values, setValues] = React.useState(props.initialState || {});
  const [errors, setErrors] = React.useState({});

  const isFieldValid = (name: string, value: string) => {
    if (props.validator[name]) {
      return !!value.match(props.validator[name]);
    }
    return true;
  };

  const onChangeField = ({
    target: { name, value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    if (!isFieldValid(name, value)) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: `Field '${name}' not valid !`
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }

    setValues(prevState => ({ ...prevState, [name]: value }));
  };

  const onSubmit = () => {
    if (props.onSubmit === "function") {
      props.onSubmit(values);
    }
  };

  return { values, onChangeField, errors, onSubmit };

  // ...

  const { onChangeField, values, errors } = useForm({
    initialState: { firstname: 'John' },
    validator: { firstname: /^[a-zA-Z]*$/ }
    onSubmit: vals => console.log(vals)
  });

  // ...
  <form onSubmit={onSubmit}>
    <div>
      <label>FirstName</label>
      <input
        type='text'
        name='firstname'
        onChange={onChangeField}
        value={values.firstname}
      />
      {errors.firstname && <span>{errors.firstname}</span>}
    </div>
  </form>
};
```

We've now built a truly portable hook that can handle forms in our app. We could keep going and add
touched state, handle blur, field mount state, form submit state etc.

## Source code

Checkout the full source at [CodeSandbox](https://codesandbox.io/s/form-handling-using-hooks-d5oj3)

## Conclusion

Using plain React could lead to making our components more readable and very maintainable. You can
port and extend this hook and use across your app.

If you need a more mature library built with the same philosophy, checkout [Formik](https://github.com/jaredpalmer/formik).
It has a fully fledged API with support for focus management, touched state, handling blur, support
for React Native and more. It is one of most versatile form library out there !

## Reference

- [Formik](https://github.com/jaredpalmer/formik) (try reading the source, it's beautiful ✨)
