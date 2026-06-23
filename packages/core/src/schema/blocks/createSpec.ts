import {
  createBlockRules,
  createStronglyTypedTiptapNode,
  propsToAttributes,
  wrapInBlockStructure,
} from '@/schema';
import type {
  CustomBlockConfig,
  PartialBlockFromConfig,
  StyleSchema,
  InlineContentSchema,
} from '@/schema';

export type CustomBlockImplementation<
  C extends CustomBlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  parse?: (
    el: HTMLElement,
  ) => PartialBlockFromConfig<C, I, S>['props'] | undefined;
};

// 根据区块配置创建 Tiptap Node 规格说明
export function createBlockSpec<
  C extends CustomBlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(blockConfig: C, blockImplementation: CustomBlockImplementation<C, I, S>) {
  let { content, type, propSchema } = blockConfig;

  const node = createStronglyTypedTiptapNode({
    name: type as C['type'],
    content: (content === 'inline'
      ? 'inline*'
      : '') as C['content'] extends 'inline' ? 'inline*' : '',
    group: 'blockContent',
    addAttributes() {
      return propsToAttributes(propSchema);
    },
    parseHTML() {
      return createBlockRules<C, I, S>(blockConfig, blockImplementation.parse);
    },
    renderHTML({ HTMLAttributes }) {
      const div = document.createElement('div');
      return wrapInBlockStructure(
        {
          dom: div,
          contentDOM: content === 'inline' ? div : undefined,
        },
        type,
        HTMLAttributes, // 这里使用HTMLAttributes 是因为要兼容复制粘贴  复制粘贴要使用最外层的元素id
      );
    },
  });

  if (node.name !== type) {
    throw new Error(
      `Block type ${type} is not equal to node name ${node.name}`,
    );
  }

  return {
    config: blockConfig,
    implementation: {
      node,
    },
  };
}
