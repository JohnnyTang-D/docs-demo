import type {
  InlineContent,
  InlineContentSchema,
  PartialInlineContent,
  Props,
  PropSchema,
  StyleSchema,
} from '@/schema';

// 确保编译阶段的时候 字典的key 和 配置里面的type属性值 是一致的
type NamesMatch<Blocks extends Record<string, BlockConfig>> = Blocks extends {
  [Type in keyof Blocks]: Type extends string
    ? Blocks[Type] extends { type: Type }
      ? Blocks[Type]
      : never
    : never;
}
  ? Blocks
  : never;
/*
 * 垂直单元
 * 支持块级深度嵌套
 * 整体拖拽和移动 回车产生新的垂直单元
 */
// inline是 段落 标题 列表项以及引用的类型 可由用户输入,施加格式样式的行内内容流.
// table 是 表格,每个单元格都是小型的inline文本流
// none 是 块级内容流,不可由用户输入,不能被格式样式化,如图片 视频 音频 分割线等,都是通过props进行管理的,不由用户输入
export type BlockConfig = {
  type: string;
  content: 'inline' | 'none' | 'table';
  readonly propSchema: PropSchema;
};
// 块级内容的key 和 里面的type 一致
export type BlockSchema = NamesMatch<Record<string, BlockConfig>>;
// 扩展出自定义区块配置类型
export type CustomBlockConfig = BlockConfig & {
  content: 'inline' | 'none';
};
type PartialBlockFromConfigNoChildren<
  B extends BlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  type?: B['type'];
  content?: B['content'] extends 'inline'
    ? PartialInlineContent<I, S>
    : undefined;
  props?: Partial<Props<B['propSchema']>>;

  id?: string;
};

export type TableContent<
  I extends InlineContentSchema,
  S extends StyleSchema = StyleSchema,
> = {
  type: 'tableContent';
  columnWidths: (number | undefined)[];
  rows: {
    cells: InlineContent<I, S>[][];
  }[];
};

export type BlockFromConfigNoChildren<
  B extends BlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  id: string;
  type: B['type'];
  props: Props<B['propSchema']>;
  content: B['content'] extends 'inline'
    ? InlineContent<I, S>[]
    : B['content'] extends 'table'
      ? TableContent<I, S>
      : B['content'] extends 'none'
        ? undefined
        : never;
};
type BlocksWithoutChildren<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  [BType in keyof BSchema]: BlockFromConfigNoChildren<BSchema[BType], I, S>;
};

export type BlockNoDefaults<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = BlocksWithoutChildren<BSchema, I, S>[keyof BSchema] & {
  children: BlockNoDefaults<BSchema, I, S>[];
};

export type PartialBlockFromConfig<
  B extends BlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = PartialBlockFromConfigNoChildren<B, I, S> & {
  children?: BlockNoDefaults<BlockSchema, I, S>[];
};
