import * as THREE from 'three'

export const carStore = {
  position: new THREE.Vector3(0, 0.35, 0),
  rotation: 0,
  velocity: new THREE.Vector3(),
  teleportTo: null as THREE.Vector3 | null,
}
