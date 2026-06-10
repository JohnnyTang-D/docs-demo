import { describe, it, expect } from 'vitest';
import { createBlockSpec } from '@/index';
import type { CustomBlockConfig } from '@/index';

describe('createBlockSpec', () => {
  // 构建一个基础区块配置，用于大多数测试用例
  const baseConfig: CustomBlockConfig = {
    type: 'callout',
    content: 'inline',
    propSchema: {
      emoji: { default: '💡' },
      isPinned: { default: false },
      level: { default: 1 },
    },
  };

  it('应该返回一个 Tiptap Node 实例', () => {
    const node = createBlockSpec(baseConfig);
    expect(node).toBeDefined();
    expect(node.name).toBe('callout');
  });

  it('name 应该与 blockConfig.type 保持一致', () => {
    const config: CustomBlockConfig = { ...baseConfig, type: 'alert' };
    const node = createBlockSpec(config);
    expect(node.name).toBe('alert');
  });

  it('content 应该正确映射自 blockConfig.content', () => {
    const inlineNode = createBlockSpec({ ...baseConfig, content: 'inline' });
    const noneNode = createBlockSpec({ ...baseConfig, content: 'none' });

    expect(inlineNode.config.content).toBe('inline');
    expect(noneNode.config.content).toBe('none');
  });

  it('group 应该始终为 "blockContent"', () => {
    const node = createBlockSpec(baseConfig);
    expect(node.config.group).toBe('blockContent');
  });

  describe('selectable 配置', () => {
    it('默认情况下 selectable 应该为 true', () => {
      const node = createBlockSpec(baseConfig);
      expect(node.config.selectable).toBe(true);
    });

    it('当 isSelectable 设置为 false 时，selectable 应该为 false', () => {
      const config: CustomBlockConfig = { ...baseConfig, isSelectable: false };
      const node = createBlockSpec(config);
      expect(node.config.selectable).toBe(false);
    });

    it('当 isSelectable 设置为 true 时，selectable 应该为 true', () => {
      const config: CustomBlockConfig = { ...baseConfig, isSelectable: true };
      const node = createBlockSpec(config);
      expect(node.config.selectable).toBe(true);
    });
  });

  describe('addAttributes', () => {
    it('应该将 propSchema 中的属性映射为 Tiptap 属性', () => {
      const node = createBlockSpec(baseConfig);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs).toHaveProperty('emoji');
      expect(attrs).toHaveProperty('isPinned');
      expect(attrs).toHaveProperty('level');
    });

    it('每个属性应该包含正确的 default 值', () => {
      const node = createBlockSpec(baseConfig);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs.emoji.default).toBe('💡');
      expect(attrs.isPinned.default).toBe(false);
      expect(attrs.level.default).toBe(1);
    });

    it('每个属性的 keepOnSplit 应该为 true', () => {
      const node = createBlockSpec(baseConfig);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs.emoji.keepOnSplit).toBe(true);
      expect(attrs.isPinned.keepOnSplit).toBe(true);
      expect(attrs.level.keepOnSplit).toBe(true);
    });

    it('应该过滤掉 backgroundColor 属性', () => {
      const config: CustomBlockConfig = {
        ...baseConfig,
        propSchema: {
          ...baseConfig.propSchema,
          backgroundColor: { default: '#fff' },
        },
      };
      const node = createBlockSpec(config);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs).not.toHaveProperty('backgroundColor');
      expect(attrs).toHaveProperty('emoji');
    });

    it('应该过滤掉 textColor 属性', () => {
      const config: CustomBlockConfig = {
        ...baseConfig,
        propSchema: {
          ...baseConfig.propSchema,
          textColor: { default: '#000' },
        },
      };
      const node = createBlockSpec(config);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs).not.toHaveProperty('textColor');
      expect(attrs).toHaveProperty('emoji');
    });

    it('应该同时过滤掉 backgroundColor 和 textColor', () => {
      const config: CustomBlockConfig = {
        ...baseConfig,
        propSchema: {
          ...baseConfig.propSchema,
          backgroundColor: { default: '#fff' },
          textColor: { default: '#000' },
        },
      };
      const node = createBlockSpec(config);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs).not.toHaveProperty('backgroundColor');
      expect(attrs).not.toHaveProperty('textColor');
      // 其他属性仍然存在
      expect(Object.keys(attrs)).toHaveLength(3);
    });

    it('当 propSchema 为空时，应该返回空对象', () => {
      const config: CustomBlockConfig = {
        ...baseConfig,
        propSchema: {},
      };
      const node = createBlockSpec(config);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;

      expect(attrs).toEqual({});
    });
  });

  describe('parseHTML（属性级别）', () => {
    // 辅助函数：创建 DOM 元素并设置属性，模拟 Tiptap 调用 parseHTML
    function createElement(attrs: Record<string, string>): HTMLElement {
      const el = document.createElement('div');
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
      return el;
    }

    function getAttrParseHTML(name: string) {
      const node = createBlockSpec(baseConfig);
      const attrs = node.config.addAttributes?.call({} as any) as Record<
        string,
        any
      >;
      return attrs[name].parseHTML;
    }

    describe('字符串类型属性', () => {
      it('应该从 data-{name} 属性中读取字符串值', () => {
        const parseHTML = getAttrParseHTML('emoji');
        const el = createElement({ 'data-emoji': '🎉' });
        expect(parseHTML(el)).toBe('🎉');
      });

      it('当 DOM 属性不存在时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('emoji');
        const el = createElement({});
        expect(parseHTML(el)).toBeNull();
      });
    });

    describe('布尔类型属性', () => {
      it('应该将 "true" 字符串解析为 true', () => {
        const parseHTML = getAttrParseHTML('isPinned');
        const el = createElement({ 'data-ispinned': 'true' });
        expect(parseHTML(el)).toBe(true);
      });

      it('应该将 "false" 字符串解析为 false', () => {
        const parseHTML = getAttrParseHTML('isPinned');
        const el = createElement({ 'data-ispinned': 'false' });
        expect(parseHTML(el)).toBe(false);
      });

      it('当值既非 "true" 也非 "false" 时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('isPinned');
        const el = createElement({ 'data-ispinned': 'yes' });
        expect(parseHTML(el)).toBeNull();
      });

      it('当 DOM 属性不存在时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('isPinned');
        const el = createElement({});
        expect(parseHTML(el)).toBeNull();
      });
    });

    describe('数字类型属性', () => {
      it('应该正确解析整数字符串', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': '3' });
        expect(parseHTML(el)).toBe(3);
      });

      it('应该正确解析浮点数字符串', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': '2.5' });
        expect(parseHTML(el)).toBe(2.5);
      });

      it('当值为非数字字符串时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': 'abc' });
        expect(parseHTML(el)).toBeNull();
      });

      it('当值为 Infinity 字符串时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': 'Infinity' });
        expect(parseHTML(el)).toBeNull();
      });

      it('当 DOM 属性不存在时，应该返回 null', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({});
        expect(parseHTML(el)).toBeNull();
      });

      it('应该正确解析负数', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': '-1' });
        expect(parseHTML(el)).toBe(-1);
      });

      it('应该正确解析 0', () => {
        const parseHTML = getAttrParseHTML('level');
        const el = createElement({ 'data-level': '0' });
        expect(parseHTML(el)).toBe(0);
      });
    });

    describe('属性名大小写处理', () => {
      it('data 属性名应该使用小写形式（camelCase → lowercase）', () => {
        const config: CustomBlockConfig = {
          ...baseConfig,
          propSchema: {
            fontSize: { default: 14 },
          },
        };
        const node = createBlockSpec(config);
        const attrs = node.config.addAttributes?.call({} as any) as Record<
          string,
          any
        >;
        const parseHTML = attrs.fontSize.parseHTML;

        // toLowerCase('fontSize') → 'fontsize'
        const el = createElement({ 'data-fontsize': '16' });
        expect(parseHTML(el)).toBe(16);
      });
    });
  });

  describe('parseHTML（节点级别）', () => {
    it('节点级 parseHTML 应该存在且为函数', () => {
      const node = createBlockSpec(baseConfig);
      expect(typeof node.config.parseHTML).toBe('function');
    });
  });
});
