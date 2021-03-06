//@REQUIRE[libs/uglify.js]
declare module UglifyJS {
    export interface IOptions {
        outSourceMap?: boolean,
        sourceRoot?: string,
        inSourceMap?: string,
        fromString?: boolean,
        warnings?: boolean,
        mangle?: any,
        output?: string,
        compress?: any;
        wrap?: string;
        exportAll?: boolean;
        sourceMapIncludeSources?: boolean;
    }
    export function minify(source: string | string[], host: jsidea.build.FileSystem, options: any): { code: string; map: string };
    export var base54: any;
    export var AST_Node: any;
    export var OutputStream: any;
    export var Compressor: any;
    export var merge: any;
    export var parse: any;
    export var defaults: any;
    export var SourceMap: any;
    export var TreeWalker: any;
    export var string_template: any;
    export var AST_Defun: any;
    export var AST_Symbol: any;
    export var AST_SymbolRef: any;
    export var AST_SymbolDefun: any;
    
}