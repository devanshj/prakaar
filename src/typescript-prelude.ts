export namespace O {
  export type get<o, k> = k extends keyof o ? o[k] : never
  export type key<o> = keyof o
}

export namespace U {
  
}

export namespace T {
  export type function_ = (...a: never[]) => unknown
  export type isSubtype<a, b> = a extends b ? true : false
  export type cast<a, b> = a extends b ? a : b
}

export namespace B {
  export type not<t> =
    t extends true ? false :
    t extends false ? true :
    boolean
}
