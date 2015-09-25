//TODO: include license/source
//author: not me

import ts = require("typescript");
import glob = require("glob");


type ExportedReport = {
    [index: string]: string[]
};

type ComplexDeclaration = ts.ModuleDeclaration
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration;

type Declaration = ComplexDeclaration | ts.VariableDeclaration;

type ExportedReportBySymbolName = {
    [index: string]: string[]
}

class ExportExtractor {
    private result: ExportedReport = {};
    private options: ts.CompilerOptions = {
        noLib: true
    };
    private host = ts.createCompilerHost(this.options);
    private program: ts.Program = null;
    private moduleStack: ts.ModuleDeclaration[] = [];
    private currentFile: ts.SourceFile = null;

    getReport(sourceFiles: string[]): ExportedReport {
        this.host = ts.createCompilerHost(this.options)
        this.program = ts.createProgram(sourceFiles, this.options, this.host)
        this.program.getSourceFiles().forEach(file => this.processFile(file));

        var report = this.result;
        Object.keys(report).forEach(fileName => {
            var signatures = report[fileName];
            var l = signatures.length;
            for (var i = 1; i < l; ++i) {
                signatures[i] = signatures[0] + "." + signatures[i];
            }
            if (l > 1)
                signatures.splice(0, 1);
        });


        return report;
    }

    convertReport(report: ExportedReport): ExportedReportBySymbolName {
        var result: ExportedReportBySymbolName = {};
        Object.keys(report).forEach(fileName => {
            report[fileName].forEach(symbol => {
                if (!result.hasOwnProperty(symbol)) {
                    result[symbol] = [];
                }
                if (result[symbol].indexOf(fileName) === -1) {
                    result[symbol].push(fileName);
                }
            });
        });
        return result;
    }

    private addToReport(report: ExportedReport, fileName: string, obj: any) {
        //        console.log("ADD TO REPORT", fileName, obj);
        if (!report.hasOwnProperty(fileName)) {
            report[fileName] = [];
        }
        if (report[fileName].indexOf(obj) === -1) {
            report[fileName].push(obj);
        }
    }

    private isExported(node: ComplexDeclaration): boolean {
        if (!node.modifiers) {
            return false;
        }
        return node.modifiers.some(node => node.kind ===
            ts.SyntaxKind.ExportKeyword);
    }

    private isVarExported(node: ts.VariableDeclaration): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0;
    }

    private processFile(file: ts.SourceFile) {
        this.currentFile = file;
        this.processNode(file);
    }

    private getDeclarationFullName(declaration: Declaration): string {
        if (!declaration)
            return "";
        var name = "";
        while (declaration) {
            var cls: string;
            if (!(<any>declaration).name) {
                if ((<any>declaration).left)
                    cls = (<any>declaration).left + "." + (<any>declaration).right;
                else if ((<any>declaration).text)
                    cls = (<any>declaration).text;
                else
                    cls = "";
            }
            else
                cls = (<any>declaration).name ? (<any>declaration).name.text : "";
            if (cls)
                name = name + (name ? "." : "") + cls;
            if (!declaration.parent)
                declaration = (<any>declaration).body;
            else
                declaration = (<any>declaration).parent;
        }
        return name;
    }

    private exportNeeded() {
        return this.moduleStack.length > 0;
    }

    private processComplexDeclaration(node: ComplexDeclaration) {
        var complexDeclaration = <ts.ModuleDeclaration>node;
        if (!this.exportNeeded() || this.isExported(complexDeclaration)) {
            this.addToReport(this.result, this.currentFile.fileName,
                this.getDeclarationFullName(complexDeclaration));
        } else {
        }
    }

    private processVarDeclaration(node: ts.VariableDeclaration) {
        var variableDeclaration = <ts.VariableDeclaration>node;
        if (!node.parent || !this.exportNeeded() || this.isVarExported(variableDeclaration)) {
            this.addToReport(this.result, this.currentFile.fileName,
                this.getDeclarationFullName(variableDeclaration));
        } else {
            //            if (node.name && node.name.text == "TRANSFORM") {
            //                for (var p in node)
            //                    console.log(p, node[p]);
            //                console.log("ARRGH", node.getFullText(this.currentFile), !this.exportNeeded(), this.isVarExported(variableDeclaration), node.flags);
            //            }
        }
    }

    private _c = 0;
    private processNode(node: ts.Node) {
        var skipChildren = false;
        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration:
                this.processComplexDeclaration(<ComplexDeclaration>node);
                this.moduleStack.push(<ts.ModuleDeclaration>node);
                break;
            case ts.SyntaxKind.ClassDeclaration:
                this.processComplexDeclaration(<ComplexDeclaration>node);
                skipChildren = true;
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this.processComplexDeclaration(<ComplexDeclaration>node);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this.processComplexDeclaration(<ComplexDeclaration>node);
                break;
            case ts.SyntaxKind.VariableDeclaration:
                this.processVarDeclaration(<ts.VariableDeclaration>node);
                break;
            //            case ts.SyntaxKind.Identifier:
            ////                console.log(node);
            ////                console.log("ID", node);
            //                break;
            ////           default:
            //                console.log(node.kind, node);
        }

        //        if (node.name && node.name.text == "TRANSFORM")
        //            console.log(node, node.kind);

        //        if (!this.skipInternal) {
        //            if (this._c++ < 10)
        //                console.log(node);
        if (!skipChildren)
            ts.forEachChild(node, node => this.processNode(node));
        //        }

        if (node.kind == ts.SyntaxKind.ModuleDeclaration)
            this.moduleStack.pop();
    }
}

var tsAlias = <any>ts;

type UsageReport = {
    [fileName: string]: string[];
}

type UsageFileReport = {
    [fileName: string]: ts.Node[];
}

class UsageExtractor {

    private program: ts.Program = null;
    private currentFile: ts.SourceFile;
    private report: UsageReport = {};

    findUsages(sourceFiles: string[]): UsageReport {
        var options: ts.CompilerOptions = { noLib: true };
        var host = ts.createCompilerHost(options)
        this.program = ts.createProgram(sourceFiles, options, host)
        this.program.getSourceFiles().forEach(file => this.processFile(file));
        return this.report;
    }

    private processFile(file: ts.SourceFile) {
        this.currentFile = file;
        this.processNode(file);
    }

    private processNode(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            var identifier = <ts.Identifier>node;
            this.addNode(node);
        } else if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
            return this.addNode(node);
        }

        ts.forEachChild(node, node => this.processNode(node));
    }

    private addUsageToCurrentFile(usage: string, file: ts.Node) {

        if (!this.report.hasOwnProperty(this.currentFile.fileName)) {
            this.report[this.currentFile.fileName] = [];
        }
        if (this.report[this.currentFile.fileName].indexOf(usage) === -1) {
            this.report[this.currentFile.fileName].push(usage);
        }
    }

    private addNode(node: ts.Node) {
        var fullName = this.getFullName(node);
        if (fullName) {
            this.addUsageToCurrentFile(this.getFullName(node), node);
        }
    }

    private getFullName(node: ts.Node): string {
        var symbol = this.program.getTypeChecker().getSymbolAtLocation(node);
        if (!symbol)
            return null;
        return this.program.getTypeChecker().getFullyQualifiedName(symbol);
    }
}

type DependencyTree = {
    [index: string]: string[];
}

function pushIfNotContained(arr: any[], obj: any) {
    if (arr.indexOf(obj) === -1) {
        arr.push(obj);
    }
}

class DependencyManager {

    createDepdencyTree(bySymbolExportReport: ExportedReportBySymbolName, usageReport: UsageReport): DependencyTree {
        var tree: DependencyTree = {};
        Object.keys(usageReport).forEach(fileName => {
            usageReport[fileName].forEach(symbol => {
                if (bySymbolExportReport.hasOwnProperty(symbol)) {
                    this.addDependentFilesToFiles(tree, fileName, bySymbolExportReport[symbol]);
                }
            })
        });
        return tree;
    }

    sortFromDepdencyTree(tree: DependencyTree): string[] {
        var sortedFiles = [];
        Object.keys(tree).forEach(fileWithDepdendencies => {
            this.getDependenciesOf(tree, fileWithDepdendencies).forEach(r => {
                pushIfNotContained(sortedFiles, r);
            });
            pushIfNotContained(sortedFiles, fileWithDepdendencies);
        });
        return sortedFiles;
    }

    private getDependenciesOf(tree: DependencyTree, file: string): string[] {
        var result = [];
        tree[file].forEach(dependency => {
            this.getDependenciesOf(tree, dependency).forEach(res => {
                pushIfNotContained(result, res);
            });
            result.push(dependency);
        });
        return result;
    }

    private addDependentFilesToFiles(tree: DependencyTree, fileName: string, files: string[]) {
        if (!tree.hasOwnProperty(fileName)) {
            tree[fileName] = [];
        }
        if (files.indexOf(fileName) === -1) {
            files.forEach(file => {
                if (file !== fileName && !tree[fileName].hasOwnProperty(file)) {
                    pushIfNotContained(tree[fileName], file);
                }
            });
        }
    }
}

//var sourceFiles = glob.sync('./../src/jsidea.ts');
//var sourceFiles = glob.sync('./../src/jsidea/layout/MoveMode/Transform.ts');
var sourceFiles = glob.sync('./../src/jsidea/**/**.ts');

var exp = new ExportExtractor();
var expReport = exp.getReport(sourceFiles);
var expReportC = exp.convertReport(expReport);
var usg = new UsageExtractor();
var usageReport = usg.findUsages(sourceFiles);
var dpm = new DependencyManager();
var tree = dpm.createDepdencyTree(expReportC, usageReport);
//console.log(tree);


function correctFileName(fileName: string): string {
    fileName = fileName.replace("../src/", "");
    fileName = fileName.replace(/\//gi, ".");
    var idx = fileName.lastIndexOf(".ts");
    return fileName.substring(0, idx);
}
Object.keys(tree).forEach(fileName => {
    var val = tree[fileName];
    delete tree[fileName];
    fileName = correctFileName(fileName);
    tree[fileName] = val;
    var l = val.length;
    for (var i = 0; i < l; ++i)
        val[i] = correctFileName(val[i]);
});

import fs = require('fs');
fs.writeFile("dependency.json", JSON.stringify(tree, null, 2), function(err) {
    if (err) {
        return console.log(err);
    }
}); 

//console.log(expReportC["jsidea.layout.Transform"]);
//console.log(expReport);
//console.log(usageReport["../src/jsidea/display/Graphics.ts"]);
//console.log(usageReport["../src/jsidea/layout/Transform.ts"]);
console.log(usageReport["../src/jsidea/layout/TransformMode/Planar.ts"]);
