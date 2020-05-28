/*
 *   Copyright (c) 2020 
 *   All rights reserved.
 */
// Import VSCode library for the purpose of extension.
import * as vscode from 'vscode';
import completion_items from "./language_items.json";


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
		this.commitCharacters = ['=',';',' '];
	}
};

let initial_completion_suggestions : SPLCompletionItem[] = [];

// This function is run on the launch of the program.
export function activate(context: vscode.ExtensionContext) {
	// Add all keyword suggestions. This is needed to be done only once.
	// Autocomplete Registers
	completion_items.Registers.items.forEach((register) => {
		initial_completion_suggestions.push(new SPLCompletionItem(register["name"], register["insert_text"], register["detail"], completion_items.Registers.type, register["documentation"]));
	});
	// Autocomplete Keywords
	completion_items.Keywords.items.forEach((keyword) => {
		initial_completion_suggestions.push(new SPLCompletionItem(keyword["name"], keyword["insert_text"], keyword["detail"], completion_items.Keywords.type, keyword["documentation"]));

	});
	// Autocomplete Modules
	completion_items.Modules.items.forEach((module) => {
		initial_completion_suggestions.push(new SPLCompletionItem(module["name"], module["insert_text"], module["detail"], completion_items.Modules.type, module["documentation"]));
	});
	// Autocomplete Interrupts
	completion_items.Interrupts.items.forEach((interrupt) => {
		initial_completion_suggestions.push(new SPLCompletionItem(interrupt["name"], interrupt["insert_text"], interrupt["detail"], completion_items.Interrupts.type, interrupt["documentation"]));
	});
	// Autocomplete Systemcalls
	completion_items.Syscalls.items.forEach(syscall => {
		initial_completion_suggestions.push(new SPLCompletionItem(syscall["name"], syscall["insert_text"], syscall["detail"], completion_items.Syscalls.type, syscall["documentation"]));
	});
	// Autocomplete Functions
	completion_items.Functions.items.forEach(fn => {
		initial_completion_suggestions.push(new SPLCompletionItem(fn["name"],fn["insert_text"], fn["detail"], completion_items.Functions.type, fn["documentation"]));
	});
	// Autocomplete Kernel Data Structures
	completion_items.Kernel_DS.items.forEach(ds_item => {
		initial_completion_suggestions.push(new SPLCompletionItem(ds_item["name"], ds_item["insert_text"], ds_item["detail"], completion_items.Kernel_DS.type, ds_item["documentation"]));
	});
	// Autocomplete Process States
	completion_items.Process_States.items.forEach(process_state => {
		initial_completion_suggestions.push(new SPLCompletionItem(process_state["name"],process_state["insert_text"], process_state["detail"], completion_items.Process_States.type, process_state["documentation"]));
	});
	// Autocomplete Constants for File Types
	completion_items.FileTypes.items.forEach(file_type => {
		initial_completion_suggestions.push(new SPLCompletionItem(file_type["name"],file_type["insert_text"],file_type["detail"],completion_items.FileTypes.type,file_type["documentation"]));
	});
	// Autocomplete Constants for User Programs
	completion_items.User_Program.items.forEach(user_program_const => {
		initial_completion_suggestions.push(new SPLCompletionItem(user_program_const["name"], user_program_const["insert_text"], user_program_const["detail"], completion_items.User_Program.type, user_program_const["documentation"]));
	});
	// Autocomplete Constants for Swap Constants
	completion_items.Swap_Constants.items.forEach(swap_constant => {
		initial_completion_suggestions.push(new SPLCompletionItem(swap_constant["name"],swap_constant["insert_text"], swap_constant["detail"], completion_items.Swap_Constants.type, swap_constant["documentation"]));
	});
	// Autocomplete Constants for Resource Table
	completion_items.Resource_Table_Consts.items.forEach(resource_const => {
		initial_completion_suggestions.push(new SPLCompletionItem(resource_const["name"], resource_const["insert_text"], resource_const["detail"], completion_items.Resource_Table_Consts.type, resource_const["documentation"]));
	});
	// Autocomplete Constants for eXpFS
	completion_items.eXpFS_Disk_Consts.items.forEach(disk_const => {
		initial_completion_suggestions.push(new SPLCompletionItem(disk_const["name"], disk_const["insert_text"], disk_const["detail"], completion_items.eXpFS_Disk_Consts.type, disk_const["documentation"]));
	});
	// Autocomplete Constants for Maximum Limits
	completion_items.Limit_Consts.items.forEach(limit_item => {
		initial_completion_suggestions.push(new SPLCompletionItem(limit_item["name"], limit_item["insert_text"], limit_item["detail"], completion_items.Limit_Consts.type, limit_item["documentation"]));
	});
	// Autocomplete Miscellanious Constants
	completion_items.MISC_Constants.items.forEach(misc_item => {
		initial_completion_suggestions.push(new SPLCompletionItem(misc_item["name"], misc_item["insert_text"], misc_item["detail"], completion_items.MISC_Constants.type, misc_item["documentation"]));
	});
	// Autocomplete NEXSM Constants
	completion_items.NEXSM_Consts.items.forEach(nexsm_const => {
		initial_completion_suggestions.push(new SPLCompletionItem(nexsm_const["name"], nexsm_const["insert_text"], nexsm_const["details"], completion_items.NEXSM_Consts.type, nexsm_const["documentation"]));
	});

	// Register normal completion Items to VSCode Completion.
	let autocomplete_provider = vscode.languages.registerCompletionItemProvider('spl-nitc',
		{ provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _ : vscode.CancellationToken) { 
				return initial_completion_suggestions;
			}
		}
	);

	// Provide alias symbol completions, if we need it.
	const alias_regex = /alias\s*([a-zA-Z\_]+[a-zA-Z0-9\_]*)\s*(R[01]?[\d]{1}|R[d]{1}|SP|BP|IP|(?:P[0-3]))/gm;

	let alias_objects : vscode.DocumentSymbol[] = [];

	// Provide alias Symbols in Symbol Outlne.
	let alias_symbol_provider = vscode.languages.registerDocumentSymbolProvider('spl-nitc', 
		{
			provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken) {
				alias_objects = [];
				for(let i : number = 0; i < document.lineCount; i++) {
					let line : RegExpExecArray | null;
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
				for(let i = 0; i < document.lineCount; i++) {
					let line : RegExpExecArray | null;
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
		provideHover(document: vscode.TextDocument,position: vscode.Position, token: vscode.CancellationToken) {
			let selected_text = document.getText(document.getWordRangeAtPosition(position));
			for(var i = 0; i < initial_completion_suggestions.length; i++) {
				if (selected_text === initial_completion_suggestions[i].insertText) {
					let hover_content = new vscode.MarkdownString(`    ${selected_text}\n___\n`);
					return new vscode.Hover(initial_completion_suggestions[i].documentation || "No definition exists for this token.");
				}
			}
			return {
				contents : [
					` No definition exists for this token.`
				]
			};
		}
	});


}

// this method is called when your extension is deactivated
export function deactivate() {

}
