import { attribute } from '../core/AttributeNode.js';
import { cameraViewMatrix } from './Camera.js';
import { modelNormalMatrix, modelWorldMatrix } from './ModelNode.js';
import { mat3, vec3 } from '../tsl/TSLBase.js';
import { positionView } from './Position.js';
import { Fn, varying } from '../tsl/TSLBase.js';
import { faceDirection } from '../display/FrontFacingNode.js';

export const normalGeometry = attribute( 'normal', 'vec3' );

export const normalLocal = ( Fn( ( builder ) => {

	if ( builder.geometry.hasAttribute( 'normal' ) === false ) {

		console.warn( 'TSL.NormalNode: Vertex attribute "normal" not found on geometry.' );

		return vec3( 0, 1, 0 );

	}

	return normalGeometry;

}, 'vec3' ).once() )().toVar( 'normalLocal' );

export const normalFlat = positionView.dFdx().cross( positionView.dFdy() ).normalize().toVar( 'normalFlat' );

export const normalView = ( Fn( ( builder ) => {

	let node;

	if ( builder.material.flatShading === true ) {

		node = normalFlat;

	} else {

		node = varying( transformNormalToView( normalLocal ), 'v_normalView' ).normalize();

	}

	return node;

}, 'vec3' ).once() )().toVar( 'normalView' );

export const normalWorld = varying( normalView.transformDirection( cameraViewMatrix ), 'v_normalWorld' ).normalize().toVar( 'normalWorld' );

export const transformedNormalView = ( Fn( ( builder ) => {

	return builder.context.setupNormal();

}, 'vec3' ).once() )().mul( faceDirection ).toVar( 'transformedNormalView' );


export const transformedNormalWorld = transformedNormalView.transformDirection( cameraViewMatrix ).toVar( 'transformedNormalWorld' );

export const transformedClearcoatNormalView = ( Fn( ( builder ) => {

	return builder.context.setupClearcoatNormal();

}, 'vec3' ).once() )().mul( faceDirection ).toVar( 'transformedClearcoatNormalView' );

export const transformNormal = Fn( ( [ normal, matrix = modelWorldMatrix ] ) => {

	const m = mat3( matrix );

	const transformedNormal = normal.div( vec3( m[ 0 ].dot( m[ 0 ] ), m[ 1 ].dot( m[ 1 ] ), m[ 2 ].dot( m[ 2 ] ) ) );

	return m.mul( transformedNormal ).xyz;

} );

export const transformNormalToView = Fn( ( [ normal ], builder ) => {

	const modelNormalViewMatrix = builder.renderer.nodes.modelNormalViewMatrix;

	if ( modelNormalViewMatrix !== null ) {

		return modelNormalViewMatrix.transformDirection( normal );

	}

	//

	const transformedNormal = modelNormalMatrix.mul( normal );

	return cameraViewMatrix.transformDirection( transformedNormal );

} );
