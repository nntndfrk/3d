/* tslint:disable:variable-name prefer-for-of forin triple-equals */
/** */
import {Wall} from './wall';
import {Corner} from './corner';
import {Room} from './room';
import {HalfEdge} from './half_edge';
// import {THREE} from '../../lib_types/three';
import {Utils} from '../core/utils';
import * as THREE from 'three';
import $ from 'jquery';

const defaultFloorPlanTolerance = 10.0;

/**
 * A Floorplan represents a number of Walls, Corners and Rooms.
 */
export class Floorplan {

    /** */
    private walls: Wall[] = [];

    /** */
    private corners: Corner[] = [];

    /** */
    private rooms: Room[] = [];

    /** */
    private new_wall_callbacks = $.Callbacks();

    /** */
    private new_corner_callbacks = $.Callbacks();

    /** */
    private redraw_callbacks = $.Callbacks();

    /** */
    private updated_rooms = $.Callbacks();

    /** */
    public roomLoadedCallbacks = $.Callbacks();

    /**
     * Floor textures are owned by the floorplan, because room objects are
     * destroyed and created each time we change the floorplan.
     * floorTextures is a map of room UUIDs (string) to a object with
     * url and scale attributes.
     */
    private floorTextures = {};

    /** Constructs a floorplan. */
    constructor() {
    }

    // hack
    public wallEdges(): HalfEdge[] {
        const edges = [];

        this.walls.forEach((wall) => {
            if (wall.frontEdge) {
                edges.push(wall.frontEdge);
            }
            if (wall.backEdge) {
                edges.push(wall.backEdge);
            }
        });
        return edges;
    }

    // hack
    public wallEdgePlanes(): THREE.Mesh[] {
        const planes = [];
        this.walls.forEach((wall) => {
            if (wall.frontEdge) {
                planes.push(wall.frontEdge.plane);
            }
            if (wall.backEdge) {
                planes.push(wall.backEdge.plane);
            }
        });
        return planes;
    }

    private floorPlanes(): THREE.Mesh[] {
        return Utils.map(this.rooms, (room: Room) => {
            return room.floorPlane;
        });
    }

    public fireOnNewWall(callback) {
        this.new_wall_callbacks.add(callback);
    }

    public fireOnNewCorner(callback) {
        this.new_corner_callbacks.add(callback);
    }

    public fireOnRedraw(callback) {
        this.redraw_callbacks.add(callback);
    }

    public fireOnUpdatedRooms(callback) {
        this.updated_rooms.add(callback);
    }

    /**
     * Creates a new wall.
     * @param start The start corner.
     * @param end he end corner.
     * @returns The new wall.
     */
    public newWall(start: Corner, end: Corner): Wall {
        const wall = new Wall(start, end);
        this.walls.push(wall);
        const scope = this;
        wall.fireOnDelete(() => {
            scope.removeWall(wall);
        });
        this.new_wall_callbacks.fire(wall);
        this.update();
        return wall;
    }

    /** Removes a wall.
     * @param wall The wall to be removed.
     */
    private removeWall(wall: Wall) {
        Utils.removeValue(this.walls, wall);
        this.update();
    }

    /**
     * Creates a new corner.
     * @param x The x coordinate.
     * @param y The y coordinate.
     * @param id An optional id. If unspecified, the id will be created internally.
     * @returns The new corner.
     */
    public newCorner(x: number, y: number, id?: string): Corner {
        const corner = new Corner(this, x, y, id);
        this.corners.push(corner);
        corner.fireOnDelete(() => {
            // tslint:disable-next-line:no-unused-expression
            this.removeCorner;
        });
        this.new_corner_callbacks.fire(corner);
        return corner;
    }

    /** Removes a corner.
     * @param corner The corner to be removed.
     */
    private removeCorner(corner: Corner) {
        Utils.removeValue(this.corners, corner);
    }

    /** Gets the walls. */
    public getWalls(): Wall[] {
        return this.walls;
    }

    /** Gets the corners. */
    public getCorners(): Corner[] {
        return this.corners;
    }

    /** Gets the rooms. */
    public getRooms(): Room[] {
        return this.rooms;
    }

    public overlappedCorner(x: number, y: number, tolerance?: number): Corner {
        tolerance = tolerance || defaultFloorPlanTolerance;
        for (let i = 0; i < this.corners.length; i++) {
            if (this.corners[i].distanceFrom(x, y) < tolerance) {
                return this.corners[i];
            }
        }
        return null;
    }

    public overlappedWall(x: number, y: number, tolerance?: number): Wall {
        tolerance = tolerance || defaultFloorPlanTolerance;
        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i].distanceFrom(x, y) < tolerance) {
                return this.walls[i];
            }
        }
        return null;
    }

    // import and export -- cleanup

    public saveFloorplan() {
        const floorplan = {
            corners: {},
            walls: [],
            wallTextures: [],
            floorTextures: {},
            newFloorTextures: {}
        };

        this.corners.forEach((corner) => {
            floorplan.corners[corner.id] = {
                x: corner.x,
                y: corner.y
            };
        });

        this.walls.forEach((wall) => {
            floorplan.walls.push({
                corner1: wall.getStart().id,
                corner2: wall.getEnd().id,
                frontTexture: wall.frontTexture,
                backTexture: wall.backTexture
            });
        });
        floorplan.newFloorTextures = this.floorTextures;
        return floorplan;
    }

    public loadFloorplan(floorplan) {
        this.reset();

        const corners = {};
        if (floorplan == null || !('corners' in floorplan) || !('walls' in floorplan)) {
            return;
        }
        for (const id in floorplan.corners) {
            const corner = floorplan.corners[id];
            corners[id] = this.newCorner(corner.x, corner.y, id);
        }
        const scope = this;
        floorplan.walls.forEach((wall) => {
            const newWall = scope.newWall(
                corners[wall.corner1], corners[wall.corner2]);
            if (wall.frontTexture) {
                newWall.frontTexture = wall.frontTexture;
            }
            if (wall.backTexture) {
                newWall.backTexture = wall.backTexture;
            }
        });

        if ('newFloorTextures' in floorplan) {
            this.floorTextures = floorplan.newFloorTextures;
        }

        this.update();
        this.roomLoadedCallbacks.fire();
    }

    public getFloorTexture(uuid: string) {
        if (uuid in this.floorTextures) {
            return this.floorTextures[uuid];
        } else {
            return null;
        }
    }

    public setFloorTexture(uuid: string, url: string, scale: number) {
        this.floorTextures[uuid] = {
            url,
            scale
        };
    }

    /** clear out obsolete floor textures */
    private updateFloorTextures() {
        const uuids = Utils.map(this.rooms, (room) => {
            return room.getUuid();
        });
        for (const uuid in this.floorTextures) {
            if (!Utils.hasValue(uuids, uuid)) {
                delete this.floorTextures[uuid];
            }
        }
    }

    /** */
    private reset() {
        const tmpCorners = this.corners.slice(0);
        const tmpWalls = this.walls.slice(0);
        tmpCorners.forEach((corner) => {
            corner.remove();
        });
        tmpWalls.forEach((wall) => {
            wall.remove();
        });
        this.corners = [];
        this.walls = [];
    }

    /**
     * Update rooms
     */
    public update() {
        this.walls.forEach((wall) => {
            wall.resetFrontBack();
        });

        const roomCorners = this.findRooms(this.corners);
        this.rooms = [];
        const scope = this;
        roomCorners.forEach((corners) => {
            scope.rooms.push(new Room(scope, corners));
        });
        this.assignOrphanEdges();

        this.updateFloorTextures();
        this.updated_rooms.fire();
    }

    /**
     * Returns the center of the floorplan in the y plane
     */
    public getCenter() {
        return this.getDimensions(true);
    }

    public getSize() {
        return this.getDimensions(false);
    }

    public getDimensions(center) {
        center = center || false; // otherwise, get size

        let xMin = Infinity;
        let xMax = -Infinity;
        let zMin = Infinity;
        let zMax = -Infinity;
        this.corners.forEach((corner) => {
            if (corner.x < xMin) { xMin = corner.x; }
            if (corner.x > xMax) { xMax = corner.x; }
            if (corner.y < zMin) { zMin = corner.y; }
            if (corner.y > zMax) { zMax = corner.y; }
        });
        let ret;
        if (xMin == Infinity || xMax == -Infinity || zMin == Infinity || zMax == -Infinity) {
            ret = new THREE.Vector3();
        } else {
            if (center) {
                // center
                ret = new THREE.Vector3((xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5);
            } else {
                // size
                ret = new THREE.Vector3((xMax - xMin), 0, (zMax - zMin));
            }
        }
        return ret;
    }

    private assignOrphanEdges() {
        // kinda hacky
        // find orphaned wall segments (i.e. not part of rooms) and
        // give them edges
        const orphanWalls = [];
        this.walls.forEach((wall) => {
            if (!wall.backEdge && !wall.frontEdge) {
                wall.orphan = true;
                const back = new HalfEdge(null, wall, false);
                back.generatePlane();
                const front = new HalfEdge(null, wall, true);
                front.generatePlane();
                orphanWalls.push(wall);
            }
        });

    }

    /*
     * Find the "rooms" in our planar straight-line graph.
     * Rooms are set of the smallest (by area) possible cycles in this graph.
     * @param corners The corners of the floorplan.
     * @returns The rooms, each room as an array of corners.
     */
    public findRooms(corners: Corner[]): Corner[][] {

        function _calculateTheta(previousCorner: Corner, currentCorner: Corner, nextCorner: Corner) {
            const theta = Utils.angle2pi(
                previousCorner.x - currentCorner.x,
                previousCorner.y - currentCorner.y,
                nextCorner.x - currentCorner.x,
                nextCorner.y - currentCorner.y);
            return theta;
        }

        function _removeDuplicateRooms(roomArray: Corner[][]): Corner[][] {
            const results: Corner[][] = [];
            const lookup = {};
            const hashFunc = (corner) => {
                return corner.id;
            };
            const sep = '-';
            let str: string;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < roomArray.length; i++) {
                // rooms are cycles, shift it around to check uniqueness
                let add = true;
                const room = roomArray[i];
                for (let j = 0; j < room.length; j++) {
                    const roomShift = Utils.cycle(room, j);
                    str = Utils.map(roomShift, hashFunc).join(sep);
                    if (lookup.hasOwnProperty(str)) {
                        add = false;
                    }
                }
                if (add) {
                    results.push(roomArray[i]);
                    lookup[str] = true;
                }
            }
            return results;
        }

        function _findTightestCycle(firstCorner: Corner, secondCorner: Corner): Corner[] {
            const stack: {
                corner: Corner,
                previousCorners: Corner[]
            }[] = [];

            let next = {
                corner: secondCorner,
                previousCorners: [firstCorner]
            };
            const visited = {};
            visited[firstCorner.id] = true;

            while (next) {
                // update previous corners, current corner, and visited corners
                const currentCorner = next.corner;
                visited[currentCorner.id] = true;

                // did we make it back to the startCorner?
                if (next.corner === firstCorner && currentCorner !== secondCorner) {
                    return next.previousCorners;
                }

                const addToStack: Corner[] = [];
                const adjacentCorners = next.corner.adjacentCorners();
                for (let i = 0; i < adjacentCorners.length; i++) {
                    const nextCorner = adjacentCorners[i];

                    // is this where we came from?
                    // give an exception if its the first corner and we aren't at the second corner
                    if (nextCorner.id in visited &&
                        !(nextCorner === firstCorner && currentCorner !== secondCorner)) {
                        continue;
                    }

                    // nope, throw it on the queue
                    addToStack.push(nextCorner);
                }

                const previousCorners = next.previousCorners.slice(0);
                previousCorners.push(currentCorner);
                if (addToStack.length > 1) {
                    // visit the ones with smallest theta first
                    const previousCorner = next.previousCorners[next.previousCorners.length - 1];
                    addToStack.sort((a, b) => {
                        return (_calculateTheta(previousCorner, currentCorner, b) -
                            _calculateTheta(previousCorner, currentCorner, a));
                    });
                }

                if (addToStack.length > 0) {
                    // add to the stack
                    addToStack.forEach((corner) => {
                        stack.push({
                            corner,
                            previousCorners
                        });
                    });
                }

                // pop off the next one
                next = stack.pop();
            }
            return [];
        }

        // find tightest loops, for each corner, for each adjacent
        // TODO: optimize this, only check corners with > 2 adjacents, or isolated cycles
        const loops: Corner[][] = [];

        corners.forEach((firstCorner) => {
            firstCorner.adjacentCorners().forEach((secondCorner) => {
                loops.push(_findTightestCycle(firstCorner, secondCorner));
            });
        });

        // remove duplicates
        const uniqueLoops = _removeDuplicateRooms(loops);
        // remove CW loops
        const uniqueCCWLoops = Utils.removeIf(uniqueLoops, Utils.isClockwise);

        return uniqueCCWLoops;
    }
}
