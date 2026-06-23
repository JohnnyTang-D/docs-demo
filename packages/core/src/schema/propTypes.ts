type PTypeMap = boolean | number | string;

export type PropSpec<PType extends PTypeMap> = {
  values?: readonly PType[];
  default: PType;
};

export type PropSchema = Record<string, PropSpec<PTypeMap>>;

type InferPropType<T extends PropSpec<PTypeMap>> =
  T extends PropSpec<infer P>
    ? T['values'] extends readonly (infer V)[]
      ? V
      : P
    : never;

// 最终 Props 的生成，完全由泛型“控制”推导过程
export type Props<PSchema extends PropSchema> = {
  [PName in keyof PSchema]: InferPropType<PSchema[PName]>;
};
