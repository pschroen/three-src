import { uniform } from '../core/UniformNode.js';

export const materialRefractionRatio = uniform( 0 ).onReference( ( { material } ) => material ).onRenderUpdate( ( { material } ) => material.refractionRatio );
