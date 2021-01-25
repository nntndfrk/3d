import {FloorItem} from './floor_item';
import {Model} from '../model/model';
import {Metadata} from './metadata';
// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export abstract class OnFloorItem extends FloorItem {
    protected constructor(model: Model, metadata: Metadata,
                          geometry: THREE.Geometry, material: THREE.MeshFaceMaterial,
                          position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
        super(model, metadata, geometry, material, position, rotation, scale);
        this.obstructFloorMoves = false;
        this.receiveShadow = true;
    }
}
