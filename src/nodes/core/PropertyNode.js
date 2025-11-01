import Node from './Node.js';
import { nodeImmutable, nodeObject } from '../tsl/TSLCore.js';
import { hashString } from './NodeUtils.js';

/**
 * This class represents a shader property. It can be used
 * to explicitly define a property and assign a value to it.
 *
 * ```js
 * const threshold = property( 'float', 'threshold' ).assign( THRESHOLD );
 *```
 * `PropertyNode` is used by the engine to predefined common material properties
 * for TSL code.
 *
 * @augments Node
 */
class PropertyNode extends Node {

	static get type() {

		return 'PropertyNode';

	}

	/**
	 * Constructs a new property node.
	 *
	 * @param {string} nodeType - The type of the node.
	 * @param {?string} [name=null] - The name of the property in the shader.
	 * @param {boolean} [varying=false] - Whether this property is a varying or not.
	 */
	constructor( nodeType, name = null, varying = false ) {

		super( nodeType );

		/**
		 * The name of the property in the shader. If no name is defined,
		 * the node system auto-generates one.
		 *
		 * @type {?string}
		 * @default null
		 */
		this.name = name;

		/**
		 * Whether this property is a varying or not.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.varying = varying;

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPropertyNode = true;

		/**
		 * This flag is used for global cache.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.global = true;

	}

	customCacheKey() {

		return hashString( this.type + ':' + ( this.name || '' ) + ':' + ( this.varying ? '1' : '0' ) );

	}

	getHash( builder ) {

		return this.name || super.getHash( builder );

	}

	generate( builder ) {

		let nodeVar;

		if ( this.varying === true ) {

			nodeVar = builder.getVaryingFromNode( this, this.name );
			nodeVar.needsInterpolation = true;

		} else {

			nodeVar = builder.getVarFromNode( this, this.name );

		}

		return builder.getPropertyName( nodeVar );

	}

}

export default PropertyNode;

/**
 * TSL function for creating a property node.
 *
 * @tsl
 * @function
 * @param {string} type - The type of the node.
 * @param {?string} [name=null] - The name of the property in the shader.
 * @returns {PropertyNode}
 */
export const property = ( type, name ) => nodeObject( new PropertyNode( type, name ) );

/**
 * TSL function for creating a varying property node.
 *
 * @tsl
 * @function
 * @param {string} type - The type of the node.
 * @param {?string} [name=null] - The name of the varying in the shader.
 * @returns {PropertyNode}
 */
export const varyingProperty = ( type, name ) => nodeObject( new PropertyNode( type, name, true ) );

/**
 * TSL object that represents the shader variable `DiffuseColor`.
 *
 * @tsl
 * @type {PropertyNode<vec4>}
 */
export const diffuseColor = nodeImmutable( PropertyNode, 'vec4', 'DiffuseColor' );

/**
 * TSL object that represents the shader variable `EmissiveColor`.
 *
 * @tsl
 * @type {PropertyNode<vec3>}
 */
export const emissive = nodeImmutable( PropertyNode, 'vec3', 'EmissiveColor' );

/**
 * TSL object that represents the shader variable `Roughness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const roughness = nodeImmutable( PropertyNode, 'float', 'Roughness' );

/**
 * TSL object that represents the shader variable `Metalness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const metalness = nodeImmutable( PropertyNode, 'float', 'Metalness' );

/**
 * TSL object that represents the shader variable `Clearcoat`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const clearcoat = nodeImmutable( PropertyNode, 'float', 'Clearcoat' );

/**
 * TSL object that represents the shader variable `ClearcoatRoughness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const clearcoatRoughness = nodeImmutable( PropertyNode, 'float', 'ClearcoatRoughness' );

/**
 * TSL object that represents the shader variable `Sheen`.
 *
 * @tsl
 * @type {PropertyNode<vec3>}
 */
export const sheen = nodeImmutable( PropertyNode, 'vec3', 'Sheen' );

/**
 * TSL object that represents the shader variable `SheenRoughness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const sheenRoughness = nodeImmutable( PropertyNode, 'float', 'SheenRoughness' );

/**
 * TSL object that represents the shader variable `Iridescence`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const iridescence = nodeImmutable( PropertyNode, 'float', 'Iridescence' );

/**
 * TSL object that represents the shader variable `IridescenceIOR`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const iridescenceIOR = nodeImmutable( PropertyNode, 'float', 'IridescenceIOR' );

/**
 * TSL object that represents the shader variable `IridescenceThickness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const iridescenceThickness = nodeImmutable( PropertyNode, 'float', 'IridescenceThickness' );

/**
 * TSL object that represents the shader variable `AlphaT`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const alphaT = nodeImmutable( PropertyNode, 'float', 'AlphaT' );

/**
 * TSL object that represents the shader variable `Anisotropy`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const anisotropy = nodeImmutable( PropertyNode, 'float', 'Anisotropy' );

/**
 * TSL object that represents the shader variable `AnisotropyT`.
 *
 * @tsl
 * @type {PropertyNode<vec3>}
 */
export const anisotropyT = nodeImmutable( PropertyNode, 'vec3', 'AnisotropyT' );

/**
 * TSL object that represents the shader variable `AnisotropyB`.
 *
 * @tsl
 * @type {PropertyNode<vec3>}
 */
export const anisotropyB = nodeImmutable( PropertyNode, 'vec3', 'AnisotropyB' );

/**
 * TSL object that represents the shader variable `SpecularColor`.
 *
 * @tsl
 * @type {PropertyNode<color>}
 */
export const specularColor = nodeImmutable( PropertyNode, 'color', 'SpecularColor' );

/**
 * TSL object that represents the shader variable `SpecularF90`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const specularF90 = nodeImmutable( PropertyNode, 'float', 'SpecularF90' );

/**
 * TSL object that represents the shader variable `Shininess`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const shininess = nodeImmutable( PropertyNode, 'float', 'Shininess' );

/**
 * TSL object that represents the shader variable `Output`.
 *
 * @tsl
 * @type {PropertyNode<vec4>}
 */
export const output = nodeImmutable( PropertyNode, 'vec4', 'Output' );

/**
 * TSL object that represents the shader variable `dashSize`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const dashSize = nodeImmutable( PropertyNode, 'float', 'dashSize' );

/**
 * TSL object that represents the shader variable `gapSize`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const gapSize = nodeImmutable( PropertyNode, 'float', 'gapSize' );

/**
 * TSL object that represents the shader variable `pointWidth`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const pointWidth = nodeImmutable( PropertyNode, 'float', 'pointWidth' );

/**
 * TSL object that represents the shader variable `IOR`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const ior = nodeImmutable( PropertyNode, 'float', 'IOR' );

/**
 * TSL object that represents the shader variable `Transmission`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const transmission = nodeImmutable( PropertyNode, 'float', 'Transmission' );

/**
 * TSL object that represents the shader variable `Thickness`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const thickness = nodeImmutable( PropertyNode, 'float', 'Thickness' );

/**
 * TSL object that represents the shader variable `AttenuationDistance`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const attenuationDistance = nodeImmutable( PropertyNode, 'float', 'AttenuationDistance' );

/**
 * TSL object that represents the shader variable `AttenuationColor`.
 *
 * @tsl
 * @type {PropertyNode<color>}
 */
export const attenuationColor = nodeImmutable( PropertyNode, 'color', 'AttenuationColor' );

/**
 * TSL object that represents the shader variable `Dispersion`.
 *
 * @tsl
 * @type {PropertyNode<float>}
 */
export const dispersion = nodeImmutable( PropertyNode, 'float', 'Dispersion' );
