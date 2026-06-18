import { Props, PropSchema } from '@/schema';

// 定义基础区块配置类型
export type BlockConfig = {
  type: string;
  content: 'inline' | 'none' | 'table';
  readonly propSchema: PropSchema;
  isSelectable?: boolean;
  isFileBlock?: false;
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
