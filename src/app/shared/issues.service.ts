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
    API_HOST:string;
    googleKey:string;
    twitterId:string;
    cityCenter:{
        lat:number,
        lng:number,
        zoom:number
    }
    issuesLast7days = []
    feelingsLast7days = []
    allIssuesLastMonths = []
    openIssuesLastMonths = []
    solutionsLastMonths = []

    fetch_issues(_enddate,_startdate, _status) {
        let reqparams = {
            city: this.city,
            startdate: _startdate,
            enddate: _enddate,
            image_field: '0',
            includeAnonymous: '0',
            status: _status
        }
        return this.httpClient.get<any>(`${this.API}/issue`, {params:reqparams})
    }

    fetch_limited_issues(_limit, _offset) {
        let reqparams = {
            city: this.city,
            startdate: "2017-01-01",
            limit: _limit,
            offset: _offset,
            sort: "-1",
            status: "CONFIRMED|IN_PROGRESS|RESOLVED"
        }
        return this.httpClient.get<any>(`${this.API}/issue`, {params:reqparams})
    }

    fetch_last_6_issues() {
        let reqparams = {
            city: this.city,
            image_field: '1',
            limit: '6',
            list_issue: '1',
            sort: '-1',
            startdate: '2017-01-01'
        }

        return this.httpClient.get<any>(`${this.API}/issue`, {params:reqparams})
    }

    fetch_feelings(_enddate,_startdate,_feeling) {

        let reqparams = {
            city: this.city,
            startdate: _startdate,
            enddate: _enddate,
            feeling: _feeling
        }

        return this.httpClient.get<any>(`${this.API}/feelings`, {params:reqparams})
    }

    fetch_fullIssue(issueID) {
        return this.httpClient.get<any>(`${this.API}/fullissue/${issueID}`)
    }

    search_issue(searchParams){
        searchParams['city'] = this.city
        return this.httpClient.get<any>(`${this.API}/issue`, {params:searchParams})
    }

    fetch_fixed_points() {
        return this.httpClient.get<any>(`assets/env-specific/${this.city}.json`)
    }

    fetch_nearby_fixed_points(long, lat, type) {
        return this.httpClient.get<any>(`${this.API_HOST}/fix_point/${long}/${lat}/50/${type}`)
    }

    fetch_city_boundaries() {
        return this.httpClient.get<any>(`${this.API}/city_coordinates?city=${this.city}`)
    }

    fetch_issue_city_policy(lat, lng, issue) {
        return this.httpClient.get<any>(`${this.API}/city_policy?coordinates=[${lng},${lat}]&issue=${issue}`)
    }

    fetch_city_policy(lat, lng) {
        let httpParams = new HttpParams().append("lat", lat).append("long", lng)
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

    is_user_activated(name, email, mobile) {
        let request_params = {
            "uuid":"web-site",
            "name":name,
            "city":this.city
        }
        if (email!="") request_params['email'] = email
        if (mobile!="") request_params['mobile'] = mobile

        return this.httpClient.post<any>(`${this.API}/is_activate_user`, request_params)
    }

    request_email_code(name, email) {
        let httpParams = new HttpParams().append("uuid", "web-site").append("name", name).append("email", email)
        return this.httpClient.post<any>(`${this.API}/activate_user`, {}, {params:httpParams} )
    }

    activate_email(email ,code) {
        let httpParams = new HttpParams().append("uuid", "web-site").append("email", email).append("code", code)
        return this.httpClient.post<any>(`${this.API}/activate_email`, {}, {params:httpParams} )
    }

    request_mobile_code(name, mobile, lat, long) {
        let httpParams = new HttpParams().append("uuid", "web-site").append("name", name).append("mobile", mobile).append("lat", lat).append("long", long).append("city", this.city)
        return this.httpClient.post<any>(`${this.API}/activate_user`, {}, {params:httpParams} )
    }

    activate_mobile(mobile ,code) {
        let httpParams = new HttpParams().append("uuid", "web-site").append("mobile", mobile).append("code", code)
        return this.httpClient.post<any>(`${this.API}/activate_mobile`, {}, {params:httpParams} )
    }

    issue_report_anon (issue) {
        return this.httpClient.post<any>(`${this.API}/issue`, issue)
    }

    make_issue_eponymous (issue_id, user_data) {
        return this.httpClient.post<any>(`${this.API}/issue/${issue_id}`, user_data)
    }

    issue_subscribe (subscription) {
        return this.httpClient.post<any>(`${this.API}/issue_subscribe`, subscription)
    }

    issue_subscribe_register (subscription, files) {
        return this.httpClient.post(`${this.API}/issue_register`, files, { params:subscription, responseType:'text'})
    }


    fetch_issue_comment(bug_id) {
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
                break
            case 'testcity1':
                sensors.push({"issue": "photovoltaic", "name":"tsigkanos", "modelName": "HIT H250E01", "address": "Mykonou 6", "lastUpdateTime":"2018-06-29 16:33:02", "currentPower":"7493.917", "loc": {"type": "Point", "coordinates": [21.816411637667308, 38.288982228304015]}})
                sensors.push({"issue": "photovoltaic", "name":"tsigkanos", "modelName": "HIT H250E01", "address": "Mykonou 6", "lastUpdateTime":"2018-06-29 16:33:02", "currentPower":"7493.917", "loc": {"type": "Point", "coordinates": [21.836411637667308, 38.268982228304015]}})
        }
        return sensors
    }


    updateIssueStatus = new Subject();
    update_bug(update_obj, comment, files) {
        update_obj['product'] = this.city;
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
        return this.httpClient.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&sensor=false&language=${query_lang}&key=${this.googleKey}`)
    }
}
