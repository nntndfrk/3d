// import {THREE} from '../../lib_types/three';
import {Skybox} from './skybox';
import {Controls} from './controls';
import {HUD} from './hud';
import {Controller} from './controller';
import {Floorplan} from './floorplan';
import {Lights} from './lights';
import $ from 'jquery';
import * as THREE from 'three';

export let Main = function(model, element, canvasElement, opts) {
    const scope = this;

    const options = {
        resize: true,
        pushHref: false,
        spin: true,
        spinSpeed: .00002,
        clickPan: true,
        canMoveFixedItems: false
    };

    // override with manually set options
    for (const opt in options) {
        if (options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
            options[opt] = opts[opt];
        }
    }

    const scene = model.scene;

    // const model = model;
    this.element = $(element);
    let domElement;

    let camera;
    let renderer;
    this.controls = null;
    // let canvas;
    let controller;
    let floorplan;

    // var canvas;
    // var canvasElement = canvasElement;

    let needsUpdate = false;

    let lastRender = Date.now();
    let mouseOver = false;
    let hasClicked = false;

    let hud;

    this.heightMargin = null;
    this.widthMargin = null;
    this.elementHeight = null;
    this.elementWidth = null;

    this.itemSelectedCallbacks = $.Callbacks(); // item
    this.itemUnselectedCallbacks = $.Callbacks();

    this.wallClicked = $.Callbacks(); // wall
    this.floorClicked = $.Callbacks(); // floor
    this.nothingClicked = $.Callbacks();

    function init() {
        THREE.ImageUtils.crossOrigin = '';

        domElement = scope.element.get(0); // Container
        camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true // required to support .toDataURL()
        });
        renderer.autoClear = false;
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;

        const skybox = new Skybox(scene);

        scope.controls = new Controls(camera, domElement);

        hud = new HUD(scope);

        controller = new Controller(
            scope, model, camera, scope.element, scope.controls, hud);

        domElement.appendChild(renderer.domElement);

        // handle window resizing
        scope.updateWindowSize();
        if (options.resize) {
            $(window).resize(scope.updateWindowSize);
        }

        // setup camera nicely
        scope.centerCamera();
        model.floorplan.fireOnUpdatedRooms(scope.centerCamera);

        const lights = new Lights(scene, model.floorplan);

        floorplan = new Floorplan(scene,
            model.floorplan, scope.controls);

        animate();

        scope.element.mouseenter(() => {
            mouseOver = true;
        }).mouseleave(() => {
            mouseOver = false;
        }).click(() => {
            hasClicked = true;
        });

        // canvas = new ThreeCanvas(canvasElement, scope);
    }

    function spin() {
        if (options.spin && !mouseOver && !hasClicked) {
            const theta = 2 * Math.PI * options.spinSpeed * (Date.now() - lastRender);
            scope.controls.rotateLeft(theta);
            scope.controls.update();
        }
    }

    this.dataUrl = () => {
        return renderer.domElement.toDataURL('image/png');
    };

    this.stopSpin = () => {
        hasClicked = true;
    };

    this.options = () => {
        return options;
    };

    this.getModel = () => {
        return model;
    };

    this.getScene = () => {
        return scene;
    };

    this.getController = () => {
        return controller;
    };

    this.getCamera = () => {
        return camera;
    };

    this.needsUpdate = () => {
        needsUpdate = true;

    };
    function shouldRender() {
        // Do we need to draw a new frame
        if (scope.controls.needsUpdate || controller.needsUpdate || needsUpdate || model.scene.needsUpdate) {
            scope.controls.needsUpdate = false;
            controller.needsUpdate = false;
            needsUpdate = false;
            model.scene.needsUpdate = false;
            return true;
        } else {
            return false;
        }
    }

    function render() {
        spin();
        if (shouldRender()) {
            renderer.clear();
            renderer.render(scene.getScene(), camera);
            renderer.clearDepth();
            renderer.render(hud.getScene(), camera);
        }
        lastRender = Date.now();
    }

    function animate() {
        const delay = 50;
        setTimeout(() => {
            requestAnimationFrame(animate);
        }, delay);
        render();
    }

    this.rotatePressed = () => {
        controller.rotatePressed();
    };

    this.rotateReleased = () => {
        controller.rotateReleased();
    };

    this.setCursorStyle = (cursorStyle) => {
        domElement.style.cursor = cursorStyle;
    };

    this.updateWindowSize = () => {
        scope.heightMargin = scope.element.offset().top;
        scope.widthMargin = scope.element.offset().left;

        scope.elementWidth = scope.element.innerWidth();
        if (options.resize) {
            scope.elementHeight = window.innerHeight - scope.heightMargin;
        } else {
            scope.elementHeight = scope.element.innerHeight();
        }

        camera.aspect = scope.elementWidth / scope.elementHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(scope.elementWidth, scope.elementHeight);
        needsUpdate = true;
    };

    this.centerCamera = () => {
        const yOffset = 150.0;

        const pan = model.floorplan.getCenter();
        pan.y = yOffset;

        scope.controls.target = pan;

        const distance = model.floorplan.getSize().z * 1.5;

        const offset = pan.clone().add(
            new THREE.Vector3(0, distance, distance));
        // scope.controls.setOffset(offset);
        camera.position.copy(offset);

        scope.controls.update();
    };

    // projects the object's center point into x,y screen coords
    // x,y are relative to top left corner of viewer
    this.projectVector = (vec3, ignoreMargin) => {
        ignoreMargin = ignoreMargin || false;

        const widthHalf = scope.elementWidth / 2;
        const heightHalf = scope.elementHeight / 2;

        const vector = new THREE.Vector3();
        vector.copy(vec3);
        vector.project(camera);

        const vec2 = new THREE.Vector2();

        vec2.x = (vector.x * widthHalf) + widthHalf;
        vec2.y = - (vector.y * heightHalf) + heightHalf;

        if (!ignoreMargin) {
            vec2.x += scope.widthMargin;
            vec2.y += scope.heightMargin;
        }

        return vec2;
    };

    init();
};
