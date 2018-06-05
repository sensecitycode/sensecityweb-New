import { Component, OnInit, ViewEncapsulation, ComponentFactoryResolver, ComponentRef, Injector, ApplicationRef, NgZone } from '@angular/core';
import { PopupComponent } from '../shared/popup/popup.component'

import { ToastrService } from 'ngx-toastr';
import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';
import { NgProgress } from '@ngx-progressbar/core';
import { NguCarousel } from '@ngu/carousel';


import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.gridlayer.googlemutant';

import * as UntypedL from 'leaflet/dist/leaflet-src'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers';

import * as moment from 'moment';



@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class OverviewComponent implements OnInit {

    constructor(private translationService: TranslationService,
                private issuesService: IssuesService,
                private toastr: ToastrService,
                private resolver: ComponentFactoryResolver,
                private injector: Injector,
                private appRef: ApplicationRef,
                private zone: NgZone) { }

    compRef: ComponentRef<PopupComponent>;
    initial_language = this.translationService.getLanguage()

    last_months_params:any
    issuesLast7days = []
    feelingsLast7days = []
    allIssuesLastMonths = []
    openIssuesLastMonths = []
    solutionsLastMonths = []
    issuesLast6 = []
    carouselOne: NguCarousel
    brokenImages = [false, false, false, false, false, false];


    issue_types = [
        {type: "garbage", icon: "fa fa-trash-o", markers:"garbage_markers"},
        {type: "lighting", icon: "fa fa-lightbulb-o", markers:"lighting_markers"},
        {type: "plumbing", icon: "fa fa-umbrella", markers:"plumbing_markers"},
        {type: "road-constructor", icon: "fa fa-road" ,markers:"road_markers"},
        {type: "protection-policy", icon: "fa fa-shield", markers:"protection_markers"},
        {type: "green", icon: "fa fa-tree", markers:"green_markers"},
        {type: "environment", icon: "fa fa-leaf", markers:"environment_markers"}
    ]


    mapInit: {};
    markerClusterData: any[] = [];
    markerClusterOptions: L.MarkerClusterGroupOptions;
    markerClusterGroup: L.MarkerClusterGroup;

    mapLayers = [];
    layersControl = {};
    feelingsMarkers = [];
    issueZoom:number ;
    issueCenter: L.LatLng
    ngOnInit() {
        this.last_months_params = {months:'2'}
        let openStreetMaps = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })

        let googleRoadMap = UntypedL.gridLayer.googleMutant({
            type: 'roadmap', // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
            maxZoom: 18
        })
        googleRoadMap.addGoogleLayer('TrafficLayer');

        let googleHybrid = UntypedL.gridLayer.googleMutant({
            type: 'hybrid', // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
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

        this.carouselOne = {
            grid: {xs: 1, sm: 1, md: 1, lg: 1, all: 0},
            slide: 1,
            speed: 400,
            interval: 4000,
            point: {
                visible: true
            },
            load: 2,
            touch: true,
            loop: true,
            custom: 'banner'
        }

        let today = moment(new Date()).format("YYYY-MM-DD")
        // console.log(today)
        let sevenDaysAgo = moment(today).subtract(7, 'days').format("YYYY-MM-DD")
        let monthsAgo = moment(today).subtract(2, 'months').format("YYYY-MM-DD")
        // console.log(sevenDaysAgo)
        // console.log(monthsAgo)

        // console.log('fetch last 7 days')
        this.issuesService.fetch_issues(today, sevenDaysAgo, 'CONFIRMED|IN_PROGRESS')
            .subscribe(
                data => { this.issuesLast7days = data },
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
                () => {
                    let garbage_markers = []
                    let lighting_markers = []
                    let plumbing_markers = []
                    let road_markers = []
                    let protection_markers = []
                    let green_markers = []
                    let environment_markers = []

                    this.issuesLast7days.forEach((element) =>{
                        // console.log(element)
                        let icon = this.issuesService.get_issue_icon(element.issue)
                        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                            icon: icon,
                            markerColor: 'red',
                            prefix: 'fa',
                        })
                        let issueMarker = new L.Marker([element.loc.coordinates[1],element.loc.coordinates[0]], {icon: AwesomeMarker, alt:element._id}).bindPopup(null);;
                        switch (element.issue) {
                            case 'garbage':
                                // console.log('garbage');
                                garbage_markers.push(issueMarker)
                                break;
                            case 'lighting':
                                // console.log('lighting');
                                lighting_markers.push(issueMarker)
                                break;
                            case 'plumbing':
                                // console.log('plumbing');
                                plumbing_markers.push(issueMarker)
                                break;
                            case 'road-constructor':
                                // console.log('road-constructor');
                                road_markers.push(issueMarker)
                                break;
                            case 'protection-policy':
                                // console.log('protection-policy');
                                protection_markers.push(issueMarker)
                                break;
                            case 'green':
                                // console.log('green');
                                green_markers.push(issueMarker)
                                break;
                            case 'environment':
                                // console.log('environment');
                                environment_markers.push(issueMarker)
                        }
                        issueMarker.on('click', ev => {
                            this.createMarkerPopup (issueMarker, ev)
                        })
                    })

                    this.layersControl['overlays'] = {
                        [this.translationService.get_instant('GARBAGE')]: L.layerGroup(garbage_markers),
                        [this.translationService.get_instant('LIGHTING')]: L.layerGroup(lighting_markers),
                        [this.translationService.get_instant('ROAD-CONSTRUCTOR')]: L.layerGroup(road_markers),
                        [this.translationService.get_instant('PROTECTION-POLICY')]: L.layerGroup(protection_markers),
                        [this.translationService.get_instant('GREEN')]: L.layerGroup(green_markers),
                        [this.translationService.get_instant('ENVIRONMENT')]: L.layerGroup(environment_markers),
                        [this.translationService.get_instant('PLUMBING')]: L.layerGroup(plumbing_markers),
                    }
                    // this.mapLayers = [this.layersControl['overlays'][this.translationService.get_instant('GARBAGE')]]
                    for (let layer in this.layersControl['overlays']) {
                        this.mapLayers.push(this.layersControl['overlays'][layer])
                    }

                    this.layersControl['overlays'][this.translationService.get_instant('CITIZEN_MOOD')] = L.layerGroup(this.feelingsMarkers)


                }
                    // this.mapLayers = garbage_markers


            )

        // console.log('fetch months ago')
        this.issuesService.fetch_issues(today, monthsAgo, 'CONFIRMED|IN_PROGRESS|RESOLVED')
            .subscribe(
                data => { this.allIssuesLastMonths = data },
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
                () => {
                    this.allIssuesLastMonths.forEach((element) => {
                        element.status == "RESOLVED" ? this.solutionsLastMonths.push(element) : this.openIssuesLastMonths.push(element)
                    })
                }
            )

        // console.log('fetch last 6 issues')
        this.issuesService.fetch_last_6_issues()
            .subscribe(
                data => { this.issuesLast6 = data; console.log(data) },
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
                () => {
                    this.issuesLast6.forEach((element) => {
                        element.created_ago = moment(new Date(element.create_at)).locale(this.initial_language).fromNow()
                        element.icon = this.issuesService.get_issue_icon(element.issue)
                        element.image_URL = this.issuesService.API + "/image_issue?bug_id=" + element.bug_id + "&resolution=small"
                    })
                }
            )

        // console.log('fetch feelings last 7 days')
        this.issuesService.fetch_feelings(today, sevenDaysAgo, 'happy|neutral|angry')
            .subscribe(
                data => { this.feelingsLast7days = data },
                error => this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR')),
                () => {
                    this.feelingsMarkers = []
                    this.feelingsLast7days.forEach((element) =>{
                        // console.log(element)
                        let marker = this.issuesService.get_feeling_marker(element.issue)
                        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                            icon: marker.icon,
                            markerColor: marker.color,
                            iconColor: '#333',
                            prefix: 'fa',
                        });

                        let issueMarker = new L.Marker([element.loc.coordinates[1],element.loc.coordinates[0]], {icon: AwesomeMarker, alt:element.issue})
                        this.feelingsMarkers.push(issueMarker)
                    })
                    // console.log(this.feelingsMarkers)
                }
            )


    }

    onMapReady(map: L.Map){
        console.log("map ready")
        // console.log(map);
        map.scrollWheelZoom.disable()
        this.issuesService.fetch_fixed_points()
        .subscribe(
            data => {
                // console.log(data);
                let StaticGarbageMarkers:L.Layer[] = []
                let StaticLightingMarkers:L.Layer[] = []
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
                        StaticGarbageMarkers.push(TrashMarker);
                    }

                    if (FixPnt.type == 'fotistiko') {
                        let AwesomeMarker =  UntypedL.AwesomeMarkers.icon({
                            icon: 'fa-lightbulb-o',
                            markerColor: 'orange',
                            prefix: 'fa',
                            className: 'awesome-marker awesome-marker-square'
                        });
                        let LightMarker = new L.Marker([FixPnt.loc.coordinates[1],FixPnt.loc.coordinates[0]], {icon: AwesomeMarker})
                        StaticLightingMarkers.push(LightMarker);
                    }
                }

                // console.log(StaticGarbageMarkers)
                this.markerClusterData =  StaticLightingMarkers.concat(StaticGarbageMarkers);
                this.markerClusterOptions = {
                    disableClusteringAtZoom: 19,
                    animateAddingMarkers: false,
                    spiderfyDistanceMultiplier: 2,
                    singleMarkerMode: false,
                    showCoverageOnHover: true,
                    chunkedLoading: true
                }

                let overlayTitle = "<span class='fa fa-map-marker fa-2x'></span> " + this.translationService.get_instant('FIXED_POINTS');
                this.layersControl['overlays'][overlayTitle] = this.markerClusterGroup

                // console.log(this.layersControl)
                L.control.layers({}, this.layersControl['overlays']).addTo(map)



            },
            error => { this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR') )},
            () => {    }
        )
        // map.on ('layeradd', (ev:L.LeafletMouseEvent) => {console.log(ev)});
        // map.on ('click', (ev:L.LeafletMouseEvent) => {console.log(ev)});
    }


    markerClusterReady(group: L.MarkerClusterGroup) {
        this.markerClusterGroup = group;
    }

    carouselReady(event: Event) {
       console.log(event)
       console.log("carousel load")
    }

    imageLoadError(image_index) {
        this.brokenImages[image_index] = true;
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
}
