import { attribute } from '../core/AttributeNode.js';
import { modelWorldMatrix, modelViewMatrix } from './ModelNode.js';

export const positionGeometry = attribute( 'position', 'vec3' );
export const positionLocal = positionGeometry.varying( 'positionLocal' );
export const positionPrevious = positionGeometry.varying( 'positionPrevious' );
export const positionWorld = modelWorldMatrix.mul( positionLocal ).xyz.varying( 'v_positionWorld' );
export const positionWorldDirection = positionLocal.transformDirection( modelWorldMatrix ).varying( 'v_positionWorldDirection' ).normalize().toVar( 'positionWorldDirection' );
export const positionView = modelViewMatrix.mul( positionLocal ).xyz.varying( 'v_positionView' );
export const positionViewDirection = positionView.negate().varying( 'v_positionViewDirection' ).normalize().toVar( 'positionViewDirection' );
