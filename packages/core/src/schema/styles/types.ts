import { Mark } from '@tiptap/core';

// 斜体 粗体这种只需要是否有的状态 是boolean
// 字体颜色以及大小这种是有值的情况 是string 通过props传入,然后转换为'data-value' attribute存储
export type StylePropSchema = 'boolean' | 'string';

// 通过 'data-style-type'来存储type类型
export type StyleConfig = {
  type: string;
  readonly propSchema: StylePropSchema;
};

export type StyleSchema = Record<string, StyleConfig>;

export type StyleImplementation = {
  mark: Mark;
};

export type StyleSpec<T extends StyleConfig> = {
  config: T;
  implementation: StyleImplementation;
};

export type Styles<T extends StyleSchema> = {
  [K in keyof T]?: T[K]['propSchema'] extends 'boolean'
    ? boolean
    : T[K]['propSchema'] extends 'string'
      ? string
      : never;
};
