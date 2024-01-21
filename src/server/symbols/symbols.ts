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

import {TextDocument} from 'vscode-languageserver-textdocument';
import {DocumentSymbol as MalloyDocumentSymbol} from '@datairis/malloy';
import {DocumentSymbol, SymbolKind} from 'vscode-languageserver';
import {parseWithCache} from '../parse_cache';

function mapSymbol({
  name,
  range,
  type,
  children,
}: MalloyDocumentSymbol): DocumentSymbol {
  let kind: SymbolKind;
  let detail = type;
  switch (type) {
    case 'explore':
      kind = SymbolKind.Namespace;
      detail = 'source';
      break;
    case 'query':
      kind = SymbolKind.Class;
      break;
    case 'join':
      kind = SymbolKind.Interface;
      break;
    case 'unnamed_query':
      kind = SymbolKind.Class;
      break;
    default:
      kind = SymbolKind.Field;
  }
  return {
    name: name || 'unnamed',
    range: range.toJSON(),
    detail,
    kind,
    selectionRange: range.toJSON(),
    children: children.map(mapSymbol),
  };
}

export function getMalloySymbols(document: TextDocument): DocumentSymbol[] {
  return parseWithCache(document).symbols.map(mapSymbol);
}
