// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export let Skybox = function(scene) {

    const scope = this;

    // const scene = scene;

    const topColor = 0xffffff; // 0xD8ECF9
    const bottomColor = 0xe9e9e9; // 0xf9f9f9;//0x565e63
    const verticalOffset = 500;
    const sphereRadius = 4000;
    const widthSegments = 32;
    const heightSegments = 15;

    const vertexShader = [
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        '  vWorldPosition = worldPosition.xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
    ].join('\n');

    const fragmentShader = [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform float offset;',
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  float h = normalize( vWorldPosition + offset ).y;',
        '  gl_FragColor = vec4( mix( bottomColor, topColor, (h + 1.0) / 2.0), 1.0 );',
        '}'
    ].join('\n');

    function init() {

        const uniforms = {
            topColor: {
                type: 'c',
                value: new THREE.Color(topColor)
            },
            bottomColor: {
                type: 'c',
                value: new THREE.Color(bottomColor)
            },
            offset: {
                type: 'f',
                value: verticalOffset
            }
        };

        const skyGeo = new THREE.SphereGeometry(
            sphereRadius, widthSegments, heightSegments);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(sky);
    }

    init();
};
