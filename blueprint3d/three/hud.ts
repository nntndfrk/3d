// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export let HUD = function(three) {
    const scope = this;
    // const three = three;
    const scene = new THREE.Scene();

    let selectedItem = null;

    let rotating = false;
    let mouseover = false;

    const tolerance = 10;
    const height = 5;
    const distance = 20;
    const color = '#ffffff';
    const hoverColor = '#f1c40f';

    let activeObject = null;

    this.getScene = () => {
        return scene;
    };

    this.getObject = () => {
        return activeObject;
    };

    function init() {
        three.itemSelectedCallbacks.add(itemSelected);
        three.itemUnselectedCallbacks.add(itemUnselected);
    }

    function resetSelectedItem() {
        selectedItem = null;
        if (activeObject) {
            scene.remove(activeObject);
            activeObject = null;
        }
    }

    function itemSelected(item) {
        if (selectedItem !== item) {
            resetSelectedItem();
            if (item.allowRotate && !item.fixed) {
                selectedItem = item;
                activeObject = makeObject(selectedItem);
                scene.add(activeObject);
            }
        }
    }

    function itemUnselected() {
        resetSelectedItem();
    }

    this.setRotating = (isRotating) => {
        rotating = isRotating;
        setColor();
    };

    this.setMouseover = (isMousedOver) => {
        mouseover = isMousedOver;
        setColor();
    };

    function setColor() {
        if (activeObject) {
            activeObject.children.forEach((obj) => {
                obj.material.color.set(getColor());
            });
        }
        three.needsUpdate();
    }

    function getColor() {
        return (mouseover || rotating) ? hoverColor : color;
    }

    this.update = () => {
        if (activeObject) {
            activeObject.rotation.y = selectedItem.rotation.y;
            activeObject.position.x = selectedItem.position.x;
            activeObject.position.z = selectedItem.position.z;
        }
    };

    function makeLineGeometry(item) {
        const geometry = new THREE.Geometry();

        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            rotateVector(item)
        );

        return geometry;
    }

    function rotateVector(item) {
        const vec = new THREE.Vector3(0, 0,
            Math.max(item.halfSize.x, item.halfSize.z) + 1.4 + distance);
        return vec;
    }

    // tslint:disable-next-line:no-shadowed-variable
    function makeLineMaterial(rotating) {
        const mat = new THREE.LineBasicMaterial({
            color: getColor(),
            linewidth: 3
        });
        return mat;
    }

    function makeCone(item) {
        const coneGeo = new THREE.CylinderGeometry(5, 0, 10);
        const coneMat = new THREE.MeshBasicMaterial({
            color: getColor()
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.copy(rotateVector(item));

        cone.rotation.x = -Math.PI / 2.0;

        return cone;
    }

    function makeSphere(item) {
        const geometry = new THREE.SphereGeometry(4, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: getColor()
        });
        const sphere = new THREE.Mesh(geometry, material);
        return sphere;
    }

    function makeObject(item) {
        const object = new THREE.Object3D();
        const line = new THREE.Line(
            makeLineGeometry(item),
            makeLineMaterial(scope.rotating),
            THREE.LinePieces);

        const cone = makeCone(item);
        const sphere = makeSphere(item);

        object.add(line);
        object.add(cone);
        object.add(sphere);

        object.rotation.y = item.rotation.y;
        object.position.x = item.position.x;
        object.position.z = item.position.z;
        object.position.y = height;

        return object;
    }

    init();
};
