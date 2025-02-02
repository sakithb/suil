# Web UI Library

```ts
import { render, component, expr, state } from "wuil"

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

## State
Accessing state: `state(count)`\
Setting state: `state(count, 10)`

```ts
{
    name: "span",
    props: {
        textContent: state(count),
    }
}
```
```ts
{
    name: "button",
    props: {
        textContent: "Increment",
        on__click: () => {
            state(count, state(count) + 1);
        }
    }
}
```

## Expressions
Creating expressions: `expr(() => count * 2, [count])`

```ts
{
    name: "span",
    props: {
        textContent: expr(() => state(count) * 2, [count]),
    }
}
```

## Property types

**Event handlers** - `on__*: Function`\
Access/set state inside event handlers\
*Examples: on__click, on__change*

**Styles** - `style__*: string`\
Change styles dynamically\
*Examples: style__color, style__fontSize*

**Classes** - `class__*: boolean`\
Toggle classes dynamically\
*Examples: class__hidden, class__error*

**Data attributes** - `data__*: string | number | boolean`\
Set data attributes dynamically\
*Examples: data__id, data__name*

**Attributes** - `*: string | number | boolean`\
Set attributes dynamically\
*Examples: id, class, for*

**Special cases** - `textContent: string`\
Set textContent dynamically
*Examples: "Click me"*
