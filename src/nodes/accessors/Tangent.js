import { attribute } from '../core/AttributeNode.js';
import { cameraViewMatrix } from './Camera.js';
import { modelViewMatrix } from './ModelNode.js';
import { Fn, vec4 } from '../tsl/TSLBase.js';

/** @module Tangent **/

/**
 * TSL object that represents the tangent attribute of the current rendered object.
 *
 * @type {Node<vec4>}
 */
export const tangentGeometry = Fn( ( builder ) => {

	if ( builder.geometry.hasAttribute( 'tangent' ) === false ) {

		builder.geometry.computeTangents();

	}

	return attribute( 'tangent', 'vec4' );

} )();

/**
 * TSL object that represents the vertex tangent in local space of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const tangentLocal = tangentGeometry.xyz.toVar( 'tangentLocal' );

/**
 * TSL object that represents the vertex tangent in view space of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const tangentView = modelViewMatrix.mul( vec4( tangentLocal, 0 ) ).xyz.varying( 'v_tangentView' ).normalize().toVar( 'tangentView' );

/**
 * TSL object that represents the vertex tangent in world space of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const tangentWorld = tangentView.transformDirection( cameraViewMatrix ).varying( 'v_tangentWorld' ).normalize().toVar( 'tangentWorld' );

/**
 * TSL object that represents the transformed vertex tangent in view space of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const transformedTangentView = tangentView.toVar( 'transformedTangentView' );

/**
 * TSL object that represents the transformed vertex tangent in world space of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const transformedTangentWorld = transformedTangentView.transformDirection( cameraViewMatrix ).normalize().toVar( 'transformedTangentWorld' );
