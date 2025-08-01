import TempNode from '../core/TempNode.js';
import { sub, mul, div, mod, equal } from './OperatorNode.js';
import { addMethodChaining, nodeObject, nodeProxyIntent, float, vec2, vec3, vec4, Fn } from '../tsl/TSLCore.js';
import { WebGLCoordinateSystem, WebGPUCoordinateSystem } from '../../constants.js';

/**
 * This node represents a variety of mathematical methods available in shaders.
 * They are divided into three categories:
 *
 * - Methods with one input like `sin`, `cos` or `normalize`.
 * - Methods with two inputs like `dot`, `cross` or `pow`.
 * - Methods with three inputs like `mix`, `clamp` or `smoothstep`.
 *
 * @augments TempNode
 */
class MathNode extends TempNode {

	static get type() {

		return 'MathNode';

	}

	/**
	 * Constructs a new math node.
	 *
	 * @param {string} method - The method name.
	 * @param {Node} aNode - The first input.
	 * @param {?Node} [bNode=null] - The second input.
	 * @param {?Node} [cNode=null] - The third input.
	 */
	constructor( method, aNode, bNode = null, cNode = null ) {

		super();

		// Allow the max() and min() functions to take an arbitrary number of arguments.

		if ( ( method === MathNode.MAX || method === MathNode.MIN ) && arguments.length > 3 ) {

			let finalOp = new MathNode( method, aNode, bNode );

			for ( let i = 2; i < arguments.length - 1; i ++ ) {

				finalOp = new MathNode( method, finalOp, arguments[ i ] );

			}

			aNode = finalOp;
			bNode = arguments[ arguments.length - 1 ];
			cNode = null;

		}

		/**
		 * The method name.
		 *
		 * @type {string}
		 */
		this.method = method;

		/**
		 * The first input.
		 *
		 * @type {Node}
		 */
		this.aNode = aNode;

		/**
		 * The second input.
		 *
		 * @type {?Node}
		 * @default null
		 */
		this.bNode = bNode;

		/**
		 * The third input.
		 *
		 * @type {?Node}
		 * @default null
		 */
		this.cNode = cNode;

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMathNode = true;

	}

	/**
	 * The input type is inferred from the node types of the input nodes.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @return {string} The input type.
	 */
	getInputType( builder ) {

		const aType = this.aNode.getNodeType( builder );
		const bType = this.bNode ? this.bNode.getNodeType( builder ) : null;
		const cType = this.cNode ? this.cNode.getNodeType( builder ) : null;

		const aLen = builder.isMatrix( aType ) ? 0 : builder.getTypeLength( aType );
		const bLen = builder.isMatrix( bType ) ? 0 : builder.getTypeLength( bType );
		const cLen = builder.isMatrix( cType ) ? 0 : builder.getTypeLength( cType );

		if ( aLen > bLen && aLen > cLen ) {

			return aType;

		} else if ( bLen > cLen ) {

			return bType;

		} else if ( cLen > aLen ) {

			return cType;

		}

		return aType;

	}

	/**
	 * The selected method as well as the input type determine the node type of this node.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @return {string} The node type.
	 */
	getNodeType( builder ) {

		const method = this.method;

		if ( method === MathNode.LENGTH || method === MathNode.DISTANCE || method === MathNode.DOT ) {

			return 'float';

		} else if ( method === MathNode.CROSS ) {

			return 'vec3';

		} else if ( method === MathNode.ALL || method === MathNode.ANY ) {

			return 'bool';

		} else if ( method === MathNode.EQUALS ) {

			return builder.changeComponentType( this.aNode.getNodeType( builder ), 'bool' );

		} else {

			return this.getInputType( builder );

		}

	}

	setup( builder ) {

		const { aNode, bNode, method } = this;

		let outputNode = null;

		if ( method === MathNode.ONE_MINUS ) {

			outputNode = sub( 1.0, aNode );

		} else if ( method === MathNode.RECIPROCAL ) {

			outputNode = div( 1.0, aNode );

		} else if ( method === MathNode.DIFFERENCE ) {

			outputNode = abs( sub( aNode, bNode ) );

		} else if ( method === MathNode.TRANSFORM_DIRECTION ) {

			// dir can be either a direction vector or a normal vector
			// upper-left 3x3 of matrix is assumed to be orthogonal

			let tA = aNode;
			let tB = bNode;

			if ( builder.isMatrix( tA.getNodeType( builder ) ) ) {

				tB = vec4( vec3( tB ), 0.0 );

			} else {

				tA = vec4( vec3( tA ), 0.0 );

			}

			const mulNode = mul( tA, tB ).xyz;

			outputNode = normalize( mulNode );

		}

		if ( outputNode !== null ) {

			return outputNode;

		} else {

			return super.setup( builder );

		}

	}

	generate( builder, output ) {

		const properties = builder.getNodeProperties( this );

		if ( properties.outputNode ) {

			return super.generate( builder, output );

		}

		let method = this.method;

		const type = this.getNodeType( builder );
		const inputType = this.getInputType( builder );

		const a = this.aNode;
		const b = this.bNode;
		const c = this.cNode;

		const coordinateSystem = builder.renderer.coordinateSystem;

		if ( method === MathNode.NEGATE ) {

			return builder.format( '( - ' + a.build( builder, inputType ) + ' )', type, output );

		} else {

			const params = [];

			if ( method === MathNode.CROSS ) {

				params.push(
					a.build( builder, type ),
					b.build( builder, type )
				);

			} else if ( coordinateSystem === WebGLCoordinateSystem && method === MathNode.STEP ) {

				params.push(
					a.build( builder, builder.getTypeLength( a.getNodeType( builder ) ) === 1 ? 'float' : inputType ),
					b.build( builder, inputType )
				);

			} else if ( coordinateSystem === WebGLCoordinateSystem && ( method === MathNode.MIN || method === MathNode.MAX ) ) {

				params.push(
					a.build( builder, inputType ),
					b.build( builder, builder.getTypeLength( b.getNodeType( builder ) ) === 1 ? 'float' : inputType )
				);

			} else if ( method === MathNode.REFRACT ) {

				params.push(
					a.build( builder, inputType ),
					b.build( builder, inputType ),
					c.build( builder, 'float' )
				);

			} else if ( method === MathNode.MIX ) {

				params.push(
					a.build( builder, inputType ),
					b.build( builder, inputType ),
					c.build( builder, builder.getTypeLength( c.getNodeType( builder ) ) === 1 ? 'float' : inputType )
				);

			} else {

				if ( coordinateSystem === WebGPUCoordinateSystem && method === MathNode.ATAN && b !== null ) {

					method = 'atan2';

				}

				if ( builder.shaderStage !== 'fragment' && ( method === MathNode.DFDX || method === MathNode.DFDY ) ) {

					console.warn( `THREE.TSL: '${ method }' is not supported in the ${ builder.shaderStage } stage.` );

					method = '/*' + method + '*/';

				}

				params.push( a.build( builder, inputType ) );
				if ( b !== null ) params.push( b.build( builder, inputType ) );
				if ( c !== null ) params.push( c.build( builder, inputType ) );

			}

			return builder.format( `${ builder.getMethod( method, type ) }( ${params.join( ', ' )} )`, type, output );

		}

	}

	serialize( data ) {

		super.serialize( data );

		data.method = this.method;

	}

	deserialize( data ) {

		super.deserialize( data );

		this.method = data.method;

	}

}

// 1 input

MathNode.ALL = 'all';
MathNode.ANY = 'any';

MathNode.RADIANS = 'radians';
MathNode.DEGREES = 'degrees';
MathNode.EXP = 'exp';
MathNode.EXP2 = 'exp2';
MathNode.LOG = 'log';
MathNode.LOG2 = 'log2';
MathNode.SQRT = 'sqrt';
MathNode.INVERSE_SQRT = 'inversesqrt';
MathNode.FLOOR = 'floor';
MathNode.CEIL = 'ceil';
MathNode.NORMALIZE = 'normalize';
MathNode.FRACT = 'fract';
MathNode.SIN = 'sin';
MathNode.COS = 'cos';
MathNode.TAN = 'tan';
MathNode.ASIN = 'asin';
MathNode.ACOS = 'acos';
MathNode.ATAN = 'atan';
MathNode.ABS = 'abs';
MathNode.SIGN = 'sign';
MathNode.LENGTH = 'length';
MathNode.NEGATE = 'negate';
MathNode.ONE_MINUS = 'oneMinus';
MathNode.DFDX = 'dFdx';
MathNode.DFDY = 'dFdy';
MathNode.ROUND = 'round';
MathNode.RECIPROCAL = 'reciprocal';
MathNode.TRUNC = 'trunc';
MathNode.FWIDTH = 'fwidth';
MathNode.TRANSPOSE = 'transpose';
MathNode.DETERMINANT = 'determinant';
MathNode.INVERSE = 'inverse';

// 2 inputs

MathNode.BITCAST = 'bitcast';
MathNode.EQUALS = 'equals';
MathNode.MIN = 'min';
MathNode.MAX = 'max';
MathNode.STEP = 'step';
MathNode.REFLECT = 'reflect';
MathNode.DISTANCE = 'distance';
MathNode.DIFFERENCE = 'difference';
MathNode.DOT = 'dot';
MathNode.CROSS = 'cross';
MathNode.POW = 'pow';
MathNode.TRANSFORM_DIRECTION = 'transformDirection';

// 3 inputs

MathNode.MIX = 'mix';
MathNode.CLAMP = 'clamp';
MathNode.REFRACT = 'refract';
MathNode.SMOOTHSTEP = 'smoothstep';
MathNode.FACEFORWARD = 'faceforward';

export default MathNode;

// 1 inputs

/**
 * A small value used to handle floating-point precision errors.
 *
 * @tsl
 * @type {Node<float>}
 */
export const EPSILON = float( 1e-6 );

/**
 * Represents infinity.
 *
 * @tsl
 * @type {Node<float>}
 */
export const INFINITY = float( 1e6 );

/**
 * Represents PI.
 *
 * @tsl
 * @type {Node<float>}
 */
export const PI = float( Math.PI );

/**
 * Represents PI * 2.
 *
 * @tsl
 * @type {Node<float>}
 */
export const PI2 = float( Math.PI * 2 );

/**
 * Returns `true` if all components of `x` are `true`.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node<bool>}
 */
export const all = nodeProxyIntent( MathNode, MathNode.ALL ).setParameterLength( 1 );

/**
 * Returns `true` if any components of `x` are `true`.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node<bool>}
 */
export const any = nodeProxyIntent( MathNode, MathNode.ANY ).setParameterLength( 1 );

/**
 * Converts a quantity in degrees to radians.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The input in degrees.
 * @returns {Node}
 */
export const radians = nodeProxyIntent( MathNode, MathNode.RADIANS ).setParameterLength( 1 );

/**
 * Convert a quantity in radians to degrees.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The input in radians.
 * @returns {Node}
 */
export const degrees = nodeProxyIntent( MathNode, MathNode.DEGREES ).setParameterLength( 1 );

/**
 * Returns the natural exponentiation of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const exp = nodeProxyIntent( MathNode, MathNode.EXP ).setParameterLength( 1 );

/**
 * Returns 2 raised to the power of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const exp2 = nodeProxyIntent( MathNode, MathNode.EXP2 ).setParameterLength( 1 );

/**
 * Returns the natural logarithm of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const log = nodeProxyIntent( MathNode, MathNode.LOG ).setParameterLength( 1 );

/**
 * Returns the base 2 logarithm of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const log2 = nodeProxyIntent( MathNode, MathNode.LOG2 ).setParameterLength( 1 );

/**
 * Returns the square root of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const sqrt = nodeProxyIntent( MathNode, MathNode.SQRT ).setParameterLength( 1 );

/**
 * Returns the inverse of the square root of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const inverseSqrt = nodeProxyIntent( MathNode, MathNode.INVERSE_SQRT ).setParameterLength( 1 );

/**
 * Finds the nearest integer less than or equal to the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const floor = nodeProxyIntent( MathNode, MathNode.FLOOR ).setParameterLength( 1 );

/**
 * Finds the nearest integer that is greater than or equal to the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const ceil = nodeProxyIntent( MathNode, MathNode.CEIL ).setParameterLength( 1 );

/**
 * Calculates the unit vector in the same direction as the original vector.
 *
 * @tsl
 * @function
 * @param {Node} x - The input vector.
 * @returns {Node}
 */
export const normalize = nodeProxyIntent( MathNode, MathNode.NORMALIZE ).setParameterLength( 1 );

/**
 * Computes the fractional part of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const fract = nodeProxyIntent( MathNode, MathNode.FRACT ).setParameterLength( 1 );

/**
 * Returns the sine of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const sin = nodeProxyIntent( MathNode, MathNode.SIN ).setParameterLength( 1 );

/**
 * Returns the cosine of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const cos = nodeProxyIntent( MathNode, MathNode.COS ).setParameterLength( 1 );

/**
 * Returns the tangent of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const tan = nodeProxyIntent( MathNode, MathNode.TAN ).setParameterLength( 1 );

/**
 * Returns the arcsine of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const asin = nodeProxyIntent( MathNode, MathNode.ASIN ).setParameterLength( 1 );

/**
 * Returns the arccosine of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const acos = nodeProxyIntent( MathNode, MathNode.ACOS ).setParameterLength( 1 );

/**
 * Returns the arc-tangent of the parameter.
 * If two parameters are provided, the result is `atan2(y/x)`.
 *
 * @tsl
 * @function
 * @param {Node | number} y - The y parameter.
 * @param {?(Node | number)} x - The x parameter.
 * @returns {Node}
 */
export const atan = nodeProxyIntent( MathNode, MathNode.ATAN ).setParameterLength( 1, 2 );

/**
 * Returns the absolute value of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const abs = nodeProxyIntent( MathNode, MathNode.ABS ).setParameterLength( 1 );

/**
 * Extracts the sign of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const sign = nodeProxyIntent( MathNode, MathNode.SIGN ).setParameterLength( 1 );

/**
 * Calculates the length of a vector.
 *
 * @tsl
 * @function
 * @param {Node} x - The parameter.
 * @returns {Node<float>}
 */
export const length = nodeProxyIntent( MathNode, MathNode.LENGTH ).setParameterLength( 1 );

/**
 * Negates the value of the parameter (-x).
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const negate = nodeProxyIntent( MathNode, MathNode.NEGATE ).setParameterLength( 1 );

/**
 * Return `1` minus the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const oneMinus = nodeProxyIntent( MathNode, MathNode.ONE_MINUS ).setParameterLength( 1 );

/**
 * Returns the partial derivative of the parameter with respect to x.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const dFdx = nodeProxyIntent( MathNode, MathNode.DFDX ).setParameterLength( 1 );

/**
 * Returns the partial derivative of the parameter with respect to y.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const dFdy = nodeProxyIntent( MathNode, MathNode.DFDY ).setParameterLength( 1 );

/**
 * Rounds the parameter to the nearest integer.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const round = nodeProxyIntent( MathNode, MathNode.ROUND ).setParameterLength( 1 );

/**
 * Returns the reciprocal of the parameter `(1/x)`.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const reciprocal = nodeProxyIntent( MathNode, MathNode.RECIPROCAL ).setParameterLength( 1 );

/**
 * Truncates the parameter, removing the fractional part.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const trunc = nodeProxyIntent( MathNode, MathNode.TRUNC ).setParameterLength( 1 );

/**
 * Returns the sum of the absolute derivatives in x and y.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @returns {Node}
 */
export const fwidth = nodeProxyIntent( MathNode, MathNode.FWIDTH ).setParameterLength( 1 );

/**
 * Returns the transpose of a matrix.
 *
 * @tsl
 * @function
 * @param {Node<mat2|mat3|mat4>} x - The parameter.
 * @returns {Node}
 */
export const transpose = nodeProxyIntent( MathNode, MathNode.TRANSPOSE ).setParameterLength( 1 );

/**
 * Returns the determinant of a matrix.
 *
 * @tsl
 * @function
 * @param {Node<mat2|mat3|mat4>} x - The parameter.
 * @returns {Node<float>}
 */
export const determinant = nodeProxyIntent( MathNode, MathNode.DETERMINANT ).setParameterLength( 1 );

/**
 * Returns the inverse of a matrix.
 *
 * @tsl
 * @function
 * @param {Node<mat2|mat3|mat4>} x - The parameter.
 * @returns {Node<mat2|mat3|mat4>}
 */
export const inverse = nodeProxyIntent( MathNode, MathNode.INVERSE ).setParameterLength( 1 );

// 2 inputs

/**
 * Reinterpret the bit representation of a value in one type as a value in another type.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The parameter.
 * @param {string} y - The new type.
 * @returns {Node}
 */
export const bitcast = nodeProxyIntent( MathNode, MathNode.BITCAST ).setParameterLength( 2 );

/**
 * Returns `true` if `x` equals `y`.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @param {Node | number} y - The second parameter.
 * @deprecated since r175. Use {@link equal} instead.
 * @returns {Node<bool>}
 */
export const equals = ( x, y ) => { // @deprecated, r172

	console.warn( 'THREE.TSL: "equals" is deprecated. Use "equal" inside a vector instead, like: "bvec*( equal( ... ) )"' );
	return equal( x, y );

};

/**
 * Returns the least of the given values.
 *
 * @tsl
 * @function
 * @param {...(Node | number)} values - The values to compare.
 * @returns {Node}
 */
export const min = nodeProxyIntent( MathNode, MathNode.MIN ).setParameterLength( 2, Infinity );

/**
 * Returns the greatest of the given values.
 *
 * @tsl
 * @function
 * @param {...(Node | number)} values - The values to compare.
 * @returns {Node}
 */
export const max = nodeProxyIntent( MathNode, MathNode.MAX ).setParameterLength( 2, Infinity );

/**
 * Generate a step function by comparing two values.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The y parameter.
 * @param {Node | number} y - The x parameter.
 * @returns {Node}
 */
export const step = nodeProxyIntent( MathNode, MathNode.STEP ).setParameterLength( 2 );

/**
 * Calculates the reflection direction for an incident vector.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} I - The incident vector.
 * @param {Node<vec2|vec3|vec4>} N - The normal vector.
 * @returns {Node<vec2|vec3|vec4>}
 */
export const reflect = nodeProxyIntent( MathNode, MathNode.REFLECT ).setParameterLength( 2 );

/**
 * Calculates the distance between two points.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} x - The first point.
 * @param {Node<vec2|vec3|vec4>} y - The second point.
 * @returns {Node<float>}
 */
export const distance = nodeProxyIntent( MathNode, MathNode.DISTANCE ).setParameterLength( 2 );

/**
 * Calculates the absolute difference between two values.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @param {Node | number} y - The second parameter.
 * @returns {Node}
 */
export const difference = nodeProxyIntent( MathNode, MathNode.DIFFERENCE ).setParameterLength( 2 );

/**
 * Calculates the dot product of two vectors.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} x - The first vector.
 * @param {Node<vec2|vec3|vec4>} y - The second vector.
 * @returns {Node<float>}
 */
export const dot = nodeProxyIntent( MathNode, MathNode.DOT ).setParameterLength( 2 );

/**
 * Calculates the cross product of two vectors.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3>} x - The first vector.
 * @param {Node<vec2|vec3>} y - The second vector.
 * @returns {Node<float|vec3>}
 */
export const cross = nodeProxyIntent( MathNode, MathNode.CROSS ).setParameterLength( 2 );

/**
 * Return the value of the first parameter raised to the power of the second one.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @param {Node | number} y - The second parameter.
 * @returns {Node}
 */
export const pow = nodeProxyIntent( MathNode, MathNode.POW ).setParameterLength( 2 );

/**
 * Returns the square of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @returns {Node}
 */
export const pow2 = nodeProxyIntent( MathNode, MathNode.POW, 2 ).setParameterLength( 1 );

/**
 * Returns the cube of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @returns {Node}
 */
export const pow3 = nodeProxyIntent( MathNode, MathNode.POW, 3 ).setParameterLength( 1 );

/**
 * Returns the fourth power of the parameter.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The first parameter.
 * @returns {Node}
 */
export const pow4 = nodeProxyIntent( MathNode, MathNode.POW, 4 ).setParameterLength( 1 );

/**
 * Transforms the direction of a vector by a matrix and then normalizes the result.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} direction - The direction vector.
 * @param {Node<mat2|mat3|mat4>} matrix - The transformation matrix.
 * @returns {Node}
 */
export const transformDirection = nodeProxyIntent( MathNode, MathNode.TRANSFORM_DIRECTION ).setParameterLength( 2 );

/**
 * Returns the cube root of a number.
 *
 * @tsl
 * @function
 * @param {Node | number} a - The first parameter.
 * @returns {Node}
 */
export const cbrt = ( a ) => mul( sign( a ), pow( abs( a ), 1.0 / 3.0 ) );

/**
 * Calculate the squared length of a vector.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} a - The vector.
 * @returns {Node<float>}
 */
export const lengthSq = ( a ) => dot( a, a );

/**
 * Linearly interpolates between two values.
 *
 * @tsl
 * @function
 * @param {Node | number} a - The first parameter.
 * @param {Node | number} b - The second parameter.
 * @param {Node | number} t - The interpolation value.
 * @returns {Node}
 */
export const mix = nodeProxyIntent( MathNode, MathNode.MIX ).setParameterLength( 3 );

/**
 * Constrains a value to lie between two further values.
 *
 * @tsl
 * @function
 * @param {Node | number} value - The value to constrain.
 * @param {Node | number} [low=0] - The lower bound.
 * @param {Node | number} [high=1] - The upper bound.
 * @returns {Node}
 */
export const clamp = ( value, low = 0, high = 1 ) => nodeObject( new MathNode( MathNode.CLAMP, nodeObject( value ), nodeObject( low ), nodeObject( high ) ) );

/**
 * Constrains a value between `0` and `1`.
 *
 * @tsl
 * @function
 * @param {Node | number} value - The value to constrain.
 * @returns {Node}
 */
export const saturate = ( value ) => clamp( value );

/**
 * Calculates the refraction direction for an incident vector.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} I - The incident vector.
 * @param {Node<vec2|vec3|vec4>} N - The normal vector.
 * @param {Node<float>} eta - The ratio of indices of refraction.
 * @returns {Node<vec2|vec3|vec4>}
 */
export const refract = nodeProxyIntent( MathNode, MathNode.REFRACT ).setParameterLength( 3 );

/**
 * Performs a Hermite interpolation between two values.
 *
 * @tsl
 * @function
 * @param {Node | number} low - The value of the lower edge of the Hermite function.
 * @param {Node | number} high - The value of the upper edge of the Hermite function.
 * @param {Node | number} x - The source value for interpolation.
 * @returns {Node}
 */
export const smoothstep = nodeProxyIntent( MathNode, MathNode.SMOOTHSTEP ).setParameterLength( 3 );

/**
 * Returns a vector pointing in the same direction as another.
 *
 * @tsl
 * @function
 * @param {Node<vec2|vec3|vec4>} N - The vector to orient.
 * @param {Node<vec2|vec3|vec4>} I - The incident vector.
 * @param {Node<vec2|vec3|vec4>} Nref - The reference vector.
 * @returns {Node<vec2|vec3|vec4>}
 */
export const faceForward = nodeProxyIntent( MathNode, MathNode.FACEFORWARD ).setParameterLength( 3 );

/**
 * Returns a random value for the given uv.
 *
 * @tsl
 * @function
 * @param {Node<vec2>} uv - The uv node.
 * @returns {Node<float>}
 */
export const rand = Fn( ( [ uv ] ) => {

	const a = 12.9898, b = 78.233, c = 43758.5453;
	const dt = dot( uv.xy, vec2( a, b ) ), sn = mod( dt, PI );

	return fract( sin( sn ).mul( c ) );

} );

/**
 * Alias for `mix()` with a different parameter order.
 *
 * @tsl
 * @function
 * @param {Node | number} t - The interpolation value.
 * @param {Node | number} e1 - The first parameter.
 * @param {Node | number} e2 - The second parameter.
 * @returns {Node}
 */
export const mixElement = ( t, e1, e2 ) => mix( e1, e2, t );

/**
 * Alias for `smoothstep()` with a different parameter order.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The source value for interpolation.
 * @param {Node | number} low - The value of the lower edge of the Hermite function.
 * @param {Node | number} high - The value of the upper edge of the Hermite function.
 * @returns {Node}
 */
export const smoothstepElement = ( x, low, high ) => smoothstep( low, high, x );

/**
 * Alias for `step()` with a different parameter order.
 *
 * @tsl
 * @function
 * @param {Node | number} x - The source value for interpolation.
 * @param {Node | number} edge - The edge value.
 * @returns {Node}
 */
export const stepElement = ( x, edge ) => step( edge, x );

/**
 * Returns the arc-tangent of the quotient of its parameters.
 *
 * @tsl
 * @function
 * @deprecated since r172. Use {@link atan} instead.
 *
 * @param {Node | number} y - The y parameter.
 * @param {Node | number} x - The x parameter.
 * @returns {Node}
 */
export const atan2 = ( y, x ) => { // @deprecated, r172

	console.warn( 'THREE.TSL: "atan2" is overloaded. Use "atan" instead.' );
	return atan( y, x );

};

// GLSL alias function

export const faceforward = faceForward;
export const inversesqrt = inverseSqrt;

// Method chaining

addMethodChaining( 'all', all );
addMethodChaining( 'any', any );
addMethodChaining( 'equals', equals );

addMethodChaining( 'radians', radians );
addMethodChaining( 'degrees', degrees );
addMethodChaining( 'exp', exp );
addMethodChaining( 'exp2', exp2 );
addMethodChaining( 'log', log );
addMethodChaining( 'log2', log2 );
addMethodChaining( 'sqrt', sqrt );
addMethodChaining( 'inverseSqrt', inverseSqrt );
addMethodChaining( 'floor', floor );
addMethodChaining( 'ceil', ceil );
addMethodChaining( 'normalize', normalize );
addMethodChaining( 'fract', fract );
addMethodChaining( 'sin', sin );
addMethodChaining( 'cos', cos );
addMethodChaining( 'tan', tan );
addMethodChaining( 'asin', asin );
addMethodChaining( 'acos', acos );
addMethodChaining( 'atan', atan );
addMethodChaining( 'abs', abs );
addMethodChaining( 'sign', sign );
addMethodChaining( 'length', length );
addMethodChaining( 'lengthSq', lengthSq );
addMethodChaining( 'negate', negate );
addMethodChaining( 'oneMinus', oneMinus );
addMethodChaining( 'dFdx', dFdx );
addMethodChaining( 'dFdy', dFdy );
addMethodChaining( 'round', round );
addMethodChaining( 'reciprocal', reciprocal );
addMethodChaining( 'trunc', trunc );
addMethodChaining( 'fwidth', fwidth );
addMethodChaining( 'atan2', atan2 );
addMethodChaining( 'min', min );
addMethodChaining( 'max', max );
addMethodChaining( 'step', stepElement );
addMethodChaining( 'reflect', reflect );
addMethodChaining( 'distance', distance );
addMethodChaining( 'dot', dot );
addMethodChaining( 'cross', cross );
addMethodChaining( 'pow', pow );
addMethodChaining( 'pow2', pow2 );
addMethodChaining( 'pow3', pow3 );
addMethodChaining( 'pow4', pow4 );
addMethodChaining( 'transformDirection', transformDirection );
addMethodChaining( 'mix', mixElement );
addMethodChaining( 'clamp', clamp );
addMethodChaining( 'refract', refract );
addMethodChaining( 'smoothstep', smoothstepElement );
addMethodChaining( 'faceForward', faceForward );
addMethodChaining( 'difference', difference );
addMethodChaining( 'saturate', saturate );
addMethodChaining( 'cbrt', cbrt );
addMethodChaining( 'transpose', transpose );
addMethodChaining( 'determinant', determinant );
addMethodChaining( 'inverse', inverse );
addMethodChaining( 'rand', rand );
