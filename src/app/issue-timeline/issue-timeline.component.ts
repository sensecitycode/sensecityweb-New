import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';


import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';

import { ToastrService } from 'ngx-toastr';
import { Lightbox } from 'angular2-lightbox';

import { } from '@types/googlemaps';

import * as L from 'leaflet';
import * as UntypedL from 'leaflet/dist/leaflet-src'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers';

import * as moment from 'moment';



@Component({
    selector: 'app-issue-timeline',
    templateUrl: './issue-timeline.component.html',
    styleUrls: ['./issue-timeline.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class IssueTimelineComponent implements OnInit {

    constructor(private translationService: TranslationService, private issuesService: IssuesService, private toastr: ToastrService, private activatedRoute:ActivatedRoute, private lightbox: Lightbox) { }

    initial_language = this.translationService.getLanguage();
    issueID:string;
    issue:any = {}

    activeMap = 'leaflet';
    @ViewChild('gmap1') gmapElement: any;

    mapInit:object;
    issueZoom:number ;
    issueCenter: L.LatLng
    mapLayers = [];


    eponymousReportForm: FormGroup;

    @ViewChild('stepper') stepper;
    @ViewChild('allowLastStep') allowLastStep;
    selectedStepIndex = 0


    ngOnInit() {
        if (this.activatedRoute.routeConfig.path == "issue/:id") {
            this.issueID = this.activatedRoute.snapshot.params.id
        } else {
            this.issueID = this.activatedRoute.snapshot.queryParams.issue
        }

        if (this.issueID != undefined)
            this.fetchFullIssue()


        let baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })
        this.mapInit = {
            layers: [baseLayer],
            zoom: this.issuesService.cityCenter.zoom,
            center: L.latLng(this.issuesService.cityCenter.lat , this.issuesService.cityCenter.lng)
        };

        this.eponymousReportForm = new FormGroup({
            fullname: new FormControl(''),
            email: new FormControl(''),
            mobile: new FormControl('')
        })
    }

    fetchFullIssue() {
        this.issuesService.fetch_fullIssue(this.issueID)
        .subscribe(
            data => {
                if (data.length > 0) {
                    this.issue = data[0]
                } else {
                    this.toastr.error(this.translationService.get_instant('ISSUE_NOT_FOUND_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                }
            },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () => {
                this.displayIssueOnMap(this.issue)
                this.fetchHistory()
                this.fetchIssueImage()
                this.fetchNearbyFixedPoints()
                this.fetchCityPolicy(this.issue.loc.coordinates[1], this.issue.loc.coordinates[0])

            }
        )
    }

    displayIssueOnMap(issue) {
        let icon = this.issuesService.get_issue_icon(issue.issue)
        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
            icon: icon,
            markerColor: 'red',
            prefix: 'fa',
        });

        let issueMarker = new L.Marker([issue.loc.coordinates[1],issue.loc.coordinates[0]], {icon: AwesomeMarker})

        this.mapLayers.push(issueMarker)

        this.issueZoom = 17;
        this.issueCenter = L.latLng([issue.loc.coordinates[1],issue.loc.coordinates[0]])

        // this.initGoogleStreetView()
    }

    history = []
    fetchHistory() {
        this.history = []

        let com_text:string
        let duplicate_issue_status = '';

        this.issue.bugs[this.issue.bug_id].comments.slice(1).forEach((comment, comment_index) => {

            com_text = comment.text
            let com_text_splitted = com_text.split(" ");
            switch (true) {
                case (com_text_splitted[0] == "undefined"):
                    com_text = "undefined";
                    break
                case (com_text_splitted.indexOf("This") != -1):
                    com_text = com_text_splitted[com_text_splitted.length-2];
                    duplicate_issue_status = 'RESOLVED';
                    break
                case (com_text_splitted.indexOf("Bug") != -1):
                    com_text = this.translationService.get_instant("DASHBOARD.DUPLICATE_ISSUE_REPORTED") + " #" + com_text_splitted[2]
                    duplicate_issue_status = 'CONFIRMED';
            }


            var status_index = -1;
            var dep_index = -1;
            var filename:string;
            var fileURLs = [];
            var file_types = [];
            var name:string;
            var user_status:string;
            for (let l = 0; l < comment.tags.length; l++) {

                if (comment.tags[l].split(":")[0].toUpperCase() == "STATUS") {status_index = l}

                if (comment.tags[l].split(":")[0].toUpperCase() == "DEPARTMENT") {dep_index = l}

                if (comment.tags[l].split(":")[0].toUpperCase() == "FILENAME") {
                    filename = comment.tags[l].split(":")[1]
                    fileURLs.push(this.issuesService.API + "/get_comments_files?bug_id=" + this.issue.bug_id + "&filename=" + filename);

                    (filename.split(".")[1] =='jpeg' || filename.split(".")[1] == "png") ? file_types.push("image") : file_types.push("application")
                }

                if (comment.tags[l].split(":")[0].toUpperCase() == "NAME") { name = comment.tags[l].split(":")[1]}

                if (comment.tags[l].split(":")[0].toUpperCase() == "ACTION" && comment.tags[l].split(":")[1].toUpperCase() == "NEW-USER") {
                    user_status = "NEW-USER";
                    for (let j = 0; j < comment.tags.length; j++){
                        if (comment.tags[j].split(":")[0].toUpperCase() == "NAME") {
                            var cc_name = comment.tags[j].split(":")[1];
                        }
                        if (comment.tags[j].split(":")[0].toUpperCase() == "MOBILE") {
                            var cc_mobile = comment.tags[j].split(":")[1];
                        }
                        if (comment.tags[j].split(":")[0].toUpperCase() == "EMAIL") {
                            var cc_email = comment.tags[j].split(":")[1];
                        }
                    }
                }

                if (comment.tags[l].split(":")[0].toUpperCase() == "ACTION" && comment.tags[l].split(":")[1].toUpperCase() == "USER-EXISTED") {
                    user_status = "USER-EXISTED";
                }

            }

            var history_object = {
                "fileURLs": fileURLs,
                "file_types": file_types,
                "text": com_text,
                "timestamp": comment.time,
                "created_at": moment(new Date(comment.time)).locale(this.initial_language).format('DD MMM YYYY')
            }

            if (status_index != -1) {
                history_object['state'] = comment.tags[status_index].split(":")[1]
                history_object['department'] = comment.tags[dep_index].split(":")[1]

                // history.push({"fileURLs": fileURLs, "file_types": file_types,"text": com_text, "timestamp": comment.time, "state": comment.tags[status_index].split(":")[1], "department": comment.tags[dep_index].split(":")[1] });
            } else {

                history_object['state'] = 'USER_COMMENTED';

                if (duplicate_issue_status)  history_object['state'] = duplicate_issue_status

                history_object['department'] = this.history[comment_index-1].department
                history_object['name'] = name

                if (user_status == 'USER-EXISTED' ) {
                    if (fileURLs.length == 0){
                        history_object['state'] = 'USER_COMMENTED'
                    }else{
                        history_object['state'] = 'USER_UPLOADED_FILES'
                    }
                }

                if (user_status == 'NEW-USER' ) {
                    history_object['state'] = 'NEW_USER_SUBSCRIBED'
                }
            }

            this.history.push(history_object)

        })
    }

    fetchNearbyFixedPoints() {
        let type:string
        if (this.issue.issue == 'garbage') type = 'garbage'
        if (this.issue.issue == 'lighting') type = 'fotistiko'

        if (type != undefined) {
            this.issuesService.fetch_nearby_fixed_points(this.issue.loc.coordinates[0], this.issue.loc.coordinates[1], type)
            .subscribe(
                data => {
                    for (let FixPnt of data) {
                        if (FixPnt.type == 'garbage') {
                            let AwesomeMarker;
                            switch (FixPnt.notes[0].ANAKIKLOSI) {
                                case '0':
                                    AwesomeMarker = UntypedL.AwesomeMarkers.icon({
                                        icon: 'fa-trash-o',
                                        markerColor: 'green',
                                        prefix: 'fa',
                                        className: 'awesome-marker awesome-marker-square'
                                    });
                                    break;
                                case '1':
                                    AwesomeMarker = UntypedL.AwesomeMarkers.icon({
                                        icon: 'fa-trash-o',
                                        markerColor: 'blue',
                                        prefix: 'fa',
                                        className: 'awesome-marker awesome-marker-square'
                                    });
                            }
                            let TrashMarker = new L.Marker([FixPnt.loc.coordinates[1],FixPnt.loc.coordinates[0]], {icon: AwesomeMarker})
                            this.mapLayers.push(TrashMarker);
                            // StaticGarbageMarkers.push(TrashMarker);
                        }

                        if (FixPnt.type == 'fotistiko') {
                            let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                                icon: 'fa-lightbulb-o',
                                markerColor: 'orange',
                                prefix: 'fa',
                                className: 'awesome-marker awesome-marker-square'
                            });
                            let LightMarker = new L.Marker([FixPnt.loc.coordinates[1],FixPnt.loc.coordinates[0]], {icon: AwesomeMarker})
                            // StaticLightingMarkers.push(LightMarker);
                            this.mapLayers.push(LightMarker);
                        }
                    }
                },
                error => {}
            )
        }
    }

    issueIcon:string
    imageFetchURL:string;
    imageBroken = false;
    issueImage: [{
        src:string,
        caption:string,
        thumb:string
    }]
    fetchIssueImage() {
        this.imageFetchURL = this.issuesService.API + "/image_issue?bug_id=" + this.issue.bug_id;
        this.issueImage = [{
           src: this.imageFetchURL+"&resolution=full",
           caption: 'caption',
           thumb: this.imageFetchURL+"&resolution=medium"
        }];

        this.issueImage[0].caption = `${this.issue['bug_id']} (${this.issue['value_desc']})`
    }

    panorama: any
    initGoogleStreetView() {
        let issueType = this.issue.issue;

        var sv = new google.maps.StreetViewService();
        this.panorama = new google.maps.StreetViewPanorama(this.gmapElement.nativeElement, {motionTracking: false, motionTrackingControl: false});

        sv.getPanoramaByLocation({lat: this.issue.loc.coordinates[1], lng: this.issue.loc.coordinates[0]}, 200, checkNearestStreetView);

        let panorama = this.panorama
        let issueLoc = [this.issue.loc.coordinates[1], this.issue.loc.coordinates[0]]
        function checkNearestStreetView(panoData, status) {
            if (panoData != null) {
                var issueMarker = new google.maps.Marker({
                    position: panoData.location.latLng,
                    map: panorama,
                    icon: `../assets/issue_icons/red2x.png`,
                    visible: true
                });
                if (panorama != undefined)
                    panorama.setPosition(panoData.location.latLng);
                google.maps.event.trigger(panorama, "resize");
            }
        }
    }

    onMapSelection(map) {
        this.activeMap = map

        if (map == "google" && this.panorama == undefined) {
            this.initGoogleStreetView()
        }

        if (map == "leaflet") {
            setTimeout(() => {
                this.leafletMap.invalidateSize()
            }, 50)

        }

    }

    openLightbox() {
        this.lightbox.open(this.issueImage)
    }

    imageLoadError() {
        this.imageBroken = true;
        this.issueIcon = "fa "+this.issuesService.get_issue_icon(this.issue['issue'])
    }

    leafletMap: L.Map
    onMapReady(map: L.Map){
        map.scrollWheelZoom.disable()
        this.leafletMap = map
    }

    //stepper logic
    //

    stepperSelectionChange(event) {

        if (event.previouslySelectedIndex == 0 && event.selectedIndex > 0) {
            this.isUserActivated()
        }


        if (event.previouslySelectedIndex == 1) {
            this.resetCertificationForm()
        }
    }

    cityPolicy:any = {}
    smsChecked = false;
    emailChecked = false;
    fetchCityPolicy(lat,lng) {
        this.issuesService.fetch_city_policy(lat, lng)
        .subscribe(
            (data) => {data.length > 0 ? this.cityPolicy = data[0]: this.cityPolicy = {} },
            (error) => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () =>
            {
                this.smsChecked = (this.cityPolicy['mandatory_sms'].toLowerCase() === "true")
                this.emailChecked = (this.cityPolicy['mandatory_email'].toLowerCase() === "true")
            }
        )
    }

    //
    //STEP 2 -- CERTIFICATION
    //
    isActivated: { activate_email:string, activate_sms:string }
    emailActivated =  false;
    mobileActivated = false;
    isUserActivated() {
        // if (this.eponymousReportForm.get('email'))!=
        this.emailActivated =  false;
        this.mobileActivated = false;

        let _email = ""
        let _mobile = ""
        if (this.emailChecked) _email = this.eponymousReportForm.get('email').value
        if (this.smsChecked) _mobile = this.eponymousReportForm.get('mobile').value

        this.issuesService.is_user_activated(this.eponymousReportForm.get('fullname').value, _email, _mobile)
        .subscribe(
            data => {this.isActivated = data[0]},
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () => {
                if (this.emailChecked) {
                    (this.isActivated.activate_email == "1") ? this.emailActivated = true : this.emailActivated = false
                }
                if (this.smsChecked) {
                    (this.isActivated.activate_sms == "1") ? this.mobileActivated = true : this.mobileActivated = false
                }
            }
        )
    }

    checkActivatedGuards() {
        if (this.emailChecked && this.smsChecked) {
            return (this.emailActivated && this.mobileActivated)
        } else {
            if (this.emailChecked) return this.emailActivated
            if (this.mobileActivated) return this.mobileActivated
        }
    }

    emailCodeSent = false;
    emailCodeChecked = false;
    // emailCertified = false;

    mobileCodeSent = false;
    mobileCodeChecked = false;
    // mobileCertified = false;

    requestEmailCode() {
        this.issuesService.request_email_code(this.eponymousReportForm.get('fullname').value, this.eponymousReportForm.get('email').value)
        .subscribe(
            data => {
                if (data.length > 0) {
                    if (data[0].Status == "send") this.emailCodeSent = true
                }
            },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
        )
    }

    activateEmail(code) {
        this.issuesService.activate_email(this.eponymousReportForm.get('email').value, code)
        .subscribe(
            data => {
                this.emailCodeChecked = true
                if (data == null) {
                    this.toastr.error(this.translationService.get_instant('VERIFICATION_CODE_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
                else if (data.nModified && data.nModified == 1) {
                    this.emailActivated = true
                    this.toastr.success(this.translationService.get_instant('EMAIL_VERIFIED'), this.translationService.get_instant('SUCCESS'), {timeOut:5000, progressBar:true, enableHtml:true})
                }
            },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
        )
    }

    requestMobileCode() {
        this.issuesService.request_mobile_code(this.eponymousReportForm.get('fullname').value, this.eponymousReportForm.get('mobile').value, this.issue.loc.coordinates[1], this.issue.loc.coordinates[0])
        .subscribe(
            data => {
                if (data.status) {
                    if (data.status == "send sms") this.mobileCodeSent = true
                }
            },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
        )

    }

    activateMobile(code) {
        this.issuesService.activate_mobile(this.eponymousReportForm.get('mobile').value, code)
        .subscribe(
            data => {
                this.mobileCodeChecked = true
                if (data.nModified && data.nModified == 0) {
                    this.toastr.error(this.translationService.get_instant('VERIFICATION_CODE_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
                else if (data.nModified && data.nModified == 1) {
                    this.mobileActivated = true
                    this.toastr.success(this.translationService.get_instant('MOBILE_VERIFIED'), this.translationService.get_instant('SUCCESS'), {timeOut:5000, progressBar:true, enableHtml:true})
                }
            },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
        )

    }

    resetCertificationForm() {
        this.emailCodeSent = false;
        this.emailCodeChecked = false;
        this.mobileCodeSent = false;
        this.mobileCodeChecked = false;
    }

    //
    // ~ ~ END OF STEP 2 - CERTIFICATION
    //

    //
    // STEP 3 - SUBSCRIPTION
    //
    uploadFilesFormData: FormData
    fileNamesArray = []
    fileUploadHandler(files: FileList) {
        this.fileNamesArray = [];
        this.uploadFilesFormData = new FormData();

        for (let index = 0; index < files.length; index++)  {
            this.fileNamesArray.push(files[index].name);
            this.uploadFilesFormData.append("file", files[index], files[index].name)
        }

    }

    issueReportSent = false
    commentText:string;
    sendIssueReport() {
        this.issueReportSent = true

        let sub_obj = {
            "name":this.eponymousReportForm.get('fullname').value,
            "email":this.eponymousReportForm.get('email').value,
            "mobile_num":this.eponymousReportForm.get('mobile').value,
            "bug_id":this.issue.bug_id
        }

        if (this.commentText != undefined) {
            sub_obj["comment"] = this.commentText.replace(/\s+/g, ' ').trim()
        }

        this.issuesService.issue_subscribe_register(sub_obj, this.uploadFilesFormData)
        .subscribe(
            data => {
                if (data =='success') {
                    this.toastr.success(this.translationService.get_instant('ISSUE_SUB_SUCCESS'), this.translationService.get_instant('SUCCESS'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
                this.resetStepper()
            },
            error => {
                console.error(error)
                if (error.error == "Bad Request") {
                    this.toastr.error(this.translationService.get_instant('ISSUE_SUB_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                } else {
                    this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                }
                this.resetStepper()
            }
        )
    }

    resetStepper() {
        this.selectedStepIndex = 0
        this.stepper.reset()
        this.eponymousReportForm.setValue({fullname:'', email:'', mobile:''})

        this.emailCodeSent = false;
        this.emailCodeChecked = false;
        this.mobileCodeSent = false;
        this.mobileCodeChecked = false;

        this.commentText = undefined;
        this.fileNamesArray = [];
        this.uploadFilesFormData = new FormData();


        this.issueReportSent = false;

        this.fetchFullIssue()
    }

    //
    // ENF OF STEP 3 -- SUBSCRIPTION
    //
}
