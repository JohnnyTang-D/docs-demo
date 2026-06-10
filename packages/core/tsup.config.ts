import { defineConfig } from 'tsup';

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],
  // 输出格式：CommonJS 和 ES Module
  format: ['cjs', 'esm'],
  // 生成类型声明文件 (.d.ts)
  dts: true,
  // 禁用代码拆分（库模式下建议禁用，保持单文件）
  splitting: false,
  // 生成 source map 方便调试
  sourcemap: true,
  // 每次构建前清理 dist 目录
  clean: true,
  ignoreWatch: ['**/*.md'],
  minify: true,
});
