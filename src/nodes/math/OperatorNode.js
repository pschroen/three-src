import TempNode from '../core/TempNode.js';
import { addMethodChaining, nodeProxy } from '../tsl/TSLCore.js';

/** @module OperatorNode **/

/**
 * This node represents basic mathematical and logical operations like addition,
 * subtraction or comparisons (e.g. `equal()`).
 *
 * @augments TempNode
 */
class OperatorNode extends TempNode {

	static get type() {

		return 'OperatorNode';

	}

	/**
	 * Constructs a new operator node.
	 *
	 * @param {String} op - The operator.
	 * @param {Node} aNode - The first input.
	 * @param {Node} bNode - The second input.
	 * @param {...Node} params - Additional input parameters.
	 */
	constructor( op, aNode, bNode, ...params ) {

		super();

		if ( params.length > 0 ) {

			let finalOp = new OperatorNode( op, aNode, bNode );

			for ( let i = 0; i < params.length - 1; i ++ ) {

				finalOp = new OperatorNode( op, finalOp, params[ i ] );

			}

			aNode = finalOp;
			bNode = params[ params.length - 1 ];

		}

		/**
		 * The operator.
		 *
		 * @type {String}
		 */
		this.op = op;

		/**
		 * The first input.
		 *
		 * @type {Node}
		 */
		this.aNode = aNode;

		/**
		 * The second input.
		 *
		 * @type {Node}
		 */
		this.bNode = bNode;

	}

	/**
	 * This method is overwritten since the node type is inferred from the operator
	 * and the input node types.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @param {String} output - The current output string.
	 * @return {String} The node type.
	 */
	getNodeType( builder, output ) {

		const op = this.op;

		const aNode = this.aNode;
		const bNode = this.bNode;

		const typeA = aNode.getNodeType( builder );
		const typeB = typeof bNode !== 'undefined' ? bNode.getNodeType( builder ) : null;

		if ( typeA === 'void' || typeB === 'void' ) {

			return 'void';

		} else if ( op === '%' ) {

			return typeA;

		} else if ( op === '~' || op === '&' || op === '|' || op === '^' || op === '>>' || op === '<<' ) {

			return builder.getIntegerType( typeA );

		} else if ( op === '!' || op === '==' || op === '&&' || op === '||' || op === '^^' ) {

			return 'bool';

		} else if ( op === '<' || op === '>' || op === '<=' || op === '>=' ) {

			const typeLength = output ? builder.getTypeLength( output ) : Math.max( builder.getTypeLength( typeA ), builder.getTypeLength( typeB ) );

			return typeLength > 1 ? `bvec${ typeLength }` : 'bool';

		} else {

			if ( typeA === 'float' && builder.isMatrix( typeB ) ) {

				return typeB;

			} else if ( builder.isMatrix( typeA ) && builder.isVector( typeB ) ) {

				// matrix x vector

				return builder.getVectorFromMatrix( typeA );

			} else if ( builder.isVector( typeA ) && builder.isMatrix( typeB ) ) {

				// vector x matrix

				return builder.getVectorFromMatrix( typeB );

			} else if ( builder.getTypeLength( typeB ) > builder.getTypeLength( typeA ) ) {

				// anytype x anytype: use the greater length vector

				return typeB;

			}

			return typeA;

		}

	}

	generate( builder, output ) {

		const op = this.op;

		const aNode = this.aNode;
		const bNode = this.bNode;

		const type = this.getNodeType( builder, output );

		let typeA = null;
		let typeB = null;

		if ( type !== 'void' ) {

			typeA = aNode.getNodeType( builder );
			typeB = typeof bNode !== 'undefined' ? bNode.getNodeType( builder ) : null;

			if ( op === '<' || op === '>' || op === '<=' || op === '>=' || op === '==' ) {

				if ( builder.isVector( typeA ) ) {

					typeB = typeA;

				} else if ( typeA !== typeB ) {

					typeA = typeB = 'float';

				}

			} else if ( op === '>>' || op === '<<' ) {

				typeA = type;
				typeB = builder.changeComponentType( typeB, 'uint' );

			} else if ( builder.isMatrix( typeA ) && builder.isVector( typeB ) ) {

				// matrix x vector

				typeB = builder.getVectorFromMatrix( typeA );

			} else if ( builder.isVector( typeA ) && builder.isMatrix( typeB ) ) {

				// vector x matrix

				typeA = builder.getVectorFromMatrix( typeB );

			} else {

				// anytype x anytype

				typeA = typeB = type;

			}

		} else {

			typeA = typeB = type;

		}

		const a = aNode.build( builder, typeA );
		const b = typeof bNode !== 'undefined' ? bNode.build( builder, typeB ) : null;

		const outputLength = builder.getTypeLength( output );
		const fnOpSnippet = builder.getFunctionOperator( op );

		if ( output !== 'void' ) {

			if ( op === '<' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'lessThan', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } < ${ b } )`, type, output );

				}

			} else if ( op === '<=' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'lessThanEqual', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } <= ${ b } )`, type, output );

				}

			} else if ( op === '>' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'greaterThan', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } > ${ b } )`, type, output );

				}

			} else if ( op === '>=' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'greaterThanEqual', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } >= ${ b } )`, type, output );

				}

			} else if ( op === '!' || op === '~' ) {

				return builder.format( `(${op}${a})`, typeA, output );

			} else if ( fnOpSnippet ) {

				return builder.format( `${ fnOpSnippet }( ${ a }, ${ b } )`, type, output );

			} else {

				return builder.format( `( ${ a } ${ op } ${ b } )`, type, output );

			}

		} else if ( typeA !== 'void' ) {

			if ( fnOpSnippet ) {

				return builder.format( `${ fnOpSnippet }( ${ a }, ${ b } )`, type, output );

			} else {

				return builder.format( `${ a } ${ op } ${ b }`, type, output );

			}

		}

	}

	serialize( data ) {

		super.serialize( data );

		data.op = this.op;

	}

	deserialize( data ) {

		super.deserialize( data );

		this.op = data.op;

	}

}

export default OperatorNode;

/**
 * Returns the addition of two or more value.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const add = nodeProxy( OperatorNode, '+' );

/**
 * Returns the subtraction of two or more value.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const sub = nodeProxy( OperatorNode, '-' );

/**
 * Returns the multiplication of two or more value.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const mul = nodeProxy( OperatorNode, '*' );

/**
 * Returns the division of two or more value.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const div = nodeProxy( OperatorNode, '/' );

/**
 * Computes the remainder of dividing the first node by the second, for integer values.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const modInt = nodeProxy( OperatorNode, '%' );

/**
 * Checks if two nodes are equal.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const equal = nodeProxy( OperatorNode, '==' );

/**
 * Checks if two nodes are not equal.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const notEqual = nodeProxy( OperatorNode, '!=' );

/**
 * Checks if the first node is less than the second.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const lessThan = nodeProxy( OperatorNode, '<' );

/**
 * Checks if the first node is greater than the second.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const greaterThan = nodeProxy( OperatorNode, '>' );

/**
 * Checks if the first node is less than or equal to the second.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const lessThanEqual = nodeProxy( OperatorNode, '<=' );

/**
 * Checks if the first node is greater than or equal to the second.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const greaterThanEqual = nodeProxy( OperatorNode, '>=' );

/**
 * Performs logical AND on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const and = nodeProxy( OperatorNode, '&&' );

/**
 * Performs logical OR on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const or = nodeProxy( OperatorNode, '||' );

/**
 * Performs logical NOT on a node.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const not = nodeProxy( OperatorNode, '!' );

/**
 * Performs logical XOR on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const xor = nodeProxy( OperatorNode, '^^' );

/**
 * Performs bitwise AND on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitAnd = nodeProxy( OperatorNode, '&' );

/**
 * Performs bitwise NOT on a node.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitNot = nodeProxy( OperatorNode, '~' );

/**
 * Performs bitwise OR on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitOr = nodeProxy( OperatorNode, '|' );

/**
 * Performs bitwise XOR on two nodes.
 *
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitXor = nodeProxy( OperatorNode, '^' );

/**
 * Shifts a node to the left.
 *
 * @function
 * @param {Node} aNode - The node to shift.
 * @param {Node} bNode - The value to shift.
 * @returns {OperatorNode}
 */
export const shiftLeft = nodeProxy( OperatorNode, '<<' );

/**
 * Shifts a node to the right.
 *
 * @function
 * @param {Node} aNode - The node to shift.
 * @param {Node} bNode - The value to shift.
 * @returns {OperatorNode}
 */
export const shiftRight = nodeProxy( OperatorNode, '>>' );

addMethodChaining( 'add', add );
addMethodChaining( 'sub', sub );
addMethodChaining( 'mul', mul );
addMethodChaining( 'div', div );
addMethodChaining( 'modInt', modInt );
addMethodChaining( 'equal', equal );
addMethodChaining( 'notEqual', notEqual );
addMethodChaining( 'lessThan', lessThan );
addMethodChaining( 'greaterThan', greaterThan );
addMethodChaining( 'lessThanEqual', lessThanEqual );
addMethodChaining( 'greaterThanEqual', greaterThanEqual );
addMethodChaining( 'and', and );
addMethodChaining( 'or', or );
addMethodChaining( 'not', not );
addMethodChaining( 'xor', xor );
addMethodChaining( 'bitAnd', bitAnd );
addMethodChaining( 'bitNot', bitNot );
addMethodChaining( 'bitOr', bitOr );
addMethodChaining( 'bitXor', bitXor );
addMethodChaining( 'shiftLeft', shiftLeft );
addMethodChaining( 'shiftRight', shiftRight );


export const remainder = ( ...params ) => { // @deprecated, r168

	console.warn( 'TSL.OperatorNode: .remainder() has been renamed to .modInt().' );
	return modInt( ...params );

};

addMethodChaining( 'remainder', remainder );
