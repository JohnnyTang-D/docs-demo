import { Props, PropSchema } from '@/schema';

// 定义基础区块配置类型
// inline是 段落 标题 列表项以及引用的类型 可由用户输入,施加格式样式的行内内容流.
// table 是 表格,每个单元格都是小型的inline文本流
// none 是 块级内容流,不可由用户输入,不能被格式样式化,如图片 视频 音频 分割线等,都是通过props进行管理的,不由用户输入
export type BlockConfig = {
  type: string;
  content: 'inline' | 'none' | 'table';
  readonly propSchema: PropSchema;
};

// 扩展出自定义区块配置类型
export type CustomBlockConfig = BlockConfig & {
  content: 'inline' | 'none';
};
type PartialBlockFromConfigNoChildren<B extends BlockConfig> = {
  type?: B['type'];
  content?: B['content'];
  props?: Partial<Props<B['propSchema']>>;

  id?: string;
};

export type PartialBlockFromConfig<T extends BlockConfig> =
  PartialBlockFromConfigNoChildren<T>;
