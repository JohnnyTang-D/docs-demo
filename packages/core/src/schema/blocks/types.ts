import { PropSchema } from '../propTypes';

// 定义基础区块配置类型
export type BlockConfig = {
    type: string
    readonly propSchema: PropSchema
    content: 'inline' | 'none' | 'table'
    isSelectable?: boolean
    isFileBlock?: false
}

// 扩展出自定义区块配置类型
export type CustomBlockConfig = BlockConfig & {
    content: 'inline' | "none"
}