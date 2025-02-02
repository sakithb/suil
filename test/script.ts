import { render, component, expr, state } from "../suil.js"

const c = component({
    state: {
        count: 0,
        color: "Yellow"
    },
    render: ({ count, color }) => ({
        name: "div",
        children: [
            {
                name: "h1",
                props: {
                    textContent: expr(() => `${state(count)} clicks`, [count]),
                    style__color: state(color)
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Increment",
                    style__background: expr(() => state(color), [color]),
                    data__somedata: state(color),
                    on__click: () => {
                        state(count, state(count) + 1);
                    }
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Red",
                    style__display: expr(() => state(count) % 3 === 0 ? "none" : "block", [count]),
                    on__click: () => {
                        state(color, "Red");
                    }
                }
            },
            {
                name: "button",
                props: {
                    textContent: "Yellow",
                    style__display: expr(() => state(count) % 5 === 0 ? "none" : "block", [count]),
                    on__click: () => {
                        state(color, "Yellow");
                    }
                }
            },
        ]
    })
});

render("#app", c());
