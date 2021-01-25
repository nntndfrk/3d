import {AfterContentChecked, AfterViewInit, Component, OnInit} from '@angular/core';
import {Blueprint3d} from '../../../blueprint3d/blueprint3d';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
    private blueprint3d: Blueprint3d;

    ngAfterViewInit() {
        const opts = {
            floorplannerElement: 'floorplanner-canvas',
            threeElement: '#viewer',
            threeCanvasElement: 'three-canvas',
            textureDir: 'models/textures/',
            widget: false
        };

        this.blueprint3d = new Blueprint3d(opts);
        this.blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"assets/rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }
}
