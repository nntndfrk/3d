import {WallItem} from './wall_item';
import {Model} from '../model/model';
import {Metadata} from './metadata';
// import {THREE} from '../../lib_types/three';
import * as THREE from 'three';

export abstract class WallFloorItem extends WallItem {
    protected constructor(model: Model, metadata: Metadata,
                          geometry: THREE.Geometry, material: THREE.MeshFaceMaterial,
                          position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
        super(model, metadata, geometry, material, position, rotation, scale);
        this.boundToFloor = true;
    }
}
