import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';

import { EnvSpecific } from './models/env-specific';
import { EnvironmentSpecificService } from './environment-specific-service';

@Injectable()
export class EnvironmentSpecificResolver implements Resolve<EnvSpecific> {
    constructor(private envSpecificSvc: EnvironmentSpecificService, private router: Router) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<EnvSpecific> {
        return this.envSpecificSvc.loadEnvironment()
        .then(es => {
            this.envSpecificSvc.setEnvSpecific(es);
            return this.envSpecificSvc.envSpecific;
        }, error => {
            console.log(error);
            return null;
        });
    }
}
