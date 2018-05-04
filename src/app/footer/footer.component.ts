import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { IssuesService } from '../shared/issues.service';
import { TranslationService } from '../shared/translation.service'


@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class FooterComponent implements OnInit {

    constructor(private translationService: TranslationService, private issuesService: IssuesService) { }

    city:string;
    ngOnInit() {
        this.city = window.location.hostname.split('.')[0]
    }

}
