import { varying } from '../core/VaryingNode.js';
import { cameraViewMatrix } from './Camera.js';
import { normalGeometry, normalLocal, normalView, normalWorld, transformedNormalView } from './Normal.js';
import { tangentGeometry, tangentLocal, tangentView, tangentWorld, transformedTangentView } from './Tangent.js';

const getBitangent = ( crossNormalTangent ) => crossNormalTangent.mul( tangentGeometry.w ).xyz;

export const bitangentGeometry = varying( getBitangent( normalGeometry.cross( tangentGeometry ) ), 'v_bitangentGeometry' ).normalize().toVar( 'bitangentGeometry' );
export const bitangentLocal = varying( getBitangent( normalLocal.cross( tangentLocal ) ), 'v_bitangentLocal' ).normalize().toVar( 'bitangentLocal' );
export const bitangentView = varying( getBitangent( normalView.cross( tangentView ) ), 'v_bitangentView' ).normalize().toVar( 'bitangentView' );
export const bitangentWorld = varying( getBitangent( normalWorld.cross( tangentWorld ) ), 'v_bitangentWorld' ).normalize().toVar( 'bitangentWorld' );
export const transformedBitangentView = getBitangent( transformedNormalView.cross( transformedTangentView ) ).normalize().toVar( 'transformedBitangentView' );
export const transformedBitangentWorld = transformedBitangentView.transformDirection( cameraViewMatrix ).normalize().toVar( 'transformedBitangentWorld' );
