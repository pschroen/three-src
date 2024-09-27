import { uniform } from '../core/UniformNode.js';
import { renderGroup } from '../core/UniformGroupNode.js';
import { Vector3 } from '../../math/Vector3.js';

export const cameraNear = uniform( 'float' ).label( 'cameraNear' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.near );
export const cameraFar = uniform( 'float' ).label( 'cameraFar' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.far );
export const cameraLogDepth = uniform( 'float' ).label( 'cameraLogDepth' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => 2.0 / ( Math.log( camera.far + 1.0 ) / Math.LN2 ) );
export const cameraProjectionMatrix = uniform( 'mat4' ).label( 'cameraProjectionMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.projectionMatrix );
export const cameraProjectionMatrixInverse = uniform( 'mat4' ).label( 'cameraProjectionMatrixInverse' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.projectionMatrixInverse );
export const cameraViewMatrix = uniform( 'mat4' ).label( 'cameraViewMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.matrixWorldInverse );
export const cameraWorldMatrix = uniform( 'mat4' ).label( 'cameraWorldMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.matrixWorld );
export const cameraNormalMatrix = uniform( 'mat3' ).label( 'cameraNormalMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.normalMatrix );
export const cameraPosition = uniform( new Vector3() ).label( 'cameraPosition' ).setGroup( renderGroup ).onRenderUpdate( ( { camera }, self ) => self.value.setFromMatrixPosition( camera.matrixWorld ) );
