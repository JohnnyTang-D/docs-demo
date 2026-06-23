import { Mark } from '@tiptap/core';
import type { StyleConfig, StyleSpec, StylePropSchema } from '@/schema';
import {
  createStyleParseRules,
  stylePropsToAttributes,
  createInternalStyleSpec,
} from '@/schema';

import { UnreachableCaseError } from '@/utils/typescript';

export type CustomStyleImplementation<T extends StyleConfig> = {
  render: T['propSchema'] extends 'boolean'
    ? () => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
      }
    : (value: string) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
      };
};

// 使用函数重载在不使用 as 断言的情况下安全获取对应类型的渲染函数
function getRenderFunction<T extends StyleConfig>(
  propSchema: 'boolean',
  impl: CustomStyleImplementation<T>,
): () => { dom: HTMLElement; contentDOM?: HTMLElement };

function getRenderFunction<T extends StyleConfig>(
  propSchema: 'string',
  impl: CustomStyleImplementation<T>,
): (value: string) => { dom: HTMLElement; contentDOM?: HTMLElement };

function getRenderFunction<T extends StyleConfig>(
  propSchema: StylePropSchema,
  impl: CustomStyleImplementation<T>,
): Function {
  return impl.render;
}

export function createStyleSpec<T extends StyleConfig>(
  styleConfig: T,
  styleImplementation: CustomStyleImplementation<T>,
): StyleSpec<T> {
  let { type, propSchema } = styleConfig;
  const mark = Mark.create({
    name: type,
    addAttributes() {
      return stylePropsToAttributes(propSchema);
    },
    parseHTML() {
      return createStyleParseRules(styleConfig);
    },
    renderHTML({ mark }) {
      let renderResult: { dom: HTMLElement; contentDOM?: HTMLElement };

      if (propSchema === 'boolean') {
        // 在此分支中 propSchema 自动收窄为 'boolean'，匹配第一个重载签名
        const render = getRenderFunction(propSchema, styleImplementation);
        renderResult = render();
      } else if (propSchema === 'string') {
        // 在此分支中 propSchema 自动收窄为 'string'，匹配第二个重载签名
        const render = getRenderFunction(propSchema, styleImplementation);
        renderResult = render(mark.attrs.stringValue);
      } else {
        // 在排除了 'boolean' 和 'string' 后，propSchema 成功收窄为 never，可安全传给 UnreachableCaseError
        throw new UnreachableCaseError(propSchema);
      }

      return renderResult;
    },
  });
  return createInternalStyleSpec(styleConfig, { mark });
}
