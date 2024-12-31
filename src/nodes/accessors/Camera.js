import { uniform } from '../core/UniformNode.js';
import { renderGroup } from '../core/UniformGroupNode.js';
import { Vector3 } from '../../math/Vector3.js';

/** @module Camera **/

/**
 * TSL object that represents the `near` value of the camera used for the current render.
 *
 * @type {UniformNode<float>}
 */
export const cameraNear = uniform( 'float' ).label( 'cameraNear' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.near );

/**
 * TSL object that represents the `far` value of the camera used for the current render.
 *
 * @type {UniformNode<float>}
 */
export const cameraFar = uniform( 'float' ).label( 'cameraFar' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.far );

/**
 * TSL object that represents the projection matrix of the camera used for the current render.
 *
 * @type {UniformNode<mat4>}
 */
export const cameraProjectionMatrix = uniform( 'mat4' ).label( 'cameraProjectionMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.projectionMatrix );

/**
 * TSL object that represents the inverse projection matrix of the camera used for the current render.
 *
 * @type {UniformNode<mat4>}
 */
export const cameraProjectionMatrixInverse = uniform( 'mat4' ).label( 'cameraProjectionMatrixInverse' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.projectionMatrixInverse );

/**
 * TSL object that represents the view matrix of the camera used for the current render.
 *
 * @type {UniformNode<mat4>}
 */
export const cameraViewMatrix = uniform( 'mat4' ).label( 'cameraViewMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.matrixWorldInverse );

/**
 * TSL object that represents the world matrix of the camera used for the current render.
 *
 * @type {UniformNode<mat4>}
 */
export const cameraWorldMatrix = uniform( 'mat4' ).label( 'cameraWorldMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.matrixWorld );

/**
 * TSL object that represents the normal matrix of the camera used for the current render.
 *
 * @type {UniformNode<mat3>}
 */
export const cameraNormalMatrix = uniform( 'mat3' ).label( 'cameraNormalMatrix' ).setGroup( renderGroup ).onRenderUpdate( ( { camera } ) => camera.normalMatrix );

/**
 * TSL object that represents the position in world space of the camera used for the current render.
 *
 * @type {UniformNode<vec3>}
 */
export const cameraPosition = uniform( new Vector3() ).label( 'cameraPosition' ).setGroup( renderGroup ).onRenderUpdate( ( { camera }, self ) => self.value.setFromMatrixPosition( camera.matrixWorld ) );
