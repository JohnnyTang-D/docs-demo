export type PropSpec<PType extends boolean | number | string> = {
  values?: readonly PType[];
  default: PType;
};

export type PropSchema = Record<string, PropSpec<boolean | number | string>>;

// 根据 PropSpec<P> 推断出最终的属性类型
type InferPropType<T extends PropSpec<boolean | number | string>> =
  T extends PropSpec<infer P>
    ? T['values'] extends readonly (infer V)[]
      ? V
      : P
    : never;

// 最终 Props 的生成，完全由泛型“控制”推导过程
export type Props<PSchema extends PropSchema> = {
  [PName in keyof PSchema]: InferPropType<PSchema[PName]>;
};
2;
