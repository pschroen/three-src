import { renderGroup } from '../core/UniformGroupNode.js';
import { uniform } from '../core/UniformNode.js';

/**
 * Represents the elapsed time in seconds.
 *
 * @tsl
 * @type {UniformNode<float>}
 */
export const time = uniform( 0 ).setGroup( renderGroup ).onRenderUpdate( ( frame ) => frame.time );

/**
 * Represents the delta time in seconds.
 *
 * @tsl
 * @type {UniformNode<float>}
 */
export const deltaTime = uniform( 0 ).setGroup( renderGroup ).onRenderUpdate( ( frame ) => frame.deltaTime );

/**
 * Represents the current frame ID.
 *
 * @tsl
 * @type {UniformNode<uint>}
 */
export const frameId = uniform( 0, 'uint' ).setGroup( renderGroup ).onRenderUpdate( ( frame ) => frame.frameId );
