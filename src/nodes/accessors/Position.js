import { attribute } from '../core/AttributeNode.js';
import { Fn } from '../tsl/TSLCore.js';
import { modelWorldMatrix } from './ModelNode.js';

/** @module Position **/

/**
 * TSL object that represents the position attribute of the current rendered object.
 *
 * @type {AttributeNode<vec3>}
 */
export const positionGeometry = attribute( 'position', 'vec3' );

/**
 * TSL object that represents the vertex position in local space of the current rendered object.
 *
 * @type {AttributeNode<vec3>}
 */
export const positionLocal = positionGeometry.toVarying( 'positionLocal' );

/**
 * TSL object that represents the previous vertex position in local space of the current rendered object.
 * Used in context of {@link module:VelocityNode~VelocityNode} for rendering motion vectors.
 *
 * @type {AttributeNode<vec3>}
 */
export const positionPrevious = positionGeometry.toVarying( 'positionPrevious' );

/**
 * TSL object that represents the vertex position in world space of the current rendered object.
 *
 * @type {VaryingNode<vec3>}
 */
export const positionWorld = modelWorldMatrix.mul( positionLocal ).xyz.toVarying( 'v_positionWorld' ).context( { needsPositionReassign: true } );

/**
 * TSL object that represents the position world direction of the current rendered object.
 *
 * @type {Node<vec3>}
 */
export const positionWorldDirection = positionLocal.transformDirection( modelWorldMatrix ).toVarying( 'v_positionWorldDirection' ).normalize().toVar( 'positionWorldDirection' ).context( { needsPositionReassign: true } );

/**
 * TSL object that represents the vertex position in view space of the current rendered object.
 *
 * @type {VaryingNode<vec3>}
 */
export const positionView = ( Fn( ( builder ) => {

	return builder.context.setupPositionView();

}, 'vec3' ).once() )().toVarying( 'v_positionView' ).context( { needsPositionReassign: true } );

/**
 * TSL object that represents the position view direction of the current rendered object.
 *
 * @type {VaryingNode<vec3>}
 */
export const positionViewDirection = positionView.negate().toVarying( 'v_positionViewDirection' ).normalize().toVar( 'positionViewDirection' );
