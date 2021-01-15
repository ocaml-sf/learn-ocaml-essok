export interface RouterButtonOptions {
    readonly active : boolean;
    readonly exact : boolean;
}

export interface RouterButton {
    readonly body : string;
    readonly color : string;
    readonly routerLink : string;
    readonly options : RouterButtonOptions;
}

export class RouterButtonImpl implements RouterButtonImpl {
    readonly body: string;
    readonly color: string;
    readonly routerLink: string;
    readonly options: RouterButtonOptions;

    constructor({ body, color, routerLink,
                  options : { exact = false } = {} } :
                { body: string; color: string; routerLink: string;
                  options? : { exact? : boolean }; }) {
        let options = { exact };
        Object.assign(this, { body, color, routerLink, options });
    }
}
