export type PropSpec<PType extends boolean | number | string> = {
    values?: readonly PType[]
    default: PType
}


export type PropSchema = Record<string, PropSpec<boolean | number | string>>

