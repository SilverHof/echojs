export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export type ReadValue<T> = T extends object ? DeepReadonly<T> : T;

export interface ReadonlySignal<T> {
  value(): ReadValue<T>;
  peek(): ReadValue<T>;
  subscribe(fn: () => void): () => void;
}

export interface Signal<T> extends ReadonlySignal<T> {
  set(next: T): void;
  update(fn: (prev: T) => T): void;
  readonly(): ReadonlySignal<T>;
}

