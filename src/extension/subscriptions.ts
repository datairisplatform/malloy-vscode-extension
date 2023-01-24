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

import * as vscode from "vscode";
import {
  runTurtleFromSchemaCommand,
  SchemaProvider,
} from "./tree_views/schema_view";
import {
  copyFieldPathCommand,
  runNamedQuery,
  runNamedSQLBlock,
  runQueryCommand,
  runQueryFileCommand,
  runUnnamedSQLBlock,
} from "./commands";
import { trackModelLoad, trackModelSave } from "./telemetry";
import { ConnectionManager } from "../common/connection_manager";
import { URLReader } from "@malloydata/malloy";

export const setupSubscriptions = (
  context: vscode.ExtensionContext,
  urlReader: URLReader,
  connectionManager: ConnectionManager
) => {
  // Run Query (whole file)
  context.subscriptions.push(
    vscode.commands.registerCommand("malloy.runQueryFile", runQueryFileCommand)
  );

  // Run query
  context.subscriptions.push(
    vscode.commands.registerCommand("malloy.runQuery", runQueryCommand)
  );

  // Run named query
  context.subscriptions.push(
    vscode.commands.registerCommand("malloy.runNamedQuery", runNamedQuery)
  );

  // Run named SQL block
  context.subscriptions.push(
    vscode.commands.registerCommand("malloy.runNamedSQLBlock", runNamedSQLBlock)
  );

  // Run unnamed SQL block
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "malloy.runUnnamedSQLBlock",
      runUnnamedSQLBlock
    )
  );

  // Copy Field Path
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "malloy.copyFieldPath",
      copyFieldPathCommand
    )
  );

  const schemaTree = new SchemaProvider(connectionManager, urlReader);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("malloySchema", schemaTree)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("malloy.refreshSchema", () =>
      schemaTree.refresh()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "malloy.runTurtleFromSchema",
      runTurtleFromSchemaCommand
    )
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() =>
      vscode.commands.executeCommand("malloy.refreshSchema")
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (e) => {
      if (e.languageId === "malloy") {
        trackModelLoad();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      vscode.commands.executeCommand("malloy.refreshSchema");
      if (e.languageId === "malloy") {
        trackModelSave();
      }
    })
  );
};
