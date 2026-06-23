import type { Props, PropSchema, Styles, StyleSchema } from '@/schema';

// styled 代表的是 富文本包裹性行内内容 行内节点可以拥有子内容 比如评论,对一段文字加上评论,这个评论是可以带某些样式的,可被分割
// none 代表的是行内内容 不可分割的内容 比如提及@ 标签 公式
export type CustomInlineContentConfig = {
  type: string;
  content: 'styled' | 'none';
  readonly propSchema: PropSchema;
};

// text 最基础的文本
// link 超链接
// 两个tiptap原生支持
export type InlineContentConfig = CustomInlineContentConfig | 'text' | 'link';

export type InlineContentSchema = Record<string, InlineContentConfig>;

export type StyledText<T extends StyleSchema> = {
  type: 'text';
  text: string;
  styles: Styles<T>;
};

export type Link<T extends StyleSchema> = {
  type: 'link';
  href: string;
  content: StyledText<T>[];
};
export type PartialLink<S extends StyleSchema> = Omit<Link<S>, 'content'> & {
  content: string | Link<S>['content'];
};

export type CustomInlineContentFromConfig<
  I extends CustomInlineContentConfig,
  S extends StyleSchema,
> = {
  type: I['type'];
  props: Props<I['propSchema']>;
  content: I['content'] extends 'styled'
    ? StyledText<S>[]
    : I['content'] extends 'none'
      ? undefined
      : never;
};
export type PartialCustomInlineContentFromConfig<
  C extends CustomInlineContentConfig,
  S extends StyleSchema,
> = {
  type: C['type'];
  props?: Props<C['propSchema']>;
  content?: C['content'] extends 'styled'
    ? StyledText<S>[] | string
    : C['content'] extends 'plain'
      ? string
      : C['content'] extends 'none'
        ? undefined
        : never;
};

export type InlineContentFromConfig<
  I extends InlineContentConfig,
  S extends StyleSchema,
> = I extends 'text'
  ? StyledText<S>
  : I extends 'link'
    ? Link<S>
    : I extends CustomInlineContentConfig
      ? CustomInlineContentFromConfig<I, S>
      : never;

export type PartialInlineContentFromConfig<
  I extends InlineContentConfig,
  S extends StyleSchema,
> = I extends 'text'
  ? string | StyledText<S>
  : I extends 'link'
    ? PartialLink<S>
    : I extends CustomInlineContentConfig
      ? PartialCustomInlineContentFromConfig<I, S>
      : never;

type PartialInlineContentElement<
  I extends InlineContentSchema,
  S extends StyleSchema,
> = PartialInlineContentFromConfig<I[keyof I], S>;

export type PartialInlineContent<
  I extends InlineContentSchema,
  S extends StyleSchema,
> = PartialInlineContentElement<I, S>[] | string;
