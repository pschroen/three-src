import { uniform } from '../core/UniformNode.js';

/** @module MaterialProperties **/

/**
 * TSL object that represents the refraction ratio of the material used for rendering the current object.
 *
 * @type {UniformNode<float>}
 */
export const materialRefractionRatio = uniform( 0 ).onReference( ( { material } ) => material ).onRenderUpdate( ( { material } ) => material.refractionRatio );
