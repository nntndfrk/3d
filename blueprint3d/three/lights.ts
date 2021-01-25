// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export let Lights = function(scene, floorplan) {

    const scope = this;
    // const scene = scene;
    // const floorplan = floorplan;

    const tol = 1;
    const height = 300; // TODO: share with Blueprint.Wall

    let dirLight;

    this.getDirLight = () => {
        return dirLight;
    };

    function init() {
        const light = new THREE.HemisphereLight(0xffffff, 0x888888, 1.1);
        light.position.set(0, height, 0);
        scene.add(light);

        dirLight = new THREE.DirectionalLight(0xffffff, 0);
        dirLight.color.setHSL(1, 1, 0.1);

        dirLight.castShadow = true;

        dirLight.shadowMapWidth = 1024;
        dirLight.shadowMapHeight = 1024;

        dirLight.shadowCameraFar = height + tol;
        dirLight.shadowBias = -0.0001;
        dirLight.shadowDarkness = 0.2;
        dirLight.visible = true;
        dirLight.shadowCameraVisible = false;

        scene.add(dirLight);
        scene.add(dirLight.target);

        floorplan.fireOnUpdatedRooms(updateShadowCamera);
    }

    function updateShadowCamera() {

        const size = floorplan.getSize();
        const d = (Math.max(size.z, size.x) + tol) / 2.0;

        const center = floorplan.getCenter();
        const pos = new THREE.Vector3(
            center.x, height, center.z);
        dirLight.position.copy(pos);
        dirLight.target.position.copy(center);
        // dirLight.updateMatrix();
        // dirLight.updateWorldMatrix()
        dirLight.shadowCameraLeft = -d;
        dirLight.shadowCameraRight = d;
        dirLight.shadowCameraTop = d;
        dirLight.shadowCameraBottom = -d;
        // this is necessary for updates
        if (dirLight.shadowCamera) {
            dirLight.shadowCamera.left = dirLight.shadowCameraLeft;
            dirLight.shadowCamera.right = dirLight.shadowCameraRight;
            dirLight.shadowCamera.top = dirLight.shadowCameraTop;
            dirLight.shadowCamera.bottom = dirLight.shadowCameraBottom;
            dirLight.shadowCamera.updateProjectionMatrix();
        }
    }

    init();
};
