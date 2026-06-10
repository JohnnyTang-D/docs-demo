import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // 启用全局 API (如 describe, it, expect 等)，如果在测试文件中不显式 import 它们
    globals: true,
    // 运行环境选择 jsdom 以模拟浏览器 DOM 环境，支持 Tiptap 编辑器测试
    environment: "jsdom",
  },
});
