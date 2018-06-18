import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IssuesService } from './shared/issues.service';

@Component({
    selector: 'app-bootstrap',
    template: '<router-outlet></router-outlet>',
})

export class AppBootStrapComponent implements OnInit{

    constructor(private route: ActivatedRoute,private issuesService: IssuesService) {}

    public API:string
    public API_HOST:string;
    public STATISTICS_URL:string;
    public GOOGLE_KEY:string;
    public TWITTER_WIDGET_IDS:object;
    public CITY_CENTERS:object;
    ngOnInit() {
        this.API = this.route.snapshot.data['envSpecific'].API;
        this.API_HOST = this.route.snapshot.data['envSpecific'].API_HOST;
        this.STATISTICS_URL = this.route.snapshot.data['envSpecific'].TEMP_STATISTICS;
        this.GOOGLE_KEY = this.route.snapshot.data['envSpecific'].GOOGLE_KEY;
        this.TWITTER_WIDGET_IDS = this.route.snapshot.data['envSpecific'].TWITTER_WIDGET_IDS;
        this.CITY_CENTERS = this.route.snapshot.data['envSpecific'].CITY_CENTERS;




        let hostname = window.location.hostname.split('.')[0]
        if (hostname == 'localhost') {
            this.issuesService.city = 'testcity1'
            this.issuesService.twitterId = this.TWITTER_WIDGET_IDS['testcity1']
            this.issuesService.cityCenter = this.CITY_CENTERS['testcity1']
        } else {
            this.issuesService.city = hostname
            this.issuesService.twitterId = this.TWITTER_WIDGET_IDS[hostname]
            this.issuesService.cityCenter = this.CITY_CENTERS[hostname]
        }
        
        this.issuesService.API = this.API
        this.issuesService.API_HOST = this.API_HOST
        this.issuesService.googleKey = this.GOOGLE_KEY
    }
}
