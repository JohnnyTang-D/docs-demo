import { describe, it, expect, vi } from 'vitest';
import { createBlockSpec } from '@/index';
import type { CustomBlockConfig, CustomBlockImplementation } from '@/index';

describe('createBlockSpec', () => {
  // 默认实现，作为一个占位符传入
  const defaultImpl: CustomBlockImplementation<any, any, any> = {};

  // 测试配置工厂函数，生成基础区块配置
  const createTestConfig = (
    overrides?: Partial<CustomBlockConfig>,
  ): CustomBlockConfig => ({
    type: 'callout',
    content: 'inline',
    propSchema: {
      emoji: { default: '💡' },
      isPinned: { default: false },
      level: { default: 1 },
    },
    ...overrides,
  });

  describe('节点基本配置', () => {
    it('应该返回包含 config 和 implementation 的对象且 node 实例有效', () => {
      const config = createTestConfig();
      const result = createBlockSpec(config, defaultImpl);
      expect(result).toBeDefined();
      expect(result.config).toBe(config);
      expect(result.implementation.node.name).toBe('callout');
    });

    it('name 应该与 blockConfig.type 保持一致', () => {
      const config = createTestConfig({ type: 'alert' });
      const {
        implementation: { node },
      } = createBlockSpec(config, defaultImpl);
      expect(node.name).toBe('alert');
    });

    it('content 应该正确映射自 blockConfig.content', () => {
      const {
        implementation: { node: inlineNode },
      } = createBlockSpec(createTestConfig({ content: 'inline' }), defaultImpl);
      const {
        implementation: { node: noneNode },
      } = createBlockSpec(createTestConfig({ content: 'none' }), defaultImpl);

      expect(inlineNode.config.content).toBe('inline*');
      expect(noneNode.config.content).toBe('');
    });

    it('group 应该始终为 "blockContent"', () => {
      const config = createTestConfig();
      const {
        implementation: { node },
      } = createBlockSpec(config, defaultImpl);
      expect(node.config.group).toBe('blockContent');
    });
  });

  describe('addAttributes', () => {
    // 辅助函数：通过配置项获取解析后的 Tiptap 属性配置
    const getAttributes = (config: CustomBlockConfig) => {
      const {
        implementation: { node },
      } = createBlockSpec(config, defaultImpl);
      return node.config.addAttributes?.call({} as any) as Record<string, any>;
    };

    // 获取基于默认配置的常用属性配置
    const getBaseAttrs = () => getAttributes(createTestConfig());

    describe('基础属性映射', () => {
      it('应该将 propSchema 中的属性映射为 Tiptap 属性', () => {
        const attrs = getBaseAttrs();

        expect(attrs).toHaveProperty('emoji');
        expect(attrs).toHaveProperty('isPinned');
        expect(attrs).toHaveProperty('level');
      });

      it('每个属性应该包含正确的 default 值', () => {
        const attrs = getBaseAttrs();

        expect(attrs.emoji.default).toBe('💡');
        expect(attrs.isPinned.default).toBe(false);
        expect(attrs.level.default).toBe(1);
      });

      it('每个属性的 keepOnSplit 应该为 true', () => {
        const attrs = getBaseAttrs();

        expect(attrs.emoji.keepOnSplit).toBe(true);
        expect(attrs.isPinned.keepOnSplit).toBe(true);
        expect(attrs.level.keepOnSplit).toBe(true);
      });
    });

    describe('特定属性过滤与边界情况', () => {
      it('当 propSchema 为空时，应该返回空对象', () => {
        const attrs = getAttributes(createTestConfig({ propSchema: {} }));

        expect(attrs).toEqual({});
      });
    });

    describe('parseHTML 行为', () => {
      const mockElement = (val: string | null) =>
        ({
          getAttribute: () => val,
        }) as unknown as HTMLElement;

      it('当 data- 属性不存在时，应返回 null', () => {
        const attrs = getBaseAttrs();
        const el = mockElement(null);

        expect(attrs.emoji.parseHTML(el)).toBeNull();
        expect(attrs.isPinned.parseHTML(el)).toBeNull();
        expect(attrs.level.parseHTML(el)).toBeNull();
      });

      it('布尔值属性应正确解析', () => {
        const attrs = getBaseAttrs();

        expect(attrs.isPinned.parseHTML(mockElement('true'))).toBe(true);
        expect(attrs.isPinned.parseHTML(mockElement('false'))).toBe(false);
        expect(attrs.isPinned.parseHTML(mockElement('other'))).toBeNull();
      });

      it('数字属性应正确解析', () => {
        const attrs = getBaseAttrs();

        expect(attrs.level.parseHTML(mockElement('123'))).toBe(123);
        expect(attrs.level.parseHTML(mockElement('3.14'))).toBe(3.14);
        expect(attrs.level.parseHTML(mockElement('abc'))).toBeNull();
      });

      it('字符串属性应正确解析', () => {
        const attrs = getBaseAttrs();

        expect(attrs.emoji.parseHTML(mockElement('🔥'))).toBe('🔥');
      });

      it('应该使用小写的 data 属性名称来获取属性值', () => {
        const attrs = getAttributes({
          type: 'test',
          content: 'none',
          propSchema: {
            camelCaseName: { default: 'test' },
          },
        });

        let requestedAttributeName = '';
        const el = {
          getAttribute: (name: string) => {
            requestedAttributeName = name;
            return 'value';
          },
        } as HTMLElement;

        attrs.camelCaseName.parseHTML(el);
        expect(requestedAttributeName).toBe('data-camelcasename');
      });
    });
  });

  describe('parseHTML 规则配置 (Tiptap parseHTML)', () => {
    it('当没有提供自定义 parse 函数时，应该只有默认的类型解析规则', () => {
      const config = createTestConfig({ type: 'banner' });
      const {
        implementation: { node },
      } = createBlockSpec(config, {});
      const rules = node.config.parseHTML?.call({} as any);

      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);
      expect(rules?.[0]).toEqual({
        tag: "[data-content-type=`banner']",
        contentElement: '[data-editable]',
      });
    });

    it('当提供了自定义 parse 函数时，应该包含属性提取规则，且 getAttrs 回调行为正确', () => {
      const config = createTestConfig({ type: 'banner' });
      const customParse = vi.fn();
      const {
        implementation: { node },
      } = createBlockSpec(config, { parse: customParse });
      const rules = node.config.parseHTML?.call({} as any);

      expect(rules).toBeDefined();
      expect(rules).toHaveLength(2);
      expect(rules?.[0]?.tag).toBe("[data-content-type=`banner']");
      expect(rules?.[0]?.contentElement).toBe('[data-editable]');

      const secondRule = rules?.[1];
      expect(secondRule?.tag).toBe(':*');
      expect(secondRule?.getAttrs).toBeDefined();

      // 1. 如果传入 the node 为 string，应该返回 false
      expect(secondRule?.getAttrs?.('string-node' as any)).toBe(false);
      expect(customParse).not.toHaveBeenCalled();

      // 2. 如果自定义 parse 函数返回 undefined，应该返回 false
      const mockEl = {} as HTMLElement;
      customParse.mockReturnValueOnce(undefined);
      expect(secondRule?.getAttrs?.(mockEl)).toBe(false);
      expect(customParse).toHaveBeenCalledWith(mockEl);

      // 3. 如果自定义 parse 函数返回具体属性，应该返回解析出来的属性
      const parsedProps = { emoji: '🚀' };
      customParse.mockReturnValueOnce(parsedProps);
      expect(secondRule?.getAttrs?.(mockEl)).toEqual(parsedProps);
    });
  });

  describe('renderHTML', () => {
    // 辅助函数：通过配置项和参数调用节点的 renderHTML 并返回结果
    const renderNodeHTML = (
      config: CustomBlockConfig,
      HTMLAttributes: Record<string, any> = {},
    ) => {
      const {
        implementation: { node },
      } = createBlockSpec(config, defaultImpl);
      // 调用 renderHTML 函数
      return node.config.renderHTML?.call({} as any, {
        node: {} as any,
        HTMLAttributes,
      });
    };

    it('应该返回包含 dom 结构的对象，且外层容器包含正确的类名和 data-content-type', () => {
      const config = createTestConfig({ type: 'callout' });
      const result = renderNodeHTML(config);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(Array.isArray(result)).toBe(false);

      const output = result as { dom: HTMLElement; contentDOM: HTMLElement };
      expect(output.dom).toBeInstanceOf(HTMLElement);
      expect(output.contentDOM).toBeInstanceOf(HTMLElement);

      const contentDOM = output.contentDOM;
      // 验证外层容器的类名和属性
      expect(contentDOM.tagName.toLowerCase()).toBe('div');
      expect(contentDOM.classList.contains('bn-block-content')).toBe(true);
      expect(contentDOM.getAttribute('data-content-type')).toBe('callout');
    });

    it('当传入 HTMLAttributes 时，应该正确合并 class 并将其他属性挂载到外层容器', () => {
      const config = createTestConfig({ type: 'callout' });
      const result = renderNodeHTML(config, {
        class: 'my-custom-class',
        'data-id': '12345',
        style: 'color: red;',
      });

      const output = result as { dom: HTMLElement; contentDOM: HTMLElement };
      const contentDOM = output.contentDOM;
      // 验证类名是否合并
      expect(contentDOM.className).toContain('bn-block-content');
      expect(contentDOM.className).toContain('my-custom-class');
      // 验证其他属性是否被挂载
      expect(contentDOM.getAttribute('data-id')).toBe('12345');
      expect(contentDOM.getAttribute('style')).toBe('color: red;');
    });

    it('当 content 为 "inline" 时，应该渲染可编辑的 inline 子容器并返回 contentDOM', () => {
      const config = createTestConfig({ content: 'inline' });
      const result = renderNodeHTML(config);

      const output = result as { dom: HTMLElement; contentDOM: HTMLElement };
      const dom = output.dom;
      const contentDOM = output.contentDOM;

      // 验证子容器是否正确挂载到外层容器
      expect(contentDOM.firstElementChild).toBe(dom);
      expect(dom).toBeDefined();
      expect(dom.tagName.toLowerCase()).toBe('div');
      // 验证 inline 容器特有的类名和属性
      expect(dom.classList.contains('bn-inline-content')).toBe(true);
      expect(dom.hasAttribute('data-editable')).toBe(true);
    });

    it('当 content 不为 "inline" 时，子容器不应该有 inline 相关属性且 contentDOM 应为外层包装容器', () => {
      const config = createTestConfig({ content: 'none' });
      const result = renderNodeHTML(config);

      const output = result as { dom: HTMLElement; contentDOM: HTMLElement };
      const dom = output.dom;
      const contentDOM = output.contentDOM;

      // 验证子容器挂载在外层容器内
      expect(contentDOM.firstElementChild).toBe(dom);
      expect(dom).toBeDefined();
      expect(dom.tagName.toLowerCase()).toBe('div');
      // 验证子容器没有 inline 的类名和可编辑属性
      expect(dom.classList.contains('bn-inline-content')).toBe(false);
      expect(dom.hasAttribute('data-editable')).toBe(false);
    });
  });
});
