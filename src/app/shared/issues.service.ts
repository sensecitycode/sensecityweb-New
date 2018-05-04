import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Subject } from 'rxjs/Subject';
import { TranslationService } from './translation.service';
import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';


@Injectable()
export class IssuesService {

    constructor(private httpClient: HttpClient, private translationService:TranslationService, private toastr: ToastrService) { }

    role:string;
    uuid:string;
    city:string;
    API:string;
    googleKey:string;
    twitterId:string;
    cityCenter:{
        lat:number,
        lng:number,
        zoom:number
    }


    // fetch_issues(reqparams) {
    //     //
    //     //awaiting migrate
    //     // this.uuid = 'dGVzdDIxMjM0NTY3OFdlZCBNYXIgMjggMjAxOCAxODo0NjozMSBHTVQrMDMwMCAoRUVTVCk=';
    //     // this.role = 'cityAdmin';
    //     //
    //     //
    //     reqparams.city = this.city;
    //     console.log("fetch_issues");
    //     const reqheaders = new HttpHeaders().set('x-uuid', this.uuid).append('x-role', this.role);
    //     return this.httpClient.get<any>(`${this.API}/admin/issue`,{params: reqparams, headers: reqheaders})
    // }

    fetch_issues(_enddate,_startdate, _status) {
        console.log("fetch_issues")
        let reqparams = {
            city: this.city,
            startdate: _startdate,
            enddate: _enddate,
            image_field: '0',
            includeAnonymous: '0',
            status: _status
        }
        console.log(reqparams)
        return this.httpClient.get<any>(`${this.API}/issue`, {params:reqparams})
    }

    fetch_last_6_issues() {
        console.log("fetch_last_6_issues")

        let reqparams = {
            city: this.city,
            image_field: '1',
            limit: '6',
            list_issue: '1',
            sort: '-1',
            startdate: '2017-01-01'
        }
        console.log(reqparams)

        return this.httpClient.get<any>(`${this.API}/issue`, {params:reqparams})
    }

    fetch_feelings(_enddate,_startdate) {
        console.log("fetch_feelings")

        let reqparams = {
            city: this.city,
            startdate: _startdate,
            enddate: _enddate
        }
        console.log(reqparams)

        return this.httpClient.get<any>(`${this.API}/feelings`, {params:reqparams})
    }

    fetch_fullIssue(issueID) {
        console.log("fetch_fullIssue")
        return this.httpClient.get<any>(`${this.API}/fullissue/${issueID}`)
    }

    fetch_fixed_points() {
        return this.httpClient.get<any>(`assets/env-specific/dev/${this.city}.json`)
    }

    fetch_city_boundaries() {
        return this.httpClient.get<any>(`${this.API}/city_coordinates?city=${this.city}`)
    }

    fetch_issue_city_policy(lat, lng, issue) {
        return this.httpClient.get<any>(`${this.API}/city_policy?coordinates=[${lng},${lat}]&issue=${issue}`)
    }

    fetch_city_policy(lat, lng) {
        let httpParams = new HttpParams().append("lat", lat).append("long", lng)
        console.log(httpParams)
        return this.httpClient.post<any>(`${this.API}/activate_city_policy`, {}, {params:httpParams} )
    }

    fetch_recommended_issues(lat, lng, issue) {
        return this.httpClient.post<any>(`${this.API}/issue_recommendation`,
            {
                "long":lng,
            	"lat": lat,
            	"issue": issue
            }
        )
    }

    fetch_issue_comment(bug_id) {
        //
        //awaiting migrate
        // this.uuid = 'dGVzdDIxMjM0NTY3OFdlZCBNYXIgMjggMjAxOCAxODo0NjozMSBHTVQrMDMwMCAoRUVTVCk=';
        // this.role = 'cityAdmin';
        //
        //
        console.log("fetch_issue_comment");
        const reqheaders = new HttpHeaders().set('x-uuid', this.uuid).append('x-role', this.role);
        return this.httpClient.post<any>(`${this.API}/admin/bugs/comment`, {id:bug_id}, {headers: reqheaders})
    }

    get_issue_icon (issue) {
        let icon
        switch (issue) {
            case 'lighting':
                icon = 'fa-lightbulb-o';
                break;
            case 'road-constructor':
                icon = 'fa-road';
                break;
            case 'garbage':
                icon = 'fa-trash-o';
                break;
            case 'green':
                icon = 'fa-tree';
                break;
            case 'plumbing':
                icon = 'fa-umbrella';
                break;
            case 'environment':
                icon = 'fa-leaf';
                break;
            case 'protection-policy':
                icon = 'fa-shield';
                break;
        }
        return icon
    }

    get_feeling_marker (feeling) {
        let icon
        let color
        switch (feeling) {
            case 'happy':
                icon = 'fa-smile-o';
                color = 'lightgreen'
                break;
            case 'neutral':
                icon = 'fa-meh-o';
                color = 'orange'
                break;
            case 'angry':
                icon = 'fa-frown-o';
                color = 'lightred'
        }
        return {"icon":icon, "color":color}
    }

    get_sensors() {
        console.log("get_sensors")
        let sensors = []
        switch (this.city) {
            case 'patras':
                sensors.push({"issue": "temperature", "value_desc": "Humidity value", "loc": {"type": "Point", "coordinates": [21.7912763, 38.2831043]}});
                sensors.push({"issue": "temperature", "value_desc": "Temperature value", "loc": {"type": "Point", "coordinates": [21.750683, 38.237351]}});
                break;
            case 'london':
                sensors.push({"issue": "humidity", "value_desc": "Humidity value", "loc": {"type": "Point", "coordinates": [-0.10797500610351562, 51.51122644944369]}});
                sensors.push({"issue": "temperature", "value_desc": "Temperature value", "loc": {"type": "Point", "coordinates": [-0.1247549057006836, 51.51610055355692]}});
                sensors.push({"issue": "temperature", "value_desc": "Temperature value", "loc": {"type": "Point", "coordinates": [-0.11132240295410155, 51.51822363035807]}});
        }
        return sensors
    }


    updateIssueStatus = new Subject();
    update_bug(update_obj, comment, files) {
        // this.uuid = 'dGVzdDIxMjM0NTY3OFdlZCBNYXIgMjggMjAxOCAxODo0NjozMSBHTVQrMDMwMCAoRUVTVCk=';
        // this.role = 'cityAdmin';
        console.log("bug_update");

        //add mantatory field 'product' at update object
        update_obj['product'] = this.city;



        console.log(update_obj)
        console.log(comment)
        console.log(files)

        const reqheaders = new HttpHeaders().set('x-uuid', this.uuid).append('x-role', this.role);
        this.httpClient.post<any>(`${this.API}/admin/bugs/update`, update_obj, {headers: reqheaders})
        .subscribe(
            data1 => {},
            error1 => {
                console.error(error1);
                console.error("error at 1st request");
                this.toastr.error(this.translationService.get_instant('DASHBOARD.ISSUE_FAILURE_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true});
            },
            () => {

                if (comment == '') comment = 'undefined'
                let comment_obj = {"comment":comment, "id":update_obj.ids[0]}
                this.httpClient.post<any>(`${this.API}/admin/bugs/comment/add`, comment_obj, {headers: reqheaders})
                .subscribe(
                    data2 => {
                        let comment_tag_obj = {"component":update_obj.component, "status":update_obj.status, "bug_id":update_obj.ids[0], "comment_id": data2.id}
                        this.httpClient.post(`${this.API}/admin/bugs/comment/tags`, files, {headers: reqheaders, params:comment_tag_obj, responseType:'text' })
                        .subscribe(
                            data3 => {},
                            error3 => {
                                console.error(error3);
                                console.error("error at 3rd request");
                                this.toastr.error(this.translationService.get_instant('DASHBOARD.ISSUE_FAILURE_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true});
                            },
                            () => {
                                this.updateIssueStatus.next("done")
                                this.toastr.success(this.translationService.get_instant('DASHBOARD.ISSUE_SUCCESS_MSG'), this.translationService.get_instant('SUCCESS'), {timeOut:6000, progressBar:true, enableHtml:true});
                            }
                        )
                    },
                    error2 => {
                        console.error(error2)
                        console.error("error at 2nd request")
                        this.toastr.error(this.translationService.get_instant('DASHBOARD.ISSUE_FAILURE_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    },
                    () => {}
                )
            }
        )
    }

    get_issue_address(latitude, longitude) {
        let query_lang = this.translationService.getLanguage();
        return this.httpClient.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&sensor=false&language=${query_lang}&key=${this.googleKey}`)
    }

    get_address_coordinates(address) {
        this.city != 'testcity1' ? address += ` ,${this.city}` : address += ' ,patra';
        let query_lang = this.translationService.getLanguage();
        // console.log(address)
        return this.httpClient.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&sensor=false&language=${query_lang}&key=${this.googleKey}`)
    }
}
