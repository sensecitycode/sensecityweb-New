import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { tileLayer, latLng, marker, icon, LeafletMouseEvent, Polygon, polygon, geoJSON, GeoJSON, point } from 'leaflet';

import { Map } from 'leaflet';
import { TranslationService } from '../shared/translation.service';
import { IssuesService } from '../shared/issues.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-boundaries',
    templateUrl: './boundaries.component.html',
    styleUrls: ['./boundaries.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class BoundariesComponent implements OnInit {

    constructor(private http: HttpClient, private translationService:TranslationService, private issueService: IssuesService, private toastr: ToastrService) { }

    mapInit:object;
    boundaryLayer = [];
    geoJSON:GeoJSON;

    geojsonFeature:any = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "id": "Multipolygon",
            "properties": {"name": "Multipolygon"},
            "geometry": {"type": "", "coordinates": ""}
        }]
    }

    ngOnInit() {
        this.mapInit = {
            layers: [
                tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>' })
            ],
            zoom: 6,
            center: latLng(38.074208 , 22.824312)
        };
        this.issueService.fetch_city_boundaries()
            .subscribe(
                data => {
                    this.geojsonFeature.features[0].geometry = {"type": data[0].boundaries.type, "coordinates": data[0].boundaries.coordinates};

                    this.geoJSON = geoJSON(this.geojsonFeature);

                    this.boundaryLayer = [
                        this.geoJSON
                    ];
                },
                error => {
                    this.toastr.error(this.translationService.get_instant('SERVICES_ERROR_MSG'), this.translationService.get_instant('ERROR'), {timeOut:8000, progressBar:true, enableHtml:true})
                },
                () => {}
            );
        }

    onMapReady(map: Map){
        map.on ('layeradd', (ev:LeafletMouseEvent) => {
            map.fitBounds(this.geoJSON.getBounds(), {
                padding: point(24, 24),
                maxZoom: 12,
                animate: true
            });
        });
    }

}
