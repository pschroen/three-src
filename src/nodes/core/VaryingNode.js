import Node from './Node.js';
import { NodeShaderStage } from './constants.js';
import { addMethodChaining, nodeProxy } from '../tsl/TSLCore.js';
import { subBuild } from './SubBuildNode.js';

/**
 * Class for representing shader varyings as nodes. Varyings are create from
 * existing nodes like the following:
 *
 * ```js
 * const positionLocal = positionGeometry.toVarying( 'vPositionLocal' );
 * ```
 *
 * @augments Node
 */
class VaryingNode extends Node {

	static get type() {

		return 'VaryingNode';

	}

	/**
	 * Constructs a new varying node.
	 *
	 * @param {Node} node - The node for which a varying should be created.
	 * @param {?string} name - The name of the varying in the shader.
	 */
	constructor( node, name = null ) {

		super();

		/**
		 * The node for which a varying should be created.
		 *
		 * @type {Node}
		 */
		this.node = node;

		/**
		 * The name of the varying in the shader. If no name is defined,
		 * the node system auto-generates one.
		 *
		 * @type {?string}
		 * @default null
		 */
		this.name = name;

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isVaryingNode = true;

		/**
		 * The interpolation type of the varying data.
		 *
		 * @type {?string}
		 * @default null
		 */
		this.interpolationType = null;

		/**
		 * The interpolation sampling type of varying data.
		 *
		 * @type {?string}
		 * @default null
		 */
		this.interpolationSampling = null;

		/**
		 * This flag is used for global cache.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.global = true;

	}

	/**
	 * Defines the interpolation type of the varying.
	 *
	 * @param {string} type - The interpolation type.
	 * @param {?string} sampling - The interpolation sampling type
	 * @return {VaryingNode} A reference to this node.
	 */
	setInterpolation( type, sampling = null ) {

		this.interpolationType = type;
		this.interpolationSampling = sampling;

		return this;

	}

	getHash( builder ) {

		return this.name || super.getHash( builder );

	}

	getNodeType( builder ) {

		// VaryingNode is auto type

		return this.node.getNodeType( builder );

	}

	/**
	 * This method performs the setup of a varying node with the current node builder.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @return {NodeVarying} The node varying from the node builder.
	 */
	setupVarying( builder ) {

		const properties = builder.getNodeProperties( this );

		let varying = properties.varying;

		if ( varying === undefined ) {

			const name = this.name;
			const type = this.getNodeType( builder );
			const interpolationType = this.interpolationType;
			const interpolationSampling = this.interpolationSampling;

			properties.varying = varying = builder.getVaryingFromNode( this, name, type, interpolationType, interpolationSampling );
			properties.node = subBuild( this.node, 'VERTEX' );

		}

		// this property can be used to check if the varying can be optimized for a variable
		varying.needsInterpolation || ( varying.needsInterpolation = ( builder.shaderStage === 'fragment' ) );

		return varying;

	}

	setup( builder ) {

		this.setupVarying( builder );

		builder.flowNodeFromShaderStage( NodeShaderStage.VERTEX, this.node );

	}

	analyze( builder ) {

		this.setupVarying( builder );

		builder.flowNodeFromShaderStage( NodeShaderStage.VERTEX, this.node );

	}

	generate( builder ) {

		const propertyKey = builder.getSubBuildProperty( 'property', builder.currentStack );
		const properties = builder.getNodeProperties( this );
		const varying = this.setupVarying( builder );

		if ( properties[ propertyKey ] === undefined ) {

			const type = this.getNodeType( builder );
			const propertyName = builder.getPropertyName( varying, NodeShaderStage.VERTEX );

			// force node run in vertex stage
			builder.flowNodeFromShaderStage( NodeShaderStage.VERTEX, properties.node, type, propertyName );

			properties[ propertyKey ] = propertyName;

		}

		return builder.getPropertyName( varying );

	}

}

export default VaryingNode;

/**
 * TSL function for creating a varying node.
 *
 * @tsl
 * @function
 * @param {Node} node - The node for which a varying should be created.
 * @param {?string} name - The name of the varying in the shader.
 * @returns {VaryingNode}
 */
export const varying = nodeProxy( VaryingNode ).setParameterLength( 1, 2 );

/**
 * Computes a node in the vertex stage.
 *
 * @tsl
 * @function
 * @param {Node} node - The node which should be executed in the vertex stage.
 * @returns {VaryingNode}
 */
export const vertexStage = ( node ) => varying( node );

addMethodChaining( 'toVarying', varying );
addMethodChaining( 'toVertexStage', vertexStage );

// Deprecated

addMethodChaining( 'varying', ( ...params ) => { // @deprecated, r173

	console.warn( 'THREE.TSL: .varying() has been renamed to .toVarying().' );
	return varying( ...params );

} );

addMethodChaining( 'vertexStage', ( ...params ) => { // @deprecated, r173

	console.warn( 'THREE.TSL: .vertexStage() has been renamed to .toVertexStage().' );
	return varying( ...params );

} );
