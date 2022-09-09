export interface Type
  { readonly _: unique symbol }

export declare const O: O
interface O {
  get: (o: Type, k: Type) => Type
  key: (o: Type) => Type
  create: (k: Type, v: (k: Type) => Type) => Type
}

export declare const T: T
interface T {
  function: Type
  isSubtype: (a: Type, b:Type) => Type
}

export declare const U: U
interface U {
  filter: (f: (t: Type) => Type) => (t: Type) => Type
}

export declare const B: B
interface B {
  not: (t: Type) => Type
}

export declare const t: 
  <T>() => Type

export declare const p:
  (a: Type, ...fs: ((t: Type) => Type)[]) => Type
