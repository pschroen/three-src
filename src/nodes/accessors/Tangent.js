import { attribute } from '../core/AttributeNode.js';
import { cameraViewMatrix } from './Camera.js';
import { modelViewMatrix } from './ModelNode.js';
import { Fn, vec4 } from '../tsl/TSLBase.js';

export const tangentGeometry = Fn( ( builder ) => {

	if ( builder.geometry.hasAttribute( 'tangent' ) === false ) {

		builder.geometry.computeTangents();

	}

	return attribute( 'tangent', 'vec4' );

} )();

export const tangentLocal = tangentGeometry.xyz.toVar( 'tangentLocal' );
export const tangentView = modelViewMatrix.mul( vec4( tangentLocal, 0 ) ).xyz.varying( 'v_tangentView' ).normalize().toVar( 'tangentView' );
export const tangentWorld = tangentView.transformDirection( cameraViewMatrix ).varying( 'v_tangentWorld' ).normalize().toVar( 'tangentWorld' );
export const transformedTangentView = tangentView.toVar( 'transformedTangentView' );
export const transformedTangentWorld = transformedTangentView.transformDirection( cameraViewMatrix ).normalize().toVar( 'transformedTangentWorld' );
