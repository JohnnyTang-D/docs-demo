import { Attribute, Node } from '@tiptap/core';
import { PartialBlockFromConfig, PropSchema } from '@/schema';
import { CustomBlockConfig } from './types';
import { TagParseRule } from '@tiptap/pm/model';
import { mergeCSSClasses } from '../../../utils/browser';
import { inheritedProps } from '@/defaultProps';
import { camelToDataKebab } from '../../../utils/string';

/**
 * 将区块配置的属性 Schema 转换为 Tiptap Node 属性规格
 * @param propSchema 区块属性的 Schema 配置
 * @returns 转换后的 Tiptap 属性配置映射表
 */
export function createBlockAttributes(
  propSchema: PropSchema,
): Record<string, Attribute> {
  const tiptapAttributes: Record<string, Attribute> = {};

  Object.entries(propSchema)
    .filter(([name]) => !inheritedProps.includes(name))
    .forEach(([name, spec]) => {
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

export type CustomBlockImplementation<T extends CustomBlockConfig> = {
  parse?: (el: HTMLElement) => PartialBlockFromConfig<T>['props'] | undefined;
};

// 根据区块配置创建 Tiptap Node 规格说明
export function createBlockSpec<T extends CustomBlockConfig>(
  blockConfig: T,
  blockImplementation: CustomBlockImplementation<T>,
) {
  let { content, type, propSchema, isSelectable } = blockConfig;

  return Node.create({
    name: type,
    content: content,
    group: 'blockContent',
    selectable: isSelectable ?? true,
    addAttributes() {
      return createBlockAttributes(propSchema);
    },
    parseHTML() {
      const { parse } = blockImplementation;

      const rules: TagParseRule[] = [
        {
          tag: `[data-content-type=\`${type}']`,
          contentElement: '[dta-editable]',
        },
      ];

      if (parse) {
        rules.push({
          tag: ':*',
          getAttrs(node: string | HTMLElement) {
            if (typeof node === 'string') {
              return false;
            }
            const props = parse(node);
            if (props === undefined) {
              return false;
            }
            return props;
          },
        });
      }
      return rules;
    },
    renderHTML({ HTMLAttributes }) {
      const div = document.createElement('div');

      const blockContent = document.createElement('div');

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
      blockContent.setAttribute('data-content-type', type);

      blockContent.appendChild(div);

      if (content === 'inline') {
        div.className = mergeCSSClasses('bn-inline-content', div.className);
        div.setAttribute('data-editable', '');
      }
      return {
        dom: blockContent,
        contentDOM: content === 'inline' ? div : undefined,
      };
    },
    addNodeView() {
      return ({ getPos }) => {
        const editor = this.options.editor;
        g;
      };
    },
  });
}
