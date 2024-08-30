import { dot, mix } from '../math/MathNode.js';
import { add } from '../math/OperatorNode.js';
import { Fn, float, vec3 } from '../tsl/TSLBase.js';
import { ColorManagement } from '../../math/ColorManagement.js';
import { Vector3 } from '../../math/Vector3.js';

export const grayscale = Fn( ( [ color ] ) => {

	return luminance( color.rgb );

} );

export const saturation = Fn( ( [ color, adjustment = float( 1 ) ] ) => {

	return adjustment.mix( luminance( color.rgb ), color.rgb );

} );

export const vibrance = Fn( ( [ color, adjustment = float( 1 ) ] ) => {

	const average = add( color.r, color.g, color.b ).div( 3.0 );

	const mx = color.r.max( color.g.max( color.b ) );
	const amt = mx.sub( average ).mul( adjustment ).mul( - 3.0 );

	return mix( color.rgb, mx, amt );

} );

export const hue = Fn( ( [ color, adjustment = float( 1 ) ] ) => {

	const k = vec3( 0.57735, 0.57735, 0.57735 );

	const cosAngle = adjustment.cos();

	return vec3( color.rgb.mul( cosAngle ).add( k.cross( color.rgb ).mul( adjustment.sin() ).add( k.mul( dot( k, color.rgb ).mul( cosAngle.oneMinus() ) ) ) ) );

} );

const _luminanceCoefficients = new Vector3();
export const luminance = (
	color,
	luminanceCoefficients = vec3( ... ColorManagement.getLuminanceCoefficients( _luminanceCoefficients ) )
) => dot( color, luminanceCoefficients );

export const threshold = ( color, threshold ) => mix( vec3( 0.0 ), color, luminance( color ).sub( threshold ).max( 0 ) );
