type StateSpec = Record<string, any>;
type StateValueDef<V> = {
    __state: {
        key: string,
        state: StateSpec,
        current: V,
    }
};
type State<T extends StateSpec> = {
    [K in keyof T]: StateValueDef<T[K]>
};
type StateDepFn = (elem: HTMLElement, prop: keyof ElementSpecProps, state: StateSpec, key: string) => void;
type StateDep = { elem: HTMLElement, prop: keyof ElementSpecProps, fn: StateDepFn };
type StateDeps = Record<string, StateDep[]>;

type ExprDef<R> = {
    __expr: {
        deps: StateValueDef<any>[],
        fn: () => R
    }
};

type Component<P> = (props?: P) => ElementSpec;
type ComponentSpec<S extends StateSpec, P extends Record<string, any>> = {
    state?: S;
    render: (state: State<S>, props: P) => ElementSpec;
};

type Literals = string | boolean | number;
type ElementSpecPropTyped<T> = T | StateValueDef<T> | ExprDef<T>;

type ElementSpecPropsEvents = {
    [K in keyof HTMLElementEventMap]: (this: HTMLElement, event: HTMLElementEventMap[K]) => void
};

type ElementSpecPropsStyles = {
    [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never
}[keyof CSSStyleDeclaration] & string;

type ElementSpecKey = 
    'textContent' |
    `on__${keyof ElementSpecPropsEvents}` |
    `style__${ElementSpecPropsStyles}` |
    `class__${string}` |
    `data__${string}`;

type ElementSpecProps = Partial<{
    [K in ElementSpecKey]: 
        K extends 'textContent' ? ElementSpecPropTyped<Literals> :
        K extends `on__${infer E extends keyof ElementSpecPropsEvents}` ? ElementSpecPropsEvents[E] :
        K extends `style__${ElementSpecPropsStyles}` ? ElementSpecPropTyped<string> :
        K extends `class_${string}` ? ElementSpecPropTyped<boolean> :
        K extends `data_${string}` ? ElementSpecPropTyped<Literals> :
        ElementSpecPropTyped<Literals>
}>;

type ElementSpec = {
    name: keyof HTMLElementTagNameMap,
    props?: ElementSpecProps,
    children?: ElementSpec[]
}

var init = false;
const stateDeps: Map<StateSpec, StateDeps> = new Map();

function proxify<T extends StateSpec>(target: T): State<T> {
    return new Proxy(target, {
        get(target, prop) {
            if (!(prop in target)) {
                console.error("Cannot access undefined state");
                return undefined;
            }

            if (typeof prop === "symbol") {
                console.error("Cannot use symbols in state");
                return undefined;
            }

            return {
                __state: {
                    key: prop,
                    state: target,
                    current: target[prop],
                }
            };
        },

        set() {
            console.error("Cannot modify state directly");
            return false;
        }
    }) as unknown as State<T>;
}

function component<P extends Record<string, any>, S extends StateSpec = StateSpec>(spec: ComponentSpec<S, P>): Component<P> {
    return (props) => {
        const state = proxify(spec.state ?? ({} as S));

        init = true;
        const elem = spec.render(state, props ?? ({} as P));
        init = false;

        return elem
    }
}

function expr<R>(fn: () => R, deps: StateValueDef<any>[]): ExprDef<R> {
    return {
        __expr: {
            deps,
            fn,
        }
    };
}

function state<T>(v: StateValueDef<T>): T;
function state<T>(v: StateValueDef<T>, s: T): void;
function state<T>(v: StateValueDef<T>, s?: T): T | void {
    if (init) return v as unknown as T;

    if (s === undefined) {
        return v.__state.state[v.__state.key] as unknown as T;
    } else {
        (v.__state.state as StateSpec)[v.__state.key] = s;

        if (!stateDeps.has(v.__state.state)) return;
        const props = stateDeps.get(v.__state.state)!;

        if (!(v.__state.key in props)) return;
        const deps = props[v.__state.key];

        for (const { elem, prop, fn } of deps) {
            fn(elem, prop, v.__state.state, v.__state.key);
        }
    }
}

function addStateDep(state: StateSpec, key: string, elem: HTMLElement, prop: keyof ElementSpecProps, fn: StateDepFn) {
    if (!stateDeps.has(state)) {
        stateDeps.set(state, {});
    }

    const keys = stateDeps.get(state)!;

    if (!keys[key]) {
        keys[key] = [];
    }

    keys[key]!.push({ elem, prop, fn });
}

function addExprDeps(deps: StateValueDef<any>[], elem: HTMLElement, prop: keyof ElementSpecProps, fn: StateDepFn) {
    for (const dep of deps) {
        addStateDep(dep.__state.state, dep.__state.key, elem, prop, fn);
    }
}

function element(spec: ElementSpec): HTMLElement  {
    const elem = document.createElement(spec.name);
    if (spec.props == null) return elem;

    for (const prop of Object.keys(spec.props) as ElementSpecKey[]) {
        const p = prop.split("__", 2);
        const v = spec.props[prop]!;

        if (p.length > 1 && p[0] === "on") {
            elem.addEventListener(p[1], v as unknown as ((...args: any[]) => any));
        } else if (p.length > 1 && p[0] === "style") {
            if (typeof v === "object" && "__state" in v) {
                addStateDep(v.__state.state, v.__state.key, elem, prop, (elem, prop, state, key) => {
                    elem.style.setProperty(prop.substring(7), state[key]);
                });

                elem.style.setProperty(p[1], v.__state.current as string);
            } else if (typeof v === "object" && "__expr" in v) {
                addExprDeps(v.__expr.deps, elem, prop, (elem, prop) => {
                    elem.style.setProperty(prop.substring(7), v.__expr.fn() as string);
                });

                elem.style.setProperty(p[1], v.__expr.fn() as string);
            } else {
                elem.style.setProperty(p[1], v as string);
            }
        } else if (p.length > 1 && p[0] === "class") {
            if (typeof v === "object" && "__state" in v) {
                addStateDep(v.__state.state, v.__state.key, elem, prop, (elem, prop, state, key) => {
                    if (state[key]) {
                        elem.classList.add(prop.substring(7));
                    } else {
                        elem.classList.remove(prop.substring(7));
                    }
                });

                if (v.__state.current as boolean) {
                    elem.classList.add(p[1]);
                } else {
                    elem.classList.remove(p[1]);
                }
            } else if (typeof v === "object" && "__expr" in v) {
                addExprDeps(v.__expr.deps, elem, prop, (elem, prop) => {
                    if (v.__expr.fn()) {
                        elem.classList.add(prop.substring(7));
                    } else {
                        elem.classList.remove(prop.substring(7));
                    }
                });

                if (v.__expr.fn()) {
                    elem.classList.add(p[1]);
                } else {
                    elem.classList.remove(p[1]);
                }
            } else {
                if (v as boolean) {
                    elem.classList.add(p[1]);
                } else {
                    elem.classList.remove(p[1]);
                }
            }
        } else if (p.length > 1 && p[0] === "data") {
            if (typeof v === "object" && "__state" in v) {
                addStateDep(v.__state.state, v.__state.key, elem, prop, (elem, prop, state, key) => {
                    elem.dataset[prop.substring(6)] = state[key].toString();
                });
                elem.dataset[p[1]] = v.__state.current.toString();
            } else if (typeof v === "object" && "__expr" in v) {
                addExprDeps(v.__expr.deps, elem, prop, (elem, prop) => {
                    elem.dataset[prop.substring(6)] = v.__expr.fn().toString();
                });
                elem.dataset[p[1]] = v.__expr.fn().toString();
            } else {
                elem.dataset[p[1]] = v.toString();
            }
        } else if (p[0] === "textContent") {
            if (typeof v === "object" && "__state" in v) {
                addStateDep(v.__state.state, v.__state.key, elem, prop, (elem, _, state, key) => {
                    elem.textContent = state[key].toString();
                });
                elem.textContent = v.__state.current.toString();
            } else if (typeof v === "object" && "__expr" in v) {
                addExprDeps(v.__expr.deps, elem, prop, (elem) => {
                    elem.textContent = v.__expr.fn().toString();
                });
                elem.textContent = v.__expr.fn().toString();
            } else {
                elem.textContent = v.toString();
            }
        } else {
            if (typeof v === "object" && "__state" in v) {
                addStateDep(v.__state.state, v.__state.key, elem, prop, (elem, prop, state, key) => {
                    elem.setAttribute(prop, state[key].toString());
                });
                elem.setAttribute(prop, v.__state.current.toString());
            } else if (typeof v === "object" && "__expr" in v) {
                addExprDeps(v.__expr.deps, elem, prop, (elem, prop) => {
                    elem.setAttribute(prop, v.__expr.fn().toString());
                });
                elem.setAttribute(prop, v.__expr.fn().toString());
            } else {
                elem.setAttribute(prop, v.toString());
            }
        }
    }

    return elem;
}

function render(selector: string, spec: ElementSpec) {
    const target = document.querySelector(selector);
    if (target == null) {
        console.error("Invalid selector");
        return;
    };

    const parents: [ElementSpec, HTMLElement[]][] = [];
    const stack = [spec];
    while (stack.length > 0) {
        const elemSpec = stack[stack.length - 1];
        const children: HTMLElement[] = [];
        if (elemSpec.children && elemSpec.children.length > 0) {
            if (parents.length > 0 && parents[parents.length - 1][0] === elemSpec) {
                children.push(...parents.pop()![1]);
            } else {
                parents.push([elemSpec, []]);
                stack.push(...elemSpec.children);
                continue;
            }
        }

        const elem = element(stack.pop()!);

        while (children.length > 0) {
            elem.appendChild(children.pop()!);
        }

        if (parents.length > 0) {
            parents[parents.length - 1][1].push(elem);
        } else {
            target.appendChild(elem);
        }
    }
}

export { render, component, expr, state };
