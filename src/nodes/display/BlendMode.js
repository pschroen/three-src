import { Fn } from '../tsl/TSLBase.js';
import { mix, min, step } from '../math/MathNode.js';

export const burn = Fn( ( [ base, blend ] ) => {

	return min( 1.0, base.oneMinus().div( blend ) ).oneMinus();

} ).setLayout( {
	name: 'burnBlend',
	type: 'vec3',
	inputs: [
		{ name: 'base', type: 'vec3' },
		{ name: 'blend', type: 'vec3' }
	]
} );

export const dodge = Fn( ( [ base, blend ] ) => {

	return min( base.div( blend.oneMinus() ), 1.0 );

} ).setLayout( {
	name: 'dodgeBlend',
	type: 'vec3',
	inputs: [
		{ name: 'base', type: 'vec3' },
		{ name: 'blend', type: 'vec3' }
	]
} );

export const screen = Fn( ( [ base, blend ] ) => {

	return base.oneMinus().mul( blend.oneMinus() ).oneMinus();

} ).setLayout( {
	name: 'screenBlend',
	type: 'vec3',
	inputs: [
		{ name: 'base', type: 'vec3' },
		{ name: 'blend', type: 'vec3' }
	]
} );

export const overlay = Fn( ( [ base, blend ] ) => {

	return mix( base.mul( 2.0 ).mul( blend ), base.oneMinus().mul( 2.0 ).mul( blend.oneMinus() ).oneMinus(), step( 0.5, base ) );

} ).setLayout( {
	name: 'overlayBlend',
	type: 'vec3',
	inputs: [
		{ name: 'base', type: 'vec3' },
		{ name: 'blend', type: 'vec3' }
	]
} );
