/*
 * Copyright 2023 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {SnowflakeConnection} from '@datairis/db-snowflake';
import {
  ConfigOptions,
  SnowflakeConnectionConfig,
} from '../connection_manager_types';

export const createSnowflakeConnection = async (
  connectionConfig: SnowflakeConnectionConfig,
  {rowLimit}: ConfigOptions
): Promise<SnowflakeConnection> => {
  const options = {
    connOptions: {
      account: connectionConfig.account || '<must set account!!>',
      username: connectionConfig.username,
      password: connectionConfig.password,
      database: connectionConfig.database,
      schema: connectionConfig.schema,
      warehouse: connectionConfig.warehouse,
      timeout: connectionConfig.timeoutMs,
    },
    queryOptions: {
      rowLimit: rowLimit,
    },
  };
  console.info(
    'Creating snowflake connection with',
    JSON.stringify({...options, password: '<PWD>'})
  );
  const connection = new SnowflakeConnection(connectionConfig.name, options);
  return connection;
};
