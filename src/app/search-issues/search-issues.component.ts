import { Component, OnInit, ViewEncapsulation, OnDestroy, ComponentFactoryResolver, ComponentRef, Injector, ApplicationRef, NgZone  } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DateAdapter } from '@angular/material/core';
import { ObservableMedia } from '@angular/flex-layout';

import { ToastrService } from 'ngx-toastr';

import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';

import * as L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
import * as UntypedL from 'leaflet/dist/leaflet-src'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers';

import * as moment from 'moment';

import { MAT_DATE_FORMATS } from '@angular/material/core';
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

import { PopupComponent } from '../shared/popup/popup.component'

@Component({
    selector: 'app-search-issues',
    templateUrl: './search-issues.component.html',
    styleUrls: ['./search-issues.component.css'],
    encapsulation: ViewEncapsulation.Emulated,
    providers: [{provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}]
})
export class SearchIssuesComponent implements OnInit {

    constructor(
        private translationService: TranslationService,
        private issuesService: IssuesService,
        private toastr: ToastrService,
        private dateAdapter: DateAdapter<any>,
        public observableMedia: ObservableMedia,
        private resolver: ComponentFactoryResolver,
        private injector: Injector,
        private appRef: ApplicationRef,
        private zone: NgZone) { }

    compRef: ComponentRef<PopupComponent>;
    mapInit: {};

    mapLayers = [];
    layersControl = {};


    searchForm: FormGroup
    issue_types = [
        {type: "garbage", icon: "fa-trash-o", markers:"garbage_markers"},
        {type: "lighting", icon: "fa-lightbulb-o", markers:"lighting_markers"},
        {type: "plumbing", icon: "fa-umbrella", markers:"plumbing_markers"},
        {type: "road-constructor", icon: "fa-road" ,markers:"road_markers"},
        {type: "protection-policy", icon: "fa-shield", markers:"protection_markers"},
        {type: "green", icon: "fa-tree", markers:"green_markers"},
        {type: "environment", icon: "fa-leaf", markers:"environment_markers"}
    ]

    status_types = [
        {type: "CONFIRMED", icon: "fa-exclamation-circle", translateVar:"CONFIRMED_PLURAL"},
        {type: "IN_PROGRESS", icon: "fa-question-circle", translateVar:"IN_PROGRESS"},
        {type: "RESOLVED", icon: "fa-check-circle", translateVar:"RESOLVED_PLURAL"},
        {type: "ANONYMOUS", icon: "fa-user-circle-o", translateVar:"ANONYMOUS"}
    ]

    feelings_types = [
        {type: "happy", icon: "fa-smile-o"},
        {type: "neutral", icon: "fa-meh-o"},
        {type: "angry", icon: "fa-frown-o"}
    ]

    startDate = moment(new Date()).subtract(3, 'days')
    endDate = moment(new Date())



    subscription = new Subscription()
    ngOnInit() {
        let openStreetMaps = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })
        // let garbageLayer = L.layerGroup()
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

        // console.log(this.startDate)
        // console.log(this.startDate.toISOString())
        // console.log(this.endDate)
        // console.log(this.endDate.toISOString())

        this.searchForm = new FormGroup({
            issue: new FormControl(this.issue_types),
            status: new FormControl([this.status_types[0], this.status_types[1]]),
            feelings: new FormControl([]),
            startDate: new FormControl(this.startDate),
            endDate: new FormControl(this.endDate),
            bugId: new FormControl('')
        })

        this.subscription.add(
            this.translationService.languageChanged.subscribe(
                lang => {
                    // console.log(lang)
                    this.dateAdapter.setLocale(lang)
                }
            )
        )
    }

    markersObject = {
        garbage_markers : [],
        lighting_markers : [],
        plumbing_markers : [],
        road_markers : [],
        protection_markers : [],
        green_markers : [],
        environment_markers : [],
        feelings_markers: []
    }
    totalSearchIssues = 0
    submitSearch() {
        this.markersObject = {
            garbage_markers : [],
            lighting_markers : [],
            plumbing_markers : [],
            road_markers : [],
            protection_markers : [],
            green_markers : [],
            environment_markers : [],
            feelings_markers: []
        }
        this.totalSearchIssues = 0
        this.mapLayers = []
        this.layersControl['overlays'] = {}

        console.log(this.searchForm.value)
        let _startdate = this.searchForm.get('startDate').value.format("YYYY-MM-DD")
        let _enddate = this.searchForm.get('endDate').value.format("YYYY-MM-DD")
        let searchObj = {
            startdate: _startdate,
            enddate: _enddate
        }
        let feelingsObj = {}


        if (this.searchForm.get('bugId').value) {
            let issueSearchResult = [];
            this.issuesService.search_issue({'bug_id': this.searchForm.get('bugId').value})
            .subscribe(
                data => {console.log(data); issueSearchResult = data},
                error => { this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR') )},
                () => {
                    if (issueSearchResult.length > 0) {
                        let icon = this.issuesService.get_issue_icon(issueSearchResult[0].issue)
                        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                            icon: icon,
                            markerColor: 'red',
                            prefix: 'fa',
                        })
                        let issueMarker = new L.Marker([issueSearchResult[0].loc.coordinates[1],issueSearchResult[0].loc.coordinates[0]], {icon: AwesomeMarker, alt:issueSearchResult[0]._id}).bindPopup(null);
                        this.mapLayers.push(issueMarker)

                        issueMarker.on('click', ev => {
                            this.createMarkerPopup (issueMarker, ev)
                        })

                    }
                }
            )

        } else {

            if (this.searchForm.get('status').value.length > 0) {
                let statuses_array = this.searchForm.get('status').value.map( obj => {return obj['type']} )
                if (statuses_array.includes("ANONYMOUS")) {
                    searchObj['includeAnonymous'] = 1
                    statuses_array.pop()
                }

                if (statuses_array.length > 0) {
                    searchObj['status'] = statuses_array.join("|")
                }
            }

            if (this.searchForm.get('feelings').value.length > 0) {
                console.log("GET FEELING")
                feelingsObj = {
                    feeling: this.searchForm.get('feelings').value.map( obj => {return obj['type']} ).join("|"),
                    startdate: _startdate,
                    enddate: _enddate
                }
                let searchFeelingsResult = []
                this.issuesService.fetch_feelings(_enddate, _startdate, this.searchForm.get('feelings').value.map( obj => {return obj['type']} ).join("|"))
                .subscribe(
                    data => {console.log(data); searchFeelingsResult = data},
                    error => { this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR') )},
                    () => {
                        searchFeelingsResult.forEach((element) => {
                            let marker = this.issuesService.get_feeling_marker(element.issue)
                            let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                                icon: marker.icon,
                                markerColor: marker.color,
                                iconColor: '#333',
                                prefix: 'fa',
                            });

                            let issueMarker = new L.Marker([element.loc.coordinates[1],element.loc.coordinates[0]], {icon: AwesomeMarker, alt:element.issue})

                            this.markersObject['feelings_markers'].push(issueMarker)
                        })
                        console.log(this.markersObject['feelings_markers'])

                        if (searchFeelingsResult.length > 0) {
                            this.layersControl['overlays'][this.translationService.get_instant('CITIZEN_MOOD')] = L.layerGroup(this.markersObject['feelings_markers'])

                            this.mapLayers.push(this.layersControl['overlays'][this.translationService.get_instant('CITIZEN_MOOD')])
                            console.log(this.layersControl)
                            this.totalSearchIssues += searchFeelingsResult.length

                        }

                    }
                )
            }

            this.searchForm.get('issue').value.forEach( searchItem => {
                // console.log(item)
                searchObj['issue'] = searchItem.type
                let icon = searchItem.icon
                let markerName = searchItem.markers
                let type = searchItem.type
                // console.log(searchObj)
                let searchIssueResults = []
                this.issuesService.search_issue(searchObj)
                .subscribe(
                    data => {console.log(data); searchIssueResults = data},
                    error => { this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR') )},
                    () => {

                        searchIssueResults.forEach((element) => {
                            let AwesomeMarker;
                            console.log(icon)
                            if (element.status != "RESOLVED") {
                                AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                                    icon: icon,
                                    markerColor: 'red',
                                    prefix: 'fa',
                                })
                            } else {
                                AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                                    icon: icon,
                                    markerColor: 'green',
                                    prefix: 'fa',
                                })
                            }

                            let issueMarker = new L.Marker([element.loc.coordinates[1],element.loc.coordinates[0]], {icon: AwesomeMarker, alt:element._id}).bindPopup(null);;

                            this.markersObject[markerName].push(issueMarker)

                            issueMarker.on('click', ev => {
                                this.createMarkerPopup (issueMarker, ev)
                            })
                        })
                        if (searchIssueResults.length > 0) {
                            this.layersControl['overlays'][this.translationService.get_instant(type.toUpperCase())] = L.layerGroup(this.markersObject[markerName])

                            this.mapLayers.push(this.layersControl['overlays'][this.translationService.get_instant(type.toUpperCase())])
                            console.log(this.layersControl['overlays'])
                            this.totalSearchIssues += searchIssueResults.length
                        }
                    }

                )




            })

            console.log(this.markersObject)

        }

        // console.log(searchObj)
        // console.log(feelingsObj)
    }

    createMarkerPopup (issueMarker, ev) {
        if (issueMarker.isPopupOpen() == true) {
            this.zone.run( () => {
                console.log(ev)
                console.log(issueMarker)

                if(this.compRef) this.compRef.destroy();

                const compFactory = this.resolver.resolveComponentFactory(PopupComponent);
                this.compRef = compFactory.create(this.injector);

                this.compRef.instance.issueId = ev.target.options.alt;
                const subscription = this.compRef.instance.fullIssueFetched.subscribe(
                    data => {
                        if (data) {
                            setTimeout(()=> {issueMarker.getPopup().update()}, 1)
                        }
                    }
                )

                let div = document.createElement('div');
                div.appendChild(this.compRef.location.nativeElement);
                issueMarker.setPopupContent(div);

                this.appRef.attachView(this.compRef.hostView);
                this.compRef.onDestroy(() => {
                    this.appRef.detachView(this.compRef.hostView);
                    subscription.unsubscribe();
                });
            })
        }
    }

    onMapReady(map: L.Map) {
        console.log("map ready")
    }

    ngOnDestroy() {
        this.subscription.unsubscribe()
    }
}
