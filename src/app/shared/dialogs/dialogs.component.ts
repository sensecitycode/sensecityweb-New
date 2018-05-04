import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslationService } from '../../shared/translation.service';

// import { UsersService } from '../../dashboard/users/users.service';

@Component({
    selector: 'app-dialogs',
    templateUrl: './dialogs.component.html',
    styleUrls: ['./dialogs.component.css'],
    encapsulation: ViewEncapsulation.Emulated,
})
export class DialogsComponent implements OnInit {

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<DialogsComponent>,
        private translationService: TranslationService,
        // private usersServ: UsersService
    ) { }

    originalNameField:string;
    originalEmailField:string;
    resetPasswordMsg:boolean = false;
    userEditForm: FormGroup;
    successfulEdit:boolean = false;

    userAddForm: FormGroup;
    roleList: [string];

    ngOnInit() {
        console.log(this.data);
        switch (this.data.action) {
            case "userEdit":
                this.userEditForm = this.formBuilder.group({
                    'username': [this.data.rowData.username, Validators.required],
                    'email': [this.data.rowData.email, [Validators.required,Validators.email]]
                })
                this.originalNameField = this.data.rowData.username;
                this.originalEmailField = this.data.rowData.email;
                // console.log(this.userEditForm);
                console.log(this.dialogRef);
                break;

            case "userAdd":
            this.roleList = ['DASHBOARD.ROLES.CITY_ADMIN','DASHBOARD.ROLES.ISSUE_ADMIN','DASHBOARD.ROLES.DEP_ADMIN','DASHBOARD.ROLES.DEP_USER'];
                this.userAddForm = this.formBuilder.group({
                    'fullname': ['',Validators.required],
                    'username': ['',Validators.required],
                    'email': ['', [Validators.required,Validators.email]],
                    'roles': ['',Validators.required]
                })
                console.log(this.userAddForm);

                break;
        }
    }

    onResetPassword() {
        this.resetPasswordMsg = true;
    }

    onSubmitEditUser() {
        // this.usersServ.edit_user(this.originalNameField, this.userEditForm.value);
        this.dialogRef.close(this.userEditForm.value);
    }

    onSubmitAddUser() {
        console.log('submit add user');
        // this.usersServ.add_user(this.userAddForm.value);
        this.dialogRef.close(this.userAddForm.value);

    }

}
