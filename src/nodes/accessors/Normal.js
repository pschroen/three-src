import { attribute } from '../core/AttributeNode.js';
import { cameraViewMatrix } from './Camera.js';
import { modelNormalMatrix, modelWorldMatrix } from './ModelNode.js';
import { mat3, vec3, Fn, varying } from '../tsl/TSLBase.js';
import { positionView } from './Position.js';
import { faceDirection } from '../display/FrontFacingNode.js';

/**
 * TSL object that represents the normal attribute of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const normalGeometry = attribute( 'normal', 'vec3' );

/**
 * TSL object that represents the vertex normal in local space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const normalLocal = ( Fn( ( builder ) => {

	if ( builder.geometry.hasAttribute( 'normal' ) === false ) {

		console.warn( 'THREE.TSL: Vertex attribute "normal" not found on geometry.' );

		return vec3( 0, 1, 0 );

	}

	return normalGeometry;

}, 'vec3' ).once() )().toVar( 'normalLocal' );

/**
 * TSL object that represents the flat vertex normal in view space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const normalFlat = positionView.dFdx().cross( positionView.dFdy() ).normalize().toVar( 'normalFlat' );

/**
 * TSL object that represents the vertex normal in view space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const normalView = ( Fn( ( builder ) => {

	let node;

	if ( builder.material.flatShading === true ) {

		node = normalFlat;

	} else {

		node = varying( transformNormalToView( normalLocal ), 'v_normalView' ).normalize();

	}

	return node;

}, 'vec3' ).once() )().toVar( 'normalView' );

/**
 * TSL object that represents the vertex normal in world space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const normalWorld = ( Fn( ( builder ) => {

	let normal = normalView.transformDirection( cameraViewMatrix );

	if ( builder.material.flatShading !== true ) {

		normal = varying( normal, 'v_normalWorld' );

	}

	return normal;

}, 'vec3' ).once() )().normalize().toVar( 'normalWorld' );

/**
 * TSL object that represents the transformed vertex normal in view space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const transformedNormalView = ( Fn( ( builder ) => {

	// Use getUV context to avoid side effects from nodes overwriting getUV in the context (e.g. EnvironmentNode)

	let node = builder.context.setupNormal().context( { getUV: null } );

	if ( builder.material.flatShading !== true ) node = node.mul( faceDirection );

	return node;

}, 'vec3' ).once() )().toVar( 'transformedNormalView' );

/**
 * TSL object that represents the transformed vertex normal in world space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const transformedNormalWorld = transformedNormalView.transformDirection( cameraViewMatrix ).toVar( 'transformedNormalWorld' );

/**
 * TSL object that represents the transformed clearcoat vertex normal in view space of the current rendered object.
 *
 * @tsl
 * @type {Node<vec3>}
 */
export const transformedClearcoatNormalView = ( Fn( ( builder ) => {

	// Use getUV context to avoid side effects from nodes overwriting getUV in the context (e.g. EnvironmentNode)

	let node = builder.context.setupClearcoatNormal().context( { getUV: null } );

	if ( builder.material.flatShading !== true ) node = node.mul( faceDirection );

	return node;

}, 'vec3' ).once() )().toVar( 'transformedClearcoatNormalView' );

/**
 * Transforms the normal with the given matrix.
 *
 * @tsl
 * @function
 * @param {Node<vec3>} normal - The normal.
 * @param {Node<mat3>} [matrix=modelWorldMatrix] - The matrix.
 * @return {Node<vec3>} The transformed normal.
 */
export const transformNormal = Fn( ( [ normal, matrix = modelWorldMatrix ] ) => {

	const m = mat3( matrix );

	const transformedNormal = normal.div( vec3( m[ 0 ].dot( m[ 0 ] ), m[ 1 ].dot( m[ 1 ] ), m[ 2 ].dot( m[ 2 ] ) ) );

	return m.mul( transformedNormal ).xyz;

} );

/**
 * Transforms the given normal from local to view space.
 *
 * @tsl
 * @function
 * @param {Node<vec3>} normal - The normal.
 * @param {NodeBuilder} builder - The current node builder.
 * @return {Node<vec3>} The transformed normal.
 */
export const transformNormalToView = Fn( ( [ normal ], builder ) => {

	const modelNormalViewMatrix = builder.renderer.overrideNodes.modelNormalViewMatrix;

	if ( modelNormalViewMatrix !== null ) {

		return modelNormalViewMatrix.transformDirection( normal );

	}

	//

	const transformedNormal = modelNormalMatrix.mul( normal );

	return cameraViewMatrix.transformDirection( transformedNormal );

} );
