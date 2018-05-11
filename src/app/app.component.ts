import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgProgress } from '@ngx-progressbar/core';

import { Subscription } from 'rxjs'
import {Router, NavigationEnd} from "@angular/router";
declare var ga: Function;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})


export class AppComponent {
    title = 'app';

    private subscription: Subscription;
    constructor(public router: Router) {

    }

    ngOnInit() {
        this.subscription = this.router.events.subscribe(event => {
            // console.log(event)
            if (event instanceof NavigationEnd) {
            // console.log(event)
                ga('set', 'page', event.urlAfterRedirects);
                ga('send', 'pageview');

                if( event.urlAfterRedirects == '/overview') {
                    // console.log('arxikh');
                    (<any>window).twttr =(function(d, s, id) {
                    let js, fjs = d.getElementsByTagName(s)[0],
                    t = (<any>window).twttr || {};
                    if (d.getElementById(id)) return t;
                    js = d.createElement(s);
                    js.id = id;
                    js.src = 'https://platform.twitter.com/widgets.js';
                    fjs.parentNode.insertBefore(js, fjs);

                    t._e = [];
                    t.ready = function(f) {
                        t._e.push(f);
                    };

                    return t;
                }(document, 'script', 'twitter-wjs'));

                if ((<any>window).twttr.ready())
                (<any>window).twttr.widgets.load();

                }
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
