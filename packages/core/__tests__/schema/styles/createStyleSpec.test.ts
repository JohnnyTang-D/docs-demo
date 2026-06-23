import { describe, it, expect, vi } from 'vitest';
import { createStyleSpec } from '@/index';
import type { CustomStyleImplementation, StyleConfig } from '@/index';

describe('createStyleSpec', () => {
  // 模拟自定义 style 实现
  const createMockImplementation = (
    renderMock = vi.fn(),
  ): CustomStyleImplementation<any> => ({
    render: renderMock,
  });

  describe('节点基本配置', () => {
    it('应该返回包含 config 和 implementation 的对象且 mark 实例有效', () => {
      const config: StyleConfig = { type: 'bold', propSchema: 'boolean' };
      const impl = createMockImplementation();
      const result = createStyleSpec(config, impl);

      expect(result).toBeDefined();
      expect(result.config).toBe(config);
      expect(result.implementation.mark.name).toBe('bold');
    });

    it('name 应该与 styleConfig.type 保持一致', () => {
      const config: StyleConfig = { type: 'italic', propSchema: 'boolean' };
      const impl = createMockImplementation();
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      expect(mark.name).toBe('italic');
    });
  });

  describe('addAttributes', () => {
    it('当 propSchema 为 "boolean" 时，应该返回空对象', () => {
      const config: StyleConfig = { type: 'bold', propSchema: 'boolean' };
      const impl = createMockImplementation();
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      const attrs = mark.config!.addAttributes?.call({} as any);
      expect(attrs).toEqual({});
    });

    it('当 propSchema 为 "string" 时，应该返回包含 stringValue 的配置', () => {
      const config: StyleConfig = { type: 'color', propSchema: 'string' };
      const impl = createMockImplementation();
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      const attrs = mark.config!.addAttributes?.call({} as any) as Record<
        string,
        any
      >;
      expect(attrs).toHaveProperty('stringValue');
      expect(attrs.stringValue.default).toBeUndefined();
      expect(attrs.stringValue.keepOnSplit).toBe(true);

      // 测试 stringValue 的 parseHTML 行为
      const mockElement = {
        getAttribute: (name: string) => (name === 'data-value' ? 'red' : null),
      } as unknown as HTMLElement;
      expect(attrs.stringValue.parseHTML(mockElement)).toBe('red');

      // 测试 stringValue 的 renderHTML 行为
      expect(attrs.stringValue.renderHTML({ stringValue: 'blue' })).toEqual({
        'data-value': 'blue',
      });
      expect(attrs.stringValue.renderHTML({ stringValue: undefined })).toEqual(
        {},
      );
    });
  });

  describe('parseHTML 规则配置', () => {
    it('应该生成正确的解析规则', () => {
      const config: StyleConfig = { type: 'bold', propSchema: 'boolean' };
      const impl = createMockImplementation();
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      const rules = mark.config!.parseHTML?.call({} as any) as any;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);
      expect(rules[0].tag).toBe('[data-style-type="bold"]');

      // 测试 contentElement 获取行为
      const contentElementFn = rules[0].contentElement as (
        el: HTMLElement,
      ) => HTMLElement;

      const editableEl = {
        matches: (selector: string) => selector === '[data-editable]',
      } as unknown as HTMLElement;
      expect(contentElementFn(editableEl)).toBe(editableEl);

      const nonEditableEl = {
        matches: () => false,
        querySelector: (selector: string) =>
          selector === '[data-editable]' ? editableEl : null,
      } as unknown as HTMLElement;
      expect(contentElementFn(nonEditableEl)).toBe(editableEl);
    });
  });

  describe('renderHTML', () => {
    it('当 propSchema 为 "boolean" 时，应该不带参数调用 render', () => {
      const config: StyleConfig = { type: 'bold', propSchema: 'boolean' };
      const renderMock = vi
        .fn()
        .mockReturnValue({ dom: document.createElement('span') });
      const impl = createMockImplementation(renderMock);
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      mark.config!.renderHTML?.call({} as any, {
        mark: { attrs: {} } as any,
        HTMLAttributes: {},
      });

      expect(renderMock).toHaveBeenCalledTimes(1);
      expect(renderMock).toHaveBeenLastCalledWith();
    });

    it('当 propSchema 为 "string" 时，应该将 stringValue 作为参数传递给 render', () => {
      const config: StyleConfig = { type: 'color', propSchema: 'string' };
      const renderMock = vi
        .fn()
        .mockReturnValue({ dom: document.createElement('span') });
      const impl = createMockImplementation(renderMock);
      const {
        implementation: { mark },
      } = createStyleSpec(config, impl);

      mark.config!.renderHTML?.call({} as any, {
        mark: { attrs: { stringValue: 'blue' } } as any,
        HTMLAttributes: {},
      });

      expect(renderMock).toHaveBeenCalledTimes(1);
      expect(renderMock).toHaveBeenLastCalledWith('blue');
    });
  });
});
