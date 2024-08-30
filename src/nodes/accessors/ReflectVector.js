import { cameraViewMatrix } from './Camera.js';
import { transformedNormalView } from './Normal.js';
import { positionViewDirection } from './Position.js';
import { materialRefractionRatio } from './MaterialProperties.js';

export const reflectView = positionViewDirection.negate().reflect( transformedNormalView );
export const refractView = positionViewDirection.negate().refract( transformedNormalView, materialRefractionRatio );

export const reflectVector = reflectView.transformDirection( cameraViewMatrix ).toVar( 'reflectVector' );
export const refractVector = refractView.transformDirection( cameraViewMatrix ).toVar( 'reflectVector' );
