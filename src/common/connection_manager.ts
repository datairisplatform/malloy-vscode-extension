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

import * as path from "path";
import { fileURLToPath } from "url";
import {
  Connection,
  LookupConnection,
  TestableConnection,
} from "@malloydata/malloy";
import {
  ConfigOptions,
  ConnectionBackend,
  ConnectionConfig,
} from "./connection_manager_types";
import { isDuckDBAvailable } from "../common/duckdb_availability";
import { ConnectionFactory } from "./connections/types";

const DEFAULT_CONFIG = Symbol("default-config");

export class DynamicConnectionLookup implements LookupConnection<Connection> {
  connections: Record<string | symbol, Promise<Connection>> = {};

  constructor(
    private connectionFactory: ConnectionFactory,
    private configs: Record<string | symbol, ConnectionConfig>,
    private options: ConfigOptions
  ) {}

  async lookupConnection(
    connectionName?: string | undefined
  ): Promise<Connection> {
    const connectionKey = connectionName || DEFAULT_CONFIG;
    if (!this.connections[connectionKey]) {
      const connectionConfig = this.configs[connectionKey];
      if (connectionConfig) {
        this.connections[connectionKey] =
          this.connectionFactory.getConnectionForConfig(connectionConfig, {
            useCache: true,
            ...this.options,
          });
      } else {
        throw new Error(`No connection found with name ${connectionName}`);
      }
    }
    return this.connections[connectionKey];
  }
}

export class ConnectionManager {
  private connectionLookups: Record<string, DynamicConnectionLookup> = {};
  configs: Record<string | symbol, ConnectionConfig> = {};
  connectionCache: Record<string | symbol, TestableConnection> = {};
  currentRowLimit = 50;

  constructor(
    private connectionFactory: ConnectionFactory,
    configs: ConnectionConfig[]
  ) {
    this.buildConfigMap(configs);
  }

  public setConnectionsConfig(connectionsConfig: ConnectionConfig[]): void {
    // Force existing connections to be regenerated
    this.connectionLookups = {};
    this.connectionCache = {};
    this.buildConfigMap(connectionsConfig);
  }

  public async connectionForConfig(
    connectionConfig: ConnectionConfig
  ): Promise<TestableConnection> {
    return this.connectionFactory.getConnectionForConfig(connectionConfig, {
      workingDirectory: "/",
    });
  }

  public getConnectionLookup(url: URL): LookupConnection<Connection> {
    const workingDirectory = path.dirname(fileURLToPath(url));
    if (!this.connectionLookups[workingDirectory]) {
      this.connectionLookups[workingDirectory] = new DynamicConnectionLookup(
        this.connectionFactory,
        this.configs,
        {
          workingDirectory,
          rowLimit: this.getCurrentRowLimit(),
        }
      );
    }
    return this.connectionLookups[workingDirectory];
  }

  public setCurrentRowLimit(rowLimit: number): void {
    this.currentRowLimit = rowLimit;
  }

  public getCurrentRowLimit(): number | undefined {
    return this.currentRowLimit;
  }

  protected static filterUnavailableConnectionBackends(
    connectionsConfig: ConnectionConfig[]
  ): ConnectionConfig[] {
    return connectionsConfig.filter(
      (config) =>
        isDuckDBAvailable || config.backend !== ConnectionBackend.DuckDB
    );
  }

  buildConfigMap(configs: ConnectionConfig[]): void {
    // Create a default bigquery connection if one isn't configured
    if (
      !configs.find((config) => config.backend === ConnectionBackend.BigQuery)
    ) {
      configs.push({
        name: "bigquery",
        backend: ConnectionBackend.BigQuery,
        id: "bigquery-default",
        isDefault: !configs.find((config) => config.isDefault),
      });
    }

    // Create a default duckdb connection if one isn't configured
    if (!configs.find((config) => config.name === "duckdb")) {
      configs.push({
        name: "duckdb",
        backend: ConnectionBackend.DuckDB,
        id: "duckdb-default",
        isDefault: false,
      });
    }

    configs.forEach((config) => {
      if (config.isDefault) {
        this.configs[DEFAULT_CONFIG] = config;
      }
      this.configs[config.name] = config;
    });
  }
}
