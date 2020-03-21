import { SourceFile, IInterface, IMethodBase, Method, IAstNode, Field, Property } from "./Ast/Types";
import { AstTransformer } from "./AstTransformer";
import { Statement } from "./Ast/Statements";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { Expression } from "./Ast/Expressions";

export class CompilationError {
    constructor(
        public msg: string,
        public isWarning: boolean,
        public transformerName: string, 
        public node: IAstNode) { }
}

export enum LogType { Info, Warning, Error }

export class ErrorManager {
    transformer: AstTransformer = null;
    currentNode: IAstNode = null;
    errors: CompilationError[] = [];

    resetContext(transformer: AstTransformer = null) {
        this.transformer = transformer;
    }

    log(type: LogType, msg: string) {
        const t = this.transformer;

        let text = (t ? `[${t.name}] ` : "") + msg;

        let par = this.currentNode;
        while (par instanceof Expression)
            par = par.parentNode;

        let location: string = null;
        if (par instanceof Field)
            location = `${par.parentInterface.parentFile.sourcePath} -> ${par.parentInterface.name}::${par.name} (field)`;
        else if (par instanceof Property)
            location = `${par.parentClass.parentFile.sourcePath} -> ${par.parentClass.name}::${par.name} (property)`;
        else if (par instanceof Method)
            location = `${par.parentInterface.parentFile.sourcePath} -> ${par.parentInterface.name}::${par.name} (method)`;
        else if (par === null) { }
        else
            debugger;

        if (location === null && t !== null && t.currentFile !== null) {
            location = `${t.currentFile.sourcePath}`;
            if (t.currentInterface !== null) {
                location += ` -> ${t.currentInterface.name}`;
                if (t.currentMethod instanceof Method)
                    location += `::${t.currentMethod.name}`;
                else if (t.currentMethod === null) { }
                else
                    debugger;
            }
        }

        if (location !== null)
            text += `\n  Location: ${location}`;

        if (t !== null && t.currentStatement !== null)
            text += `\n  Statement: ${TSOverviewGenerator.stmt(t.currentStatement, true)}`;

        if (this.currentNode !== null)
            text += `\n  Node: ${TSOverviewGenerator.nodeRepr(this.currentNode)}`;

        if (type === LogType.Info)
            console.log(text);
        else if (type === LogType.Warning)
            console.error(`[WARNING] ${text}\n`);
        else if (type === LogType.Error)
            console.error(`${text}\n`);
        else
            debugger;

        if (type === LogType.Error || type === LogType.Warning)
            this.errors.push(new CompilationError(msg, type === LogType.Warning, t && t.name, this.currentNode));
    }

    info(msg: string) {
        this.log(LogType.Info, msg);
    }

    warn(msg: string) {
        this.log(LogType.Warning, msg);
    }

    throw(msg: string) {
        this.log(LogType.Error, msg);
    }
}