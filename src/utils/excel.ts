import { Cell, Row } from 'write-excel-file'
import writeXlsxFile from 'write-excel-file/node'

import { ApiBadRequestException } from './exception'

type GenerateExcelV2ConfigInput = {
  property: string
  header: string
  type: StringConstructor | DateConstructor | NumberConstructor | BooleanConstructor
  config?: Cell
}

type GenerateExcelV2DataInput = {
  data: { [key: string]: string | number | Date | boolean }[]
  sheetName?: string
}

export class ExcelUtils {
  private static readonly MAX_SYNC_LIMIT = 10000

  static getExcelBuffer = async (
    { data, sheetName }: GenerateExcelV2DataInput,
    configList: GenerateExcelV2ConfigInput[]
  ): Promise<Buffer> => {
    if (data.length > this.MAX_SYNC_LIMIT) {
      throw new ApiBadRequestException(`limit: ${this.MAX_SYNC_LIMIT} was reached`)
    }

    const HEADER_ROW: Row = configList.map((l) => ({ value: l.header }))

    const DATA_ROWS: Row[] = new Array(data.length)

    for (let i = 0; i < data.length; i++) {
      const line = data[`${i}`]
      const row = new Array(configList.length)

      for (let j = 0; j < configList.length; j++) {
        const config = configList[`${j}`]
        row[`${j}`] = {
          value: line[config.property],
          type: config.type,
          ...config.config
        }
      }

      DATA_ROWS[`${i}`] = row
    }

    return await writeXlsxFile([HEADER_ROW, ...DATA_ROWS], { buffer: true, sheet: sheetName ?? 'default' })
  }
}
