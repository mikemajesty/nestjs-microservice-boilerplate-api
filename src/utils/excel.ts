import { Cell, Row } from 'write-excel-file';
import writeXlsxFile from 'write-excel-file/node';

import { ApiBadRequestException } from './exception';

type GenerateExcelV2ConfigInput = {
  property: string;
  header: string;
  type: StringConstructor | DateConstructor | NumberConstructor | BooleanConstructor;
  config?: Cell;
};

type GenerateExcelV2DataInput = { data: { [key: string]: string | number | Date | boolean }[]; sheetName?: string };

export class ExcelUtils {
  static getExcelBuffer = async (
    { data, sheetName }: GenerateExcelV2DataInput,
    configList: GenerateExcelV2ConfigInput[]
  ): Promise<Buffer> => {
    const MAX_SYNC_LIMIT = 10000;
    if (data.length > MAX_SYNC_LIMIT) {
      throw new ApiBadRequestException(`limit: ${MAX_SYNC_LIMIT} was reached`);
    }

    const HEADER_ROW: Row = configList.map((l) => ({ value: l.header }));

    const DATA_ROWS: Row[] = [];

    for (const line of data) {
      const DATA_ROW = [];

      for (const key in line) {
        const value = line[`${key}`];
        const row = configList.find((c) => c.property === key);
        if (!row) {
          throw new ApiBadRequestException(`property: ${key} not found`);
        }
        DATA_ROW.push({ value, format: row.config?.format, type: row.type });
      }

      DATA_ROWS.push(DATA_ROW as Row);
    }

    const excelData = [HEADER_ROW, ...DATA_ROWS];

    return await writeXlsxFile(excelData, { buffer: true, sheet: sheetName ?? 'default' });
  };
}
