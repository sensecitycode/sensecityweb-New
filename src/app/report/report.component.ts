import { Component, OnInit, ViewEncapsulation, NgZone, DoCheck } from '@angular/core';
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
        {type:"protection-policy", subtypes:["natural_disaster", "unclean_land", "other"]},
        {type:"green", subtypes:["grass_cutting", "tree_trimming", "other"]},
        {type:"environment", subtypes:["recycling", "rodent_extermination", "pest_control", "other"]},
        {type:"plumbing", subtypes:["clogged_drain", "broken_drain", "leakage", "other"]},
    ]

    eponymousReportForm: FormGroup;
    CertificationForm: FormGroup;

    mapInit: {};
    mapLayers = [];
    issueZoom:number
    issueCenter: L.LatLng



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


    //
    //  STEP 1 - ISSUE REPORT
    //

    imageUrl = '';
    imageName = '';
    onSelectFile(event) {
        console.log(event)
        this.imageName = '';
        this.imageUrl = '';
        if (event.target.files && event.target.files[0] && event.target.files[0].size < 5242880 && (event.target.files[0].type=='image/jpeg' || event.target.files[0].type=='image/png') ) {

            let reader = new FileReader();
            this.imageName = event.target.files[0].name

            console.log(event)

            reader.readAsDataURL(event.target.files[0]); // read file as data url
            reader.onload = (event) => {
                console.log(event)
                this.imageUrl = event.target['result'];
            }
        }
        else if (event.target.files[0].size >= 5242880) {
            this.toastr.error(this.translationService.get_instant('SIZE_LARGER_5MB_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
        }
        else {
            this.toastr.error(this.translationService.get_instant('VALID_FILE_ERROR'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
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
                    this.fetchRecommendedIssues()

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
            //
            //NgZone because map click is outside of AngularScope
            //
            this.zone.run(() => {
                this.displayIssuesOnMap(ev.latlng.lat, ev.latlng.lng);


                // this.issuesService.get_issue_address(ev.latlng.lat, ev.latlng.lng)
                //     .subscribe(
                //         data =>
                //         {
                //             if (data.results.length > 0) {
                //                 this.issueReportForm.patchValue({address:data.results[0].formatted_address})
                //             }
                //         },
                //         error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                // )
            });
        })
    }

    //
    //  --- END OF STEP 1 - ISSUE REPORT ---
    //

    //
    //  STEP 2 - EPONYMOUS REPORT
    //

    step3_disabled:boolean = true;
    issueCityPolicy:object;
    smsChecked = false;
    emailChecked = false;
    fetchCityPolicies() {
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
                
            }
        )
    }
    //
    //  --- END OF STEP 3 - RECOMMENDED ISSUE ---
    //

    //
    //  STEP 4 - CERTIFICATION
    //

    //
    //  --- END OF STEP 4 - CERTIFICATION ---
    //

    //
    //  STEP 5 - SUBMIT ISSUE
    //

    //
    //  --- END OF STEP 5 - SUBMIT ISSUE ---
    //





    // ngDoCheck() {
    //     console.log('change')
    //     // this.changeDetection.markForCheck()
    // }
    displayForm(form) {
        console.log(form)
        console.log(form.value)
        // console.log(this.imageUrl)
        console.log(this.cityPolicy)
        console.log(this.issueCityPolicy)
    }



}
