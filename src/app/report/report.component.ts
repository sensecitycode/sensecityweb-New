import { Component, OnInit, ViewEncapsulation, NgZone, DoCheck, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';
import { ToastrService } from 'ngx-toastr';

import * as L from 'leaflet';
import * as UntypedL from 'leaflet/dist/leaflet-src'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers';


@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class ReportComponent implements OnInit {

    constructor(private translationService: TranslationService, private issuesService: IssuesService, private toastr: ToastrService, private zone: NgZone) { }


    issueReportForm: FormGroup;
    issues = [
        {type:"garbage", subtypes:["damaged_bin", "oversized_objects", "tree_branches", "debris", "street_cleaning", "road_sweeping", "other"]},
        {type:"lighting", subtypes:["burned_out_bulb", "flickering_bulb", "lighting_expansion", "fixture_installation", "other"]},
        {type:"road-constructor", subtypes:["pothole", "encroachment", "broken_tiles", "abandoned_car", "pavement_squating", "broken_bench", "botchery","other"]},
        {type:"protection-policy", subtypes:["natural_disaster", "unclean_private_land", "other"]},
        {type:"green", subtypes:["grass_cutting", "tree_trimming", "unclean_municipal_land", "other"]},
        {type:"environment", subtypes:["recycling", "rodent_extermination", "pest_control", "other"]},
        {type:"plumbing", subtypes:["clogged_drain", "broken_drain", "leakage", "other"]},
    ]

    eponymousReportForm: FormGroup;
    // CertificationForm: FormGroup;

    mapInit: {};
    mapLayers = [];
    issueZoom:number
    issueCenter: L.LatLng

    @ViewChild('stepper') stepper;
    selectedStepIndex = 0

    ngOnInit() {
        let baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })
        this.mapInit = {
            layers: [baseLayer],
            zoom: this.issuesService.cityCenter.zoom,
            center: L.latLng(this.issuesService.cityCenter.lat , this.issuesService.cityCenter.lng)
        };

        this.issueReportForm = new FormGroup({
            longitude: new FormControl({value: '', disabled: true}, Validators.required),
            latitude: new FormControl({value: '', disabled: true}, Validators.required),
            address: new FormControl('', Validators.required),
            issue_type: new FormControl('garbage', Validators.required),
            issue_subtype: new FormControl('damaged_bin', Validators.required),
            issue_misc_desc: new FormControl(''),
            comment: new FormControl('')
        })

        this.eponymousReportForm = new FormGroup({
            fullname: new FormControl(''),
            email: new FormControl(''),
            mobile: new FormControl('')
        })
    }

    mapEditAllowed = true
    stepperSelectionChange(event) {
        console.log(event)
        if (event.selectedIndex == 0) {
            this.mapEditAllowed = true
        }

        if (event.previouslySelectedIndex == 0) {
            this.mapEditAllowed = false;
            this.fetchIssuePolicies()
            if (this.eponymousCheckbox) {
                this.fetchRecommendedIssues()
            }
        }

        if (event.previouslySelectedIndex == 1 && event.selectedIndex > 1 && this.eponymousCheckbox) {
            this.isUserActivated()
        }

        if (event.previouslySelectedIndex == 1 && !this.eponymousCheckbox) {
            this.recommendedIssues = []
            this.selectedRecomIndex = undefined
        }

        if (event.selectedIndex == 2 && this.recommendedIssues.length == 0) {
            console.log('optional')
            if (event.previouslySelectedIndex < 2) {
                this.selectedStepIndex = 3
            }
            if (event.previouslySelectedIndex > 2) {
                this.selectedStepIndex = 1
            }
        }

        if (event.previouslySelectedIndex == 3) {
            this.resetCertificationForm()
        }
    }


    //
    //  STEP 1 - ISSUE REPORT
    //

    imageUrl = '';
    imageName = '';
    onSelectFile(event) {
        console.log(event)
        this.imageName = '';
        this.imageUrl = '';
        if (event.target.files && event.target.files[0]) {

            if (event.target.files[0].type=='image/jpeg' || event.target.files[0].type=='image/png') {

                if (event.target.files[0].size < 5242880) {
                    let reader = new FileReader();
                    this.imageName = event.target.files[0].name

                    console.log(event)

                    reader.readAsDataURL(event.target.files[0]); // read file as data url
                    reader.onload = (event) => {
                        console.log(event)
                        this.imageUrl = event.target['result'];
                    }
                } else {
                    this.toastr.error(this.translationService.get_instant('SIZE_LARGER_5MB_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
            } else {
                this.toastr.error(this.translationService.get_instant('VALID_FILE_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
            }

        }
    }

    issueSelectedIndex:number = 0;
    changeIssueType(index) {
        // console.log(index)
        this.issueSelectedIndex = index
        this.issueReportForm.patchValue({issue_subtype:this.issues[index].subtypes[0]})
    }

    searchAddress(address) {
        if (address != '')
        {
            this.issuesService.get_address_coordinates(address)
                .subscribe(
                    data =>
                    {
                        if (data.results.length > 0) {
                            console.log(this.issueCenter)
                            this.displayIssuesOnMap(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
                            this.issueReportForm.patchValue({address:data.results[0].formatted_address})
                        } else {
                            this.toastr.error(this.translationService.get_instant('ADDRESS_NOT_FOUND_MSG'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                        }
                    },
                    error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                )
        }
    }

    cityPolicy:object
    step2_disabled:boolean = true;
    displayIssuesOnMap(lat, lng) {
        this.issueCenter =  L.latLng(lat,lng)
        this.issueZoom = 17


        this.mapLayers = []
        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
            icon: 'fa-info-circle',
            markerColor: 'red',
            prefix: 'fa',
        });
        let issueMarker = new L.Marker([lat, lng], {icon: AwesomeMarker})

		this.mapLayers.push(issueMarker)
        this.issueReportForm.patchValue({latitude:lat, longitude:lng})

        this.issuesService.fetch_city_policy(lat, lng)
        .subscribe(
            (data) => {data.length > 0 ? this.cityPolicy = data[0]: this.cityPolicy = {} },
            (error) => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () =>
            {
                console.log(this.cityPolicy)
                if (this.cityPolicy['municipality'] && this.cityPolicy['municipality'] == this.issuesService.city) {
                    // console.log(this.cityPolicy['city'])
                    this.step2_disabled = false;

                    //
                    //for 2nd step
                    this.smsChecked = (this.cityPolicy['mandatory_sms'].toLowerCase() === "true")
                    this.emailChecked = (this.cityPolicy['mandatory_email'].toLowerCase() === "true")

                    //
                    //for 3nd step

                } else {
                    this.step2_disabled = true;
                    this.toastr.error(this.translationService.get_instant('INVALID_ADDRESS_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
            }
        )
    }

    onMapReady(map: L.Map){
        console.log("map ready")
        // map.doubleClickZoom.disable()
        map.on('click', (ev:L.LeafletMouseEvent) => {
            // console.log(ev.latlng)
            if (this.mapEditAllowed == true) {
            //
            //NgZone because map click is outside of AngularScope
            //
                this.zone.run(() => {
                    this.displayIssuesOnMap(ev.latlng.lat, ev.latlng.lng);


                    this.issuesService.get_issue_address(ev.latlng.lat, ev.latlng.lng)
                        .subscribe(
                            data =>
                            {
                                if (data.results.length > 0) {
                                    this.issueReportForm.patchValue({address:data.results[0].formatted_address})
                                }
                            },
                            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    )
                });
            }
        })
    }

    //
    //  --- END OF STEP 1 - ISSUE REPORT ---
    //

    //
    //  STEP 2 - EPONYMOUS REPORT
    //

    issueCityPolicy:object;
    eponymousCheckbox = true;
    smsChecked = false;
    emailChecked = false;
    fetchIssuePolicies() {
        this.issuesService.fetch_issue_city_policy(this.issueReportForm.get('latitude').value, this.issueReportForm.get('longitude').value, this.issueReportForm.get('issue_type').value)
        .subscribe(
            data => this.issueCityPolicy = data[0],
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () => {

            }

        )
    }

    //
    //  --- END OF STEP 2 - EPONYMOUS REPORT ---
    //

    //
    //  STEP 3 - RECOMMENDED ISSUE
    //
    recommendedIssues = []
    fetchRecommendedIssues() {
        this.issuesService.fetch_recommended_issues(this.issueReportForm.get('latitude').value, this.issueReportForm.get('longitude').value, this.issueReportForm.get('issue_type').value)
        .subscribe(
            data => {data.length > 0 ? this.recommendedIssues = data[0].bugs: this.recommendedIssues = []; console.log(this.recommendedIssues) },
            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
            () => {
                this.recommendedIssues.forEach( (element) => {
                    element.icon = `fa ${this.issuesService.get_issue_icon(this.issueReportForm.get('issue_type').value)}`
                    element.URL = 'issue/' + element.alias[0]
                })
            }
        )
    }

    selectedRecomIndex:number
    selectRecommendedIssue(index) {
        (this.selectedRecomIndex != index) ? this.selectedRecomIndex = index : this.selectedRecomIndex = undefined
    }
    //
    //  --- END OF STEP 3 - RECOMMENDED ISSUE ---
    //

    //
    //  STEP 4 - CERTIFICATION
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
                    console.log(this.isActivated.activate_email);
                    (this.isActivated.activate_email == "1") ? this.emailActivated = true : this.emailActivated = false
                }
                if (this.smsChecked) {
                    console.log(this.isActivated.activate_sms);
                    (this.isActivated.activate_sms == "1") ? this.mobileActivated = true : this.mobileActivated = false
                }
                console.log(this.checkActivatedGuards())
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
                console.log(data)
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
                console.log(data)
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
        this.issuesService.request_mobile_code(this.eponymousReportForm.get('fullname').value, this.eponymousReportForm.get('mobile').value, this.issueReportForm.get('latitude').value, this.issueReportForm.get('longitude').value)
        .subscribe(
            data => {
                console.log(data)
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
                console.log(data)
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
    //  --- END OF STEP 4 - CERTIFICATION ---
    //

    //
    //  STEP 5 - SUBMIT ISSUE
    //

    issueReportSent = false
    sendIssueReport() {
        this.issueReportSent = true
        console.log(this.recommendedIssues)
        console.log(this.selectedRecomIndex)
        if (this.selectedRecomIndex == undefined ) {
            console.log('submit')
            let value_desc = "";
            this.issueReportForm.get('issue_subtype').value != "other" ? value_desc = this.translationService.get_instant("ISSUE_SUBTYPES." + this.issueReportForm.get('issue_subtype').value.toUpperCase()) : value_desc = this.issueReportForm.get('issue_misc_desc').value

            let image_name = ""
            this.imageName == "" ? image_name = "no-image" : image_name = this.imageUrl

            let issue_obj = {
                "loc": {
                    "type":"Point",
                    "coordinates":[this.issueReportForm.get('longitude').value, this.issueReportForm.get('latitude').value]
                },
                "issue":this.issueReportForm.get('issue_type').value,
                "device_id":"webapp",
                "value_desc":value_desc,
                "image_name":image_name,
                "city_address":this.issueReportForm.get('address').value
            }

            if (this.issueReportForm.get('comment').value != '') {
                issue_obj['comments'] = this.issueReportForm.get('comment').value.replace(/\s+/g, ' ').trim()
            }

            let issueReportResponse = {}
            this.issuesService.issue_report_anon(issue_obj)
            .subscribe(
                data => issueReportResponse = data,
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true}),
                () => {
                    if (this.eponymousCheckbox) {
                        console.log("eponumous")
                        let user_obj = {
                            "uuid":"web-site",
                            "name":this.eponymousReportForm.get('fullname').value,
                            "email":this.eponymousReportForm.get('email').value,
                            "mobile_num":this.eponymousReportForm.get('mobile').value
                        }
                        this.issuesService.make_issue_eponymous(issueReportResponse["_id"], user_obj)
                        .subscribe(
                            data => {
                                if (data.description && data.description == "ok") {
                                    this.toastr.success(this.translationService.get_instant('ISSUE_REPORT_SUCCESS'), this.translationService.get_instant('SUCCESS'), {timeOut:8000, progressBar:true, enableHtml:true})
                                } else {
                                    this.toastr.error(this.translationService.get_instant('ISSUE_REPORT_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                                }
                                this.resetStepper()
                            },
                            error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                        )
                    }
                }
            )
        } else {
            console.log('subscribe')
            console.log(this.recommendedIssues[this.selectedRecomIndex])
            let sub_obj = {
                "name":this.eponymousReportForm.get('fullname').value,
                "email":this.eponymousReportForm.get('email').value,
                "mobile_num":this.eponymousReportForm.get('mobile').value,
                "bug_id":this.recommendedIssues[this.selectedRecomIndex].id
            }

            if (this.issueReportForm.get('comment').value != '') {
                sub_obj['comment'] = this.issueReportForm.get('comment').value.replace(/\s+/g, ' ').trim()
            }


            let issueSubResponse = {}
            this.issuesService.issue_subscribe(sub_obj)
            .subscribe(
                data => {
                    console.log(data);
                    if (data.message == "OK") {
                        this.toastr.success(this.translationService.get_instant('ISSUE_SUB_ERROR'), this.translationService.get_instant('SUCCESS'), {timeOut:8000, progressBar:true, enableHtml:true})
                    } else {
                        this.toastr.error(this.translationService.get_instant('SMS_NOT_SUPPORTED_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    }
                    this.resetStepper()
                },
                error => {
                    console.log(error)
                    if (error.error == "Bad Request") {
                        this.toastr.error(this.translationService.get_instant('ISSUE_SUB_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    } else {
                        this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    }
                }
            )

        }

    }

    resetStepper() {
        this.selectedStepIndex = 0
        this.stepper.reset()

        this.step2_disabled = true;
        // this.issueReportForm.reset();
        this.issueSelectedIndex = 0
        this.issueReportForm.patchValue({issue_type:'garbage', issue_subtype:'damaged_bin'})

        this.imageName = '';
        this.imageUrl = '';
        this.issueZoom = this.issuesService.cityCenter.zoom,
        this.issueCenter = L.latLng(this.issuesService.cityCenter.lat , this.issuesService.cityCenter.lng)
        this.mapLayers = []

        this.recommendedIssues = []
        this.selectedRecomIndex = undefined

        this.emailCodeSent = false;
        this.emailCodeChecked = false;
        this.mobileCodeSent = false;
        this.mobileCodeChecked = false;

        this.issueReportSent = false;
    }

    //
    //  --- END OF STEP 5 - SUBMIT ISSUE ---
    //





    // ngDoCheck() {
    //     console.log('change')
    //     // this.changeDetection.markForCheck()
    // }



}
