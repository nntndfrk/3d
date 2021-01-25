// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export let Floor = function(scene, room) {

    const scope = this;

    this.room = room;
    // let scene = scene;

    let floorPlane = null;
    const roofPlane = null;

    init();

    function init() {
        scope.room.fireOnFloorChange(redraw);
        floorPlane = buildFloor();
        // roofs look weird, so commented out
        // roofPlane = buildRoof();
    }

    function redraw() {
        scope.removeFromScene();
        floorPlane = buildFloor();
        scope.addToScene();
    }

    function buildFloor() {
        const textureSettings = scope.room.getTexture();
        // setup texture
        const floorTexture = THREE.ImageUtils.loadTexture(textureSettings.url);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        const floorMaterialTop = new THREE.MeshPhongMaterial({
            map: floorTexture,
            side: THREE.DoubleSide,
            // ambient: 0xffffff, TODO_Ekki
            color: 0xcccccc,
            specular: 0x0a0a0a
        });

        const textureScale = textureSettings.scale;
        // http://stackoverflow.com/questions/19182298/how-to-texture-a-three-js-mesh-created-with-shapegeometry
        // scale down coords to fit 0 -> 1, then rescale

        const points = [];
        scope.room.interiorCorners.forEach((corner) => {
            points.push(new THREE.Vector2(
                corner.x / textureScale,
                corner.y / textureScale));
        });
        const shape = new THREE.Shape(points);

        const geometry = new THREE.ShapeGeometry(shape);

        const floor = new THREE.Mesh(geometry, floorMaterialTop);

        floor.rotation.set(Math.PI / 2, 0, 0);
        floor.scale.set(textureScale, textureScale, textureScale);
        floor.receiveShadow = true;
        floor.castShadow = false;
        return floor;
    }

    function buildRoof() {
        // setup texture
        const roofMaterial = new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            color: 0xe5e5e5
        });

        const points = [];
        scope.room.interiorCorners.forEach((corner) => {
            points.push(new THREE.Vector2(
                corner.x,
                corner.y));
        });
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const roof = new THREE.Mesh(geometry, roofMaterial);

        roof.rotation.set(Math.PI / 2, 0, 0);
        roof.position.y = 250;
        return roof;
    }

    this.addToScene = () => {
        scene.add(floorPlane);
        // scene.add(roofPlane);
        // hack so we can do intersect testing
        scene.add(room.floorPlane);
    };

    this.removeFromScene = () => {
        scene.remove(floorPlane);
        // scene.remove(roofPlane);
        scene.remove(room.floorPlane);
    };
};
