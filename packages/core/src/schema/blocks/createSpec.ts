import { Attribute, Node } from '@tiptap/core';
import { CustomBlockConfig } from './types';

// 根据区块配置创建 Tiptap Node 规格说明
export function createBlockSpec<T extends CustomBlockConfig>(blockConfig: T) {
  return Node.create({
    name: blockConfig.type,
    content: blockConfig.content,
    group: 'blockContent',
    selectable: blockConfig?.isSelectable ?? true,
    addAttributes() {
      const tiptapAttributes: Record<string, Attribute> = {};

      Object.entries(blockConfig.propSchema)
        .filter(([name]) => !['backgroundColor', 'textColor'].includes(name))
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
    },
  });
}
