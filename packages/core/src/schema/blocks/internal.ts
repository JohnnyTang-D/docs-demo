import { NodeConfig } from '@tiptap/core';
import { Attribute, Node } from '@tiptap/core';
import { BlockConfig, CustomBlockImplementation, PropSchema } from '@/schema';
import { TagParseRule } from '@tiptap/pm/model';
import { mergeCSSClasses } from '@/utils/browser';

type StronglyTypedTipTapNode<
  Name extends string,
  Content extends 'inline*' | 'tableRow+' | '',
> = Node & {
  name: Name;
  config: { content: Content };
};
/**
 * 创建一个强类型（Tiptap 节点）
 * @param config 节点配置
 * @returns 强类型（Tiptap 节点）
 */
export function createStronglyTypedTiptapNode<
  Name extends string,
  Content extends 'inline*' | 'tableRow+' | '',
>(config: NodeConfig & { name: Name; content: Content }) {
  return Node.create(config) as StronglyTypedTipTapNode<Name, Content>; // force re-typing (should be safe as it's type-checked from the config)
}
/**
 * 将区块配置的属性 Schema 转换为 Tiptap Node 属性规格
 * @param propSchema 区块属性的 Schema 配置
 * @returns 转换后的 Tiptap 属性配置映射表
 */
export function createBlockAttributes(
  propSchema: PropSchema,
): Record<string, Attribute> {
  const tiptapAttributes: Record<string, Attribute> = {};

  Object.entries(propSchema).forEach(([name, spec]) => {
    tiptapAttributes[name] = {
      default: spec.default,
      keepOnSplit: true,
      parseHTML: (element) => {
        const attributeValue = element.getAttribute(
          `data-${name.toLowerCase()}`,
        );
        if (attributeValue === null) {
          return null;
        }

        if (typeof spec.default === 'boolean') {
          if (attributeValue === 'true') {
            return true;
          }

          if (attributeValue === 'false') {
            return false;
          }

          return null;
        }

        if (typeof spec.default === 'number') {
          const asNumber = parseFloat(attributeValue);
          const isNumeric =
            !Number.isNaN(asNumber) && Number.isFinite(asNumber);

          if (isNumeric) {
            return asNumber;
          }

          return null;
        }

        return attributeValue;
      },
    };
  });

  return tiptapAttributes;
}

/**
 * 创建区块的解析规则
 * @param config 区块配置
 * @param customParseFunction 自定义解析函数
 * @returns 解析规则
 */
export function createBlockRules(
  config: BlockConfig,
  customParseFunction: CustomBlockImplementation<any>['parse'],
) {
  const { type, propSchema } = config;
  const rules: TagParseRule[] = [
    {
      tag: `[data-content-type=\`${type}']`,
      contentElement: '[data-editable]',
    },
  ];

  if (customParseFunction) {
    rules.push({
      tag: ':*',
      getAttrs(node: string | HTMLElement) {
        if (typeof node === 'string') {
          return false;
        }
        const props = customParseFunction(node);
        if (props === undefined) {
          return false;
        }
        return props;
      },
    });
  }
  return rules;
}

/**
 * 封装区块结构
 * @param element 节点元素
 * @param blockType 区块类型
 * @param propSchema 区块属性 Schema
 * @param HTMLAttributes 区块属性
 * @returns 封装后的节点元素
 */
export function wrapInBlockStructure<
  BType extends string,
  PSchema extends PropSchema,
>(
  element: {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
  },
  blockType: BType,
  propSchema: PSchema,
  HTMLAttributes?: Record<string, string>,
) {
  const blockContent = document.createElement('div');

  const { dom, contentDOM } = element;

  if (HTMLAttributes !== undefined) {
    Object.entries(HTMLAttributes).forEach(([name, value]) => {
      if (name !== 'class') {
        blockContent.setAttribute(name, value);
      }
    });
  }

  blockContent.className = mergeCSSClasses(
    'bn-block-content',
    HTMLAttributes?.class || '',
  );
  blockContent.setAttribute('data-content-type', blockType);

  blockContent.appendChild(dom);

  if (contentDOM !== undefined) {
    dom.className = mergeCSSClasses('bn-inline-content', dom.className);
    dom.setAttribute('data-editable', '');
  }
  return {
    ...element,
    contentDOM: blockContent,
  };
}
