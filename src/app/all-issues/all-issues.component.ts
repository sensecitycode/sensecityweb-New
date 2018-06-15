import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';

import * as moment from 'moment';

import { Subscription } from 'rxjs/Subscription'



@Component({
    selector: 'app-all-issues',
    templateUrl: './all-issues.component.html',
    styleUrls: ['./all-issues.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class AllIssuesComponent implements OnInit {

    constructor(private translationService: TranslationService, private issuesService: IssuesService, private toastr: ToastrService) { }

    // initial_language = this.translationService.getLanguage()
    issues = []
    brokenImages = []
    limit = 20
    offset = 0
    requestGuard = true;

    subscriptions = new Subscription()

    ngOnInit() {
        this.fetchIssues()

        this.subscriptions.add(this.translationService.languageChanged
        .subscribe( (new_lang: string) => {
            this.issues.forEach( (element) => {
                element.created_ago = moment(new Date(element.create_at)).locale(new_lang).fromNow()
            })
        }))
    }

    fetchIssues () {
        this.issuesService.fetch_limited_issues(this.limit, this.offset)
        .subscribe(
            data => {this.issues.push(...data)},
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
            () => {
                this.issues.forEach((element) => {
                    element.created_ago = moment(new Date(element.create_at)).locale(this.translationService.getLanguage()).fromNow()
                    element.icon = this.issuesService.get_issue_icon(element.issue)
                    element.image_URL = this.issuesService.API + "/image_issue?bug_id=" + element.bug_id + "&resolution=small"
                    element.broken_image  = false;
                })
                this.requestGuard = false;
            }
        )
    }

    imageLoadError(image_index) {
        this.issues[image_index].broken_image = true;
    }

    loadMoreIssues () {
        this.requestGuard = true
        this.offset += 20
        this.fetchIssues()
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe()
    }


}
