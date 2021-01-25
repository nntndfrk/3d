/** Default texture to be used if nothing is provided. */
// import {THREE} from '../../lib_types/three';
import {Corner} from './corner';
import {Utils} from '../core/utils';
import {HalfEdge} from './half_edge';
import {Floorplan} from './floorplan';
import $ from 'jquery';
import * as THREE from 'three';

const defaultRoomTexture = {
    url: '/assets/rooms/textures/hardwood.png',
    scale: 400
};

/**
 * A Room is the combination of a Floorplan with a floor plane.
 */
export class Room {

    /** */
    public interiorCorners: Corner[] = [];

    /** */
    private edgePointer = null;

    /** floor plane for intersection testing */
    public floorPlane: THREE.Mesh = null;

    /** */
    private customTexture = false;

    /** */
    private floorChangeCallbacks = $.Callbacks();

    /**
     *  ordered CCW
     */
    constructor(private floorplan: Floorplan, public corners: Corner[]) {
        this.updateWalls();
        this.updateInteriorCorners();
        this.generatePlane();
    }

    private getUuid(): string {
        const cornerUuids = Utils.map(this.corners, (c) => {
            return c.id;
        });
        cornerUuids.sort();
        return cornerUuids.join();
    }

    public fireOnFloorChange(callback) {
        this.floorChangeCallbacks.add(callback);
    }

    private getTexture() {
        const uuid = this.getUuid();
        const tex = this.floorplan.getFloorTexture(uuid);
        return tex || defaultRoomTexture;
    }

    /**
     * textureStretch always true, just an argument for consistency with walls
     */
    private setTexture(textureUrl: string, textureStretch, textureScale: number) {
        const uuid = this.getUuid();
        this.floorplan.setFloorTexture(uuid, textureUrl, textureScale);
        this.floorChangeCallbacks.fire();
    }

    private generatePlane() {
        const points = [];
        this.interiorCorners.forEach((corner) => {
            points.push(new THREE.Vector2(
                corner.x,
                corner.y));
        });
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        this.floorPlane = new THREE.Mesh(geometry,
            new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide
            }));
        this.floorPlane.visible = false;
        this.floorPlane.rotation.set(Math.PI / 2, 0, 0);
        (this.floorPlane as any).room = this; // js monkey patch
    }

    private cycleIndex(index) {
        if (index < 0) {
            return index += this.corners.length;
        } else {
            return index % this.corners.length;
        }
    }

    private updateInteriorCorners() {
        let edge = this.edgePointer;
        while (true) {
            this.interiorCorners.push(edge.interiorStart());
            edge.generatePlane();
            if (edge.next === this.edgePointer) {
                break;
            } else {
                edge = edge.next;
            }
        }
    }

    /**
     * Populates each wall's half edge relating to this room
     * this creates a fancy doubly connected edge list (DCEL)
     */
    private updateWalls() {

        let prevEdge = null;
        let firstEdge = null;

        for (let i = 0; i < this.corners.length; i++) {

            const firstCorner = this.corners[i];
            const secondCorner = this.corners[(i + 1) % this.corners.length];

            // find if wall is heading in that direction
            const wallTo = firstCorner.wallTo(secondCorner);
            const wallFrom = firstCorner.wallFrom(secondCorner);

            let edge;
            if (wallTo) {
                edge = new HalfEdge(this, wallTo, true);
            } else if (wallFrom) {
                edge = new HalfEdge(this, wallFrom, false);
            } else {
                // something horrible has happened
                console.log('corners arent connected by a wall, uh oh');
            }

            if (i === 0) {
                firstEdge = edge;
            } else {
                edge.prev = prevEdge;
                prevEdge.next = edge;
                if (i + 1 === this.corners.length) {
                    if (firstEdge !== null) {
                        firstEdge.prev = edge;
                    }
                    edge.next = firstEdge;
                }
            }
            prevEdge = edge;
        }

        // hold on to an edge reference
        this.edgePointer = firstEdge;
    }
}
