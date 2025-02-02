# Simple UI Library

```ts
import { render, component, expr, state } from "../dist/suil.js"

const counter = component({
    state: {
        count: 0,
    },
    render: ({ count, color }) => ({
        name: "div",
        children: [
            {
                name: "span",
                props: {
                    textContent: state(count),
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Increment",
                    on__click: () => {
                        state(count, state(count) + 1);
                    }
                }
            },
        ]
    })
});

render("#app", counter());
```

### Reactive state

> Accessing state: `state(count)`
> Setting state: `state(count, 10)`

```ts
const c = component({
    state: {
        count: 0,
    },
    render: ({ count, color }) => ({
        name: "div",
        children: [
            {
                name: "span",
                props: {
                    textContent: state(count),
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Increment",
                    on__click: () => {
                        state(count, state(count) + 1);
                    }
                }
            },
        ]
    })
});
```

### Reactive expressions

> Creating expressions: `expr(() => count * 2, [count])`

```ts
const c = component({
    state: {
        count: 0,
    },
    render: ({ count, color }) => ({
        name: "div",
        children: [
            {
                name: "span",
                props: {
                    textContent: expr(() => state(count) * 2, [count]),
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Increment",
                    on__click: () => {
                        state(count, state(count) + 1);
                    }
                }
            },
        ]
    })
});
```

### Property types

*Event handlers* - `on__*: Function`
> Access/set state inside event handlers
Examples: on__click, on__change

*Styles* - `style__*: string`
> Change styles dynamically
Examples: style__color, style__fontSize

*Classes* - `class__*: boolean`
> Toggle classes dynamically
Examples: class__hidden, class__error

*Data attributes* - `data__*: string | number | boolean`
> Set data attributes dynamically
Examples: data__id, data__name

*Attributes* - `*: string | number | boolean`
> Set attributes dynamically
Examples: id, class, for

*Special cases* - `textContent: string`
> Set textContent dynamically
