import { Component, OnInit, ViewEncapsulation, NgZone, ViewChild, ElementRef  } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import {MatDialog} from '@angular/material/dialog';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';
import { ToastrService } from 'ngx-toastr';

import * as L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
import * as UntypedL from 'leaflet/dist/leaflet-src'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers';

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function addressToMapValidator(control: FormControl) {
    return (control.parent && (control.parent.get('latitude').value == '' || control.parent.get('longitude').value == '' )) ? {addressToMap: true} :  null;
}

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})



export class ReportComponent implements OnInit {

    constructor(private translationService: TranslationService,
                private issuesService: IssuesService,
                private toastr: ToastrService,
                private zone: NgZone,
                private dialog: MatDialog) { }


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
    layersControl = {};
    issueZoom:number
    issueCenter: L.LatLng

    @ViewChild('stepper') stepper;
    @ViewChild('addressSearchInput') addressSearchInput: ElementRef;
    selectedStepIndex = 0

    ngOnInit() {
        let openStreetMaps = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })

        let googleRoadMap = UntypedL.gridLayer.googleMutant({
            type: 'roadmap',
            maxZoom: 18
        })
        googleRoadMap.addGoogleLayer('TrafficLayer');

        let googleHybrid = UntypedL.gridLayer.googleMutant({
            type: 'hybrid',
            maxZoom: 18
        })

        this.mapInit = {
            layers: [openStreetMaps],
            zoom: this.issuesService.cityCenter.zoom,
            center: L.latLng(this.issuesService.cityCenter.lat , this.issuesService.cityCenter.lng)
        };

        this.layersControl['baseLayers'] = {
            'Open Street Maps': openStreetMaps,
            'Google Maps Traffic': googleRoadMap,
            'Google Maps Satellite': googleHybrid,
        }

        this.issueReportForm = new FormGroup({
            longitude: new FormControl({value:'', disabled:true}, Validators.required),
            latitude: new FormControl({value:'', disabled:true}, Validators.required),
            address: new FormControl('', [Validators.required, addressToMapValidator]),
            issue_type: new FormControl('garbage', Validators.required),
            issue_subtype: new FormControl('damaged_bin', Validators.required),
            issue_misc_desc: new FormControl(''),
            comment: new FormControl('')
        })



        this.eponymousReportForm = new FormGroup({
            fullname: new FormControl(''),
            email: new FormControl('', [Validators.pattern(EMAIL_REGEX)]),
            mobile: new FormControl('', [Validators.pattern(/^[0-9]*$/)])
        })
    }

    mapEditAllowed = true
    stepperSelectionChange(event) {
        if (event.selectedIndex == 0) {
            this.mapEditAllowed = true
        }

        if (event.previouslySelectedIndex == 0) {
            if (Object.keys(this.cityPolicy).length !== 0) {
              this.mapEditAllowed = false;
              this.fetchIssuePolicies()
              if (this.eponymousCheckbox) {
                  this.fetchRecommendedIssues()
              }
            } else {
              setTimeout(() => {this.resetStepper()} , 1)
            }
        }

        if (this.issueCityPolicy.hasOwnProperty('add_issue') ) {
            if (this.issueCityPolicy.add_issue == 0){
                this.issueCityPolicy = {}
                setTimeout(() => {this.resetStepper()} , 1)
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
        this.imageName = '';
        this.imageUrl = '';
        if (event.target.files && event.target.files[0]) {

            if (event.target.files[0].type=='image/jpeg' || event.target.files[0].type=='image/png') {

                if (event.target.files[0].size < 5242880) {
                    let reader = new FileReader();
                    this.imageName = event.target.files[0].name


                    reader.readAsDataURL(event.target.files[0]); // read file as data url
                    reader.onload = (event) => {
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
        if (this.issueCityPolicy.hasOwnProperty('add_issue')) {
            let dialogRef = this.dialog.open(DialogComponent)

            dialogRef.afterClosed().subscribe(result => {
                if (result == "reset") {
                    this.resetStepper()
                } else {
                    this.issueReportForm.patchValue({issue_type:this.issues[this.issueSelectedIndex].type})
                }
            })
        } else {
            this.issueSelectedIndex = index
            this.issueReportForm.patchValue({issue_subtype:this.issues[index].subtypes[0]})
            this.changeIssueSubType(this.issues[index].subtypes[0])

        }
    }

    subtypeOtherSelected = false;
    changeIssueSubType(subtype) {
        if (subtype == 'other') {
            this.subtypeOtherSelected = true
        }  else {
            this.subtypeOtherSelected = false;
            this.issueReportForm.get('issue_misc_desc').clearValidators()
            this.issueReportForm.get('issue_misc_desc').updateValueAndValidity()
        }
    }

    checkEnterKey(event) {
      if (event.keyCode == 13) {
        this.searchAddress(this.addressSearchInput.nativeElement.value)
      }
    }

    searchAddress(address) {
        if (address != '')
        {
            this.issuesService.get_address_coordinates(address)
                .subscribe(
                    data =>
                    {
                        if (data.results.length > 0) {
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
    // step2_disabled:boolean = true;
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
                if (this.cityPolicy['municipality'] && this.cityPolicy['municipality'] == this.issuesService.city) {
                    // this.step2_disabled = false;

                    //
                    //for 2nd step
                    this.smsChecked = (this.cityPolicy['mandatory_sms'].toLowerCase() === "true")
                    this.emailChecked = (this.cityPolicy['mandatory_email'].toLowerCase() === "true")

                    //
                    //for 3nd step

                } else {
                    this.toastr.error(this.translationService.get_instant('INVALID_ADDRESS_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:6000, progressBar:true, enableHtml:true})
                }
            }
        )
    }

    onMapReady(map: L.Map){
        // map.doubleClickZoom.disable()
        map.on('click', (ev:L.LeafletMouseEvent) => {
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

    issueCityPolicy:any = {};
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

    checkEponymoys(changeEvent) {
        if (changeEvent.checked == false) {
            this.eponymousReportForm.get('fullname').clearValidators()
            this.eponymousReportForm.get('fullname').updateValueAndValidity()
            this.eponymousReportForm.get('email').clearValidators()
            this.eponymousReportForm.get('email').updateValueAndValidity()
            this.eponymousReportForm.get('mobile').clearValidators()
            this.eponymousReportForm.get('mobile').updateValueAndValidity()
        }
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
            data => {data.length > 0 ? this.recommendedIssues = data[0].bugs: this.recommendedIssues = []; },
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
            if (this.smsChecked) return this.mobileActivated
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
        this.issuesService.request_mobile_code(this.eponymousReportForm.get('fullname').value, this.eponymousReportForm.get('mobile').value, this.issueReportForm.get('latitude').value, this.issueReportForm.get('longitude').value)
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
    //  --- END OF STEP 4 - CERTIFICATION ---
    //

    //
    //  STEP 5 - SUBMIT ISSUE
    //

    issueReportSent = false
    sendIssueReport() {
        this.issueReportSent = true
        if (this.selectedRecomIndex == undefined ) {
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
                        let user_obj = {
                            "uuid":"web-site",
                            "name":this.eponymousReportForm.get('fullname').value
                            // "email":this.eponymousReportForm.get('email').value,
                            // "mobile_num":this.eponymousReportForm.get('mobile').value
                        }

                        this.smsChecked ? user_obj["mobile_num"] = this.eponymousReportForm.get('mobile').value : user_obj["mobile_num"] = ''
                        this.emailChecked ? user_obj["email"] = this.eponymousReportForm.get('email').value : user_obj["email"] = ''

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
            let sub_obj = {
                "name":this.eponymousReportForm.get('fullname').value,
                // "email":this.eponymousReportForm.get('email').value,
                // "mobile_num":this.eponymousReportForm.get('mobile').value,
                "bug_id":this.recommendedIssues[this.selectedRecomIndex].id
            }

            this.smsChecked ? sub_obj["mobile_num"] = this.eponymousReportForm.get('mobile').value : sub_obj["mobile_num"] = ''
            this.emailChecked ? sub_obj["email"] = this.eponymousReportForm.get('email').value : sub_obj["email"] = ''

            if (this.issueReportForm.get('comment').value != '') {
                sub_obj['comment'] = this.issueReportForm.get('comment').value.replace(/\s+/g, ' ').trim()
            }


            let issueSubResponse = {}
            this.issuesService.issue_subscribe(sub_obj)
            .subscribe(
                data => {
                    if (data.message == "OK") {
                        this.toastr.success(this.translationService.get_instant('ISSUE_SUB_SUCCESS'), this.translationService.get_instant('SUCCESS'), {timeOut:8000, progressBar:true, enableHtml:true})
                    } else {
                        this.toastr.error(this.translationService.get_instant('SMS_NOT_SUPPORTED_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                    }
                    this.resetStepper()
                },
                error => {
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

        // this.step2_disabled = true;

        this.issueSelectedIndex = 0
        this.subtypeOtherSelected = false
        this.imageName = '';
        this.imageUrl = '';
        this.issueReportForm.patchValue({issue_type:'garbage', issue_subtype:'damaged_bin', comment:''})
        // this.issueReportForm.get('address').setErrors(null)
        this.issueZoom = this.issuesService.cityCenter.zoom,
        this.issueCenter = L.latLng(this.issuesService.cityCenter.lat , this.issuesService.cityCenter.lng)
        this.mapLayers = []

        this.issueCityPolicy = {}
        this.eponymousCheckbox = true
        this.eponymousReportForm.setValue({fullname:'', email:'', mobile:''})

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


}
