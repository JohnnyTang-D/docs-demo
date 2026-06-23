import { describe, it, expect, vi } from 'vitest';
import { createInlineContentSpec } from '@/index';
import type {
  CustomInlineContentConfig,
  CustomInlineContentImplementation,
} from '@/index';

describe('createInlineContentSpec', () => {
  // 模拟自定义 inline content 实现
  const createMockImplementation = (
    renderMock = vi.fn().mockImplementation(() => ({
      dom: document.createElement('span'),
      contentDOM: undefined,
    })),
  ): CustomInlineContentImplementation<any, any> => ({
    render: renderMock,
  });

  // 测试配置工厂函数
  const createTestConfig = (
    overrides?: Partial<CustomInlineContentConfig>,
  ): CustomInlineContentConfig => ({
    type: 'mention',
    content: 'none',
    propSchema: {
      id: { default: '' },
      label: { default: 'default-label' },
    },
    ...overrides,
  });

  describe('节点基本配置', () => {
    it('应该返回包含 config 和 implementation 的对象且 node 实例有效', () => {
      const config = createTestConfig();
      const impl = createMockImplementation();
      const result = createInlineContentSpec(config, impl);

      expect(result).toBeDefined();
      expect(result.config).toBe(config);
      expect(result.implementation.node.name).toBe('mention');
    });

    it('name 应该与 config.type 保持一致', () => {
      const config = createTestConfig({ type: 'badge' });
      const impl = createMockImplementation();
      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      expect(node.name).toBe('badge');
    });

    it('inline 属性应该为 true', () => {
      const config = createTestConfig();
      const impl = createMockImplementation();
      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      expect(node.config!.inline).toBe(true);
    });

    it('group 属性应该为 "inline"', () => {
      const config = createTestConfig();
      const impl = createMockImplementation();
      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      expect(node.config!.group).toBe('inline');
    });

    it('atom 和 content 属性应该正确反映 "none" 和 "styled" 的配置', () => {
      const {
        implementation: { node: noneNode },
      } = createInlineContentSpec(
        createTestConfig({ content: 'none' }),
        createMockImplementation(),
      );
      const {
        implementation: { node: styledNode },
      } = createInlineContentSpec(
        createTestConfig({ content: 'styled' }),
        createMockImplementation(),
      );

      expect(noneNode.config!.atom).toBe(true);
      expect(noneNode.config!.content).toBe('');

      expect(styledNode.config!.atom).toBe(false);
      expect(styledNode.config!.content).toBe('inline*');
    });
  });

  describe('addAttributes', () => {
    it('应该将 propSchema 中的属性正确映射', () => {
      const config = createTestConfig();
      const impl = createMockImplementation();
      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      const attrs = node.config!.addAttributes?.call({} as any) as Record<
        string,
        any
      >;
      expect(attrs).toHaveProperty('id');
      expect(attrs).toHaveProperty('label');
      expect(attrs.id.default).toBe('');
      expect(attrs.label.default).toBe('default-label');
    });
  });

  describe('parseHTML 规则配置', () => {
    it('应该生成正确的行内内容解析规则', () => {
      const config = createTestConfig({ type: 'mention' });
      const impl = createMockImplementation();
      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      const rules = node.config!.parseHTML?.call({} as any) as any;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);
      expect(rules[0].tag).toBe('[data-inline-content-type="mention"]');
    });
  });

  describe('renderHTML', () => {
    it('应该调用 render 方法，设置 data-inline-content-type 并过滤与设置属性', () => {
      const config = createTestConfig({
        type: 'mention',
        propSchema: {
          userId: { default: '' },
          userLabel: { default: 'default-user' },
        },
      });

      const span = document.createElement('span');
      const renderMock = vi.fn().mockReturnValue({
        dom: span,
        contentDOM: undefined,
      });
      const impl = createMockImplementation(renderMock);

      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      const mockNode = {
        attrs: {
          userId: '12345',
          userLabel: 'default-user', // 等于默认值，应被过滤掉不挂载在 DOM 上
        },
      } as any;

      const result = node.config!.renderHTML?.call({} as any, {
        node: mockNode,
        HTMLAttributes: {},
      }) as any;

      expect(renderMock).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result?.dom).toBe(span);

      // 验证属性设置
      expect(span.getAttribute('data-inline-content-type')).toBe('mention');
      // userId 不等于默认值，且应该转换为 data-user-id（data-kebab-case）格式
      expect(span.getAttribute('data-user-id')).toBe('12345');
      // userLabel 等于默认值，不应该出现在 DOM 属性上
      expect(span.hasAttribute('data-user-label')).toBe(false);
    });

    it('当 content 为 "styled" 时，应该返回带有 contentDOM 的渲染结构，并为其加上 data-editable 属性', () => {
      const config = createTestConfig({ content: 'styled' });
      const span = document.createElement('span');
      const contentDOM = document.createElement('span');

      const renderMock = vi.fn().mockReturnValue({
        dom: span,
        contentDOM: contentDOM,
      });
      const impl = createMockImplementation(renderMock);

      const {
        implementation: { node },
      } = createInlineContentSpec(config, impl);

      const mockNode = { attrs: {} } as any;
      const result = node.config!.renderHTML?.call({} as any, {
        node: mockNode,
        HTMLAttributes: {},
      }) as any;

      expect(result?.contentDOM).toBe(contentDOM);
      expect(contentDOM.hasAttribute('data-editable')).toBe(true);
    });
  });
});
