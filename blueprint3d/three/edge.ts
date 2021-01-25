import {Utils} from '../core/utils';
// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export let Edge = function(scene, edge, controls) {
    const scope = this;
    // const scene = scene;
    // const edge = edge;
    // const controls = controls;
    const wall = edge.wall;
    const front = edge.front;

    let planes = [];
    let basePlanes = []; // always visible
    let texture = null;

    const lightMap = THREE.ImageUtils.loadTexture('/assets/rooms/textures/walllightmap.png');
    const fillerColor = 0xdddddd;
    const sideColor = 0xcccccc;
    const baseColor = 0xdddddd;

    this.visible = false;

    this.remove = () => {
        edge.redrawCallbacks.remove(redraw);
        controls.cameraMovedCallbacks.remove(updateVisibility);
        removeFromScene();
    };

    function init() {
        edge.redrawCallbacks.add(redraw);
        controls.cameraMovedCallbacks.add(updateVisibility);
        updateTexture();
        updatePlanes();
        addToScene();
    }

    function redraw() {
        removeFromScene();
        updateTexture();
        updatePlanes();
        addToScene();
    }

    function removeFromScene() {
        planes.forEach((plane) => {
            scene.remove(plane);
        });
        basePlanes.forEach((plane) => {
            scene.remove(plane);
        });
        planes = [];
        basePlanes = [];
    }

    function addToScene() {
        planes.forEach((plane) => {
            scene.add(plane);
        });
        basePlanes.forEach((plane) => {
            scene.add(plane);
        });
        updateVisibility();
    }

    function updateVisibility() {
        // finds the normal from the specified edge
        const start = edge.interiorStart();
        const end = edge.interiorEnd();
        const x = end.x - start.x;
        const y = end.y - start.y;
        // rotate 90 degrees CCW
        const normal = new THREE.Vector3(-y, 0, x);
        normal.normalize();

        // setup camera
        const position = controls.object.position.clone();
        const focus = new THREE.Vector3(
            (start.x + end.x) / 2.0,
            0,
            (start.y + end.y) / 2.0);
        const direction = position.sub(focus).normalize();

        // find dot
        const dot = normal.dot(direction);

        // update visible
        scope.visible = (dot >= 0);

        // show or hide plans
        planes.forEach((plane) => {
            plane.visible = scope.visible;
        });

        updateObjectVisibility();
    }

    function updateObjectVisibility() {
        wall.items.forEach((item) => {
            item.updateEdgeVisibility(scope.visible, front);
        });
        wall.onItems.forEach((item) => {
            item.updateEdgeVisibility(scope.visible, front);
        });
    }

    function updateTexture(callback?) {
        // callback is fired when texture loads
        // tslint:disable-next-line:only-arrow-functions
        callback = callback || function() {
            scene.needsUpdate = true;
        };
        const textureData = edge.getTexture();
        const stretch = textureData.stretch;
        const url = textureData.url;
        const scale = textureData.scale;
        texture = THREE.ImageUtils.loadTexture(url, null, callback);
        if (!stretch) {
            const height = wall.height;
            const width = edge.interiorDistance();
            texture.wrapT = THREE.RepeatWrapping;
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.set(width / scale, height / scale);
            texture.needsUpdate = true;
        }
    }

    function updatePlanes() {
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            // ambientColor: 0xffffff, TODO_Ekki
            // ambient: scope.wall.color,
            side: THREE.FrontSide,
            map: texture,
            // lightMap: lightMap TODO_Ekki
        });

        const fillerMaterial = new THREE.MeshBasicMaterial({
            color: fillerColor,
            side: THREE.DoubleSide
        });

        // exterior plane
        planes.push(makeWall(
            edge.exteriorStart(),
            edge.exteriorEnd(),
            edge.exteriorTransform,
            edge.invExteriorTransform,
            fillerMaterial));

        // interior plane
        planes.push(makeWall(
            edge.interiorStart(),
            edge.interiorEnd(),
            edge.interiorTransform,
            edge.invInteriorTransform,
            wallMaterial));

        // bottom
        // put into basePlanes since this is always visible
        basePlanes.push(buildFiller(
            edge, 0,
            THREE.BackSide, baseColor));

        // top
        planes.push(buildFiller(
            edge, wall.height,
            THREE.DoubleSide, fillerColor));

        // sides
        planes.push(buildSideFillter(
            edge.interiorStart(), edge.exteriorStart(),
            wall.height, sideColor));

        planes.push(buildSideFillter(
            edge.interiorEnd(), edge.exteriorEnd(),
            wall.height, sideColor));
    }

    // start, end have x and y attributes (i.e. corners)
    function makeWall(start, end, transform, invTransform, material) {
        const v1 = toVec3(start);
        const v2 = toVec3(end);
        const v3 = v2.clone();
        v3.y = wall.height;
        const v4 = v1.clone();
        v4.y = wall.height;

        const points = [v1.clone(), v2.clone(), v3.clone(), v4.clone()];

        points.forEach((p) => {
            p.applyMatrix4(transform);
        });

        const shape = new THREE.Shape([
            new THREE.Vector2(points[0].x, points[0].y),
            new THREE.Vector2(points[1].x, points[1].y),
            new THREE.Vector2(points[2].x, points[2].y),
            new THREE.Vector2(points[3].x, points[3].y)
        ]);

        // add holes for each wall item
        wall.items.forEach((item) => {
            const pos = item.position.clone();
            pos.applyMatrix4(transform);
            const halfSize = item.halfSize;
            const min = halfSize.clone().multiplyScalar(-1);
            const max = halfSize.clone();
            min.add(pos);
            max.add(pos);

            const holePoints = [
                new THREE.Vector2(min.x, min.y),
                new THREE.Vector2(max.x, min.y),
                new THREE.Vector2(max.x, max.y),
                new THREE.Vector2(min.x, max.y)
            ];

            shape.holes.push(new THREE.Path(holePoints));
        });

        const geometry = new THREE.ShapeGeometry(shape);

        geometry.vertices.forEach((v) => {
            v.applyMatrix4(invTransform);
        });

        // make UVs
        const totalDistance = Utils.distance(v1.x, v1.z, v2.x, v2.z);
        const height = wall.height;
        geometry.faceVertexUvs[0] = [];

        function vertexToUv(vertex) {
            const x = Utils.distance(v1.x, v1.z, vertex.x, vertex.z) / totalDistance;
            const y = vertex.y / height;
            return new THREE.Vector2(x, y);
        }

        geometry.faces.forEach((face) => {
            const vertA = geometry.vertices[face.a];
            const vertB = geometry.vertices[face.b];
            const vertC = geometry.vertices[face.c];
            geometry.faceVertexUvs[0].push([
                vertexToUv(vertA),
                vertexToUv(vertB),
                vertexToUv(vertC)]);
        });

        geometry.faceVertexUvs[1] = geometry.faceVertexUvs[0];

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return new THREE.Mesh(
            geometry,
            material);
    }

    function buildSideFillter(p1, p2, height, color) {
        const points = [
            toVec3(p1),
            toVec3(p2),
            toVec3(p2, height),
            toVec3(p1, height)
        ];

        const geometry = new THREE.Geometry();
        points.forEach((p) => {
            geometry.vertices.push(p);
        });
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        geometry.faces.push(new THREE.Face3(0, 2, 3));

        const fillerMaterial = new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide
        });

        const filler = new THREE.Mesh(geometry, fillerMaterial);
        return filler;
    }

    // tslint:disable-next-line:no-shadowed-variable
    function buildFiller(edge, height, side, color) {
        const points = [
            toVec2(edge.exteriorStart()),
            toVec2(edge.exteriorEnd()),
            toVec2(edge.interiorEnd()),
            toVec2(edge.interiorStart())
        ];

        const fillerMaterial = new THREE.MeshBasicMaterial({
            color,
            side
        });

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);

        const filler = new THREE.Mesh(geometry, fillerMaterial);
        filler.rotation.set(Math.PI / 2, 0, 0);
        filler.position.y = height;
        return filler;
    }

    function toVec2(pos) {
        return new THREE.Vector2(pos.x, pos.y);
    }

    function toVec3(pos, height?) {
        height = height || 0;
        return new THREE.Vector3(pos.x, height, pos.y);
    }

    init();
};
