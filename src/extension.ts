/*
 *   Copyright (c) 2020 
 *   All rights reserved.
 */


// Import VSCode library for the purpose of extension.
import * as vscode from 'vscode';
// Import completion items (proxy) from JSON
import _completion_items from "./language_items.json";

// Type the elements and cast onto final element.
const completion_items: {
  [key: string]: CompletionItem
} = _completion_items;


class SPLCompletionItem extends vscode.CompletionItem {
  /**
   * @name SPLCompletionItem
   * @param name The name of the completion item [shows up in completion pop-up]
   * @param item_insert_text The text to be inserted when conpletion item is selected. Note that that does not need to be the same as completion name.
   */
  constructor(name: string, item_insert_text: string, item_detail: string, item_kind: vscode.CompletionItemKind, item_documentation: string) {
    super(name, item_kind);
    this.detail = item_detail;
    this.insertText = item_insert_text;
    this.documentation = new vscode.MarkdownString(item_documentation);
    this.commitCharacters = ['=', ';', ' '];
  }
};

class CompletionEntry {
  name: string;
  insert_text: string;
  detail: string;
  documentation: string;

  constructor(name: string, insert_text: string, detail: string, documentation: string) {
    this.name = name;
    this.insert_text = insert_text;
    this.detail = detail;
    this.documentation = documentation;
  }
}

class CompletionItem {
  type: number;
  items: Array<CompletionEntry>;

  constructor(type: number, items: CompletionEntry[]) {
    this.type = type;
    this.items = items;
  }
}

let initial_completion_suggestions: SPLCompletionItem[] = [];

// This function is run on the launch of the program.
export function activate(context: vscode.ExtensionContext) {
  // Parse through keys of the object.
  Object.keys(completion_items).map((kind) => {
    // For each Completion Entry
    completion_items[kind].items.forEach((completion_entry: CompletionEntry) => {
      // Initialize Completion Suggestions
      initial_completion_suggestions.push(
        new SPLCompletionItem(
          completion_entry.name,
          completion_entry.insert_text,
          completion_entry.detail,
          completion_items[kind].type,
          completion_entry.documentation
        )
      );
    });
  });

  // Register normal completion Items to VSCode Completion.
  let autocomplete_provider = vscode.languages.registerCompletionItemProvider('spl-nitc',
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _: vscode.CancellationToken) {
        return initial_completion_suggestions;
      }
    }
  );

  // Provide alias symbol completions, if we need it.
  const alias_regex = /alias\s*([a-zA-Z\_]+[a-zA-Z0-9\_]*)\s*(R[01]?[\d]{1}|R[dcomp_items]{1}|SP|BP|IP|(?:P[0-3]))/gm;

  let alias_objects: vscode.DocumentSymbol[] = [];

  // Provide alias Symbols in Symbol Outlne.
  let alias_symbol_provider = vscode.languages.registerDocumentSymbolProvider('spl-nitc',
    {
      provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken) {
        alias_objects = [];
        for (let i: number = 0; i < document.lineCount; i++) {
          let line: RegExpExecArray | null;
          while ((line = alias_regex.exec(document.lineAt(i).text)) !== null) {
            if (line.index === alias_regex.lastIndex) {
              alias_regex.lastIndex++;
            }
            try {
              alias_objects.push(new vscode.DocumentSymbol(line[1], line[0], vscode.SymbolKind.Variable, document.lineAt(i).range, document.lineAt(i).range));
            } catch (error) {
              console.log("Unknown error in execut");
            }
          }
        }
        return alias_objects;
      }
    }
  );

  let alias_completions: vscode.CompletionItem[] = [];

  let alias_completion_provider = vscode.languages.registerCompletionItemProvider('spl-nitc',
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        alias_completions = [];
        for (let i = 0; i < document.lineCount; i++) {
          let line: RegExpExecArray | null;
          while ((line = alias_regex.exec(document.lineAt(i).text)) !== null) {
            if (line.index === alias_regex.lastIndex) {
              alias_regex.lastIndex++;
            }
            try {
              alias_completions.push(new SPLCompletionItem(line[1], line[1], line[0], vscode.CompletionItemKind.Class, `    ${line[0]}`));
            }
            finally { }
          }
          return alias_completions;
        }
      }
    }
  );

  // Provide Documentation on Token Hovering.
  vscode.languages.registerHoverProvider('spl-nitc', {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
      let selected_text = document.getText(document.getWordRangeAtPosition(position));
      for (var i = 0; i < initial_completion_suggestions.length; i++) {
        if (selected_text === initial_completion_suggestions[i].insertText) {
          let hover_content = new vscode.MarkdownString(`    ${selected_text}\n___\n`);
          return new vscode.Hover(initial_completion_suggestions[i].documentation || "No definition exists for this token.");
        }
      }
      return {
        contents: [
          ` No definition exists for this token.`
        ]
      };
    }
  });


}

// this method is called when your extension is deactivated
export function deactivate() {

}
