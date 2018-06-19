import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';



@Component({
    selector: 'app-bug-id-translate',
    templateUrl: './bug-id-translate.component.html',
    styleUrls: ['./bug-id-translate.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class BugIdTranslateComponent implements OnInit {

    constructor(private translationService: TranslationService, private issuesService: IssuesService, private activatedRoute:ActivatedRoute, private router: Router, private toastr: ToastrService) { }

    ngOnInit() {
        let bugId:string
        if (this.activatedRoute.routeConfig.path == "bug/:id") {
            bugId = this.activatedRoute.snapshot.params.id
        } else {
            bugId = this.activatedRoute.snapshot.queryParams.issue
        }

        if (bugId != undefined) {
            let issueResponse:any = []
            this.issuesService.search_issue({'bug_id':bugId})
            .subscribe(
                data => issueResponse = data,
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
                () => {
                    if (issueResponse.length > 0) {
                        this.router.navigate(['issue', issueResponse[0]._id])
                    } else {
                        this.toastr.error(this.translationService.get_instant('ISSUE_NOT_FOUND_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    }
                }
            )
        }
    }

}
