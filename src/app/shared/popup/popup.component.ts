import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { IssuesService } from '../issues.service';
import { TranslationService } from '../translation.service'
import { ToastrService } from 'ngx-toastr'


@Component({
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class PopupComponent implements OnInit {

    constructor(private issuesService: IssuesService, private toastr: ToastrService, private translationService: TranslationService) { }

    fullIssueFetched = new Subject()
    issueId: any;
    loading = true;
    issue:any;
    imageBroken = false;
    ngOnInit() {
        let issue_data:any
        this.issuesService.fetch_fullIssue(this.issueId)
        .subscribe (
            data =>{ this.issue = data[0] },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
            () => {

                this.loading = false
                this.fullIssueFetched.next("loaded")
                this.issue['imageUrl'] = this.issuesService.API + "/image_issue?bug_id=" + this.issue.bug_id + "&resolution=medium";
            }
        )
    }

    imageLoadError() {
        this.imageBroken = true;
        this.issue['icon'] = `fa ${this.issuesService.get_issue_icon(this.issue.issue)}`
    }



}
