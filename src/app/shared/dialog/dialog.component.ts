import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';

import {MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material';

import { TranslationService } from '../translation.service'


@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class DialogComponent implements OnInit {

    constructor(private translationService: TranslationService,
        private dialogRef: MatDialogRef<any>) { }

    ngOnInit() {
    }

    closeDialog(action) {
        this.dialogRef.close(action)
    }
}
