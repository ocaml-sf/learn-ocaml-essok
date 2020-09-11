import { Component, Input } from '@angular/core';
import { ConfirmDialogService } from "./confirm-dialog.service";

@Component({
    selector: 'confirm-dialog',
    templateUrl: 'confirm-dialog.component.html',
    styleUrls: ['confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
    message: any;
    constructor(
        private confirmDialogService: ConfirmDialogService
    ) { }

    ngOnInit() {
        //this function waits for a message from alert service, it gets   
        //triggered when we call this from any other component  
        this.confirmDialogService.getMessage().subscribe(message => {
            this.message = message;
        });
    }
}  
