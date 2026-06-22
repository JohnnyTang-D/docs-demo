import { PartialBlockFromConfig } from '@/schema';
import { CustomBlockConfig } from './types';
import {
  createBlockAttributes,
  createBlockRules,
  createStronglyTypedTiptapNode,
  wrapInBlockStructure,
} from '@/schema/blocks/internal';

export type CustomBlockImplementation<T extends CustomBlockConfig> = {
  parse?: (el: HTMLElement) => PartialBlockFromConfig<T>['props'] | undefined;
};

// 根据区块配置创建 Tiptap Node 规格说明
export function createBlockSpec<T extends CustomBlockConfig>(
  blockConfig: T,
  blockImplementation: CustomBlockImplementation<T>,
) {
  let { content, type, propSchema } = blockConfig;

  const node = createStronglyTypedTiptapNode({
    name: type as T['type'],
    content: (content === 'inline'
      ? 'inline*'
      : '') as T['content'] extends 'inline' ? 'inline*' : '',
    group: 'blockContent',
    addAttributes() {
      return createBlockAttributes(propSchema);
    },
    parseHTML() {
      return createBlockRules(blockConfig, blockImplementation.parse);
    },
    renderHTML({ HTMLAttributes }) {
      const div = document.createElement('div');
      return wrapInBlockStructure(
        {
          dom: div,
          contentDOM: content === 'inline' ? div : undefined,
        },
        type,
        propSchema,
        HTMLAttributes,
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
