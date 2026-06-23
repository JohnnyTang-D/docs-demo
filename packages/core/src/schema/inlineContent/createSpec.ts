import {
  createInlineContentRules,
  CustomInlineContentConfig,
  InlineContentFromConfig,
  propsToAttributes,
  StyleSchema,
} from '@/schema';
import { Node } from '@tiptap/core';
import { camelToDataKebab } from '@/utils/string';

export type CustomInlineContentImplementation<
  T extends CustomInlineContentConfig,
  S extends StyleSchema,
> = {
  render: (inlineContent: InlineContentFromConfig<T, S>) => {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
  };
};

export function createInlineContentSpec<
  T extends CustomInlineContentConfig,
  S extends StyleSchema,
>(
  inlineContentConfig: T,
  inlineContentImplementation: CustomInlineContentImplementation<T, S>,
) {
  let { content, type, propSchema } = inlineContentConfig;
  const node = Node.create({
    name: type,
    inline: true,
    group: 'inline',
    atom: content === 'none',
    content: (content === 'styled'
      ? 'inline*'
      : '') as T['content'] extends 'styled' ? 'inline*' : '',
    addAttributes() {
      return propsToAttributes(propSchema);
    },
    parseHTML() {
      return createInlineContentRules(inlineContentConfig);
    },
    renderHTML({ node, HTMLAttributes }) {
      // 因为inlineContent 有 自定义样式行内和内置普通行内 所以需要拿到编辑器里的schema转换
      // 拿到inlineContent的schema 和 styleSchema  转换成 自定义的 CustomInlineContentConfig json结构
      // 转换了之后 传给自定义render 使用者来控制渲染返回dom结构
      // TODO 如何拿 如何转换
      const { dom, contentDOM } = inlineContentImplementation.render(
        null as any,
      );

      // 拿到渲染的dom结构 设置type 和 props 模拟一下
      dom.setAttribute('data-inline-content-type', type);
      // 使用propSchema中明确的字段设置属性 node.attrs 中是纯净的 HTMLAttributes有class style以及扩展注入的无关的
      Object.entries(node.attrs)
        .filter(([prop, value]) => value !== propSchema[prop]!.default)
        .map(([prop, value]) => {
          return [camelToDataKebab(prop), value];
        })
        .forEach(([prop, value]) => dom.setAttribute(prop, value));

      if (contentDOM !== undefined) {
        contentDOM.setAttribute('data-editable', '');
      }
      return {
        dom,
        contentDOM,
      };
    },
  });

  return {
    config: inlineContentConfig,
    implementation: {
      node,
    },
  };
}
