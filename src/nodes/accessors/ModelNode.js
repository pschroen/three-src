import Object3DNode from './Object3DNode.js';
import { Fn, nodeImmutable } from '../tsl/TSLBase.js';
import { uniform } from '../core/UniformNode.js';

import { Matrix4 } from '../../math/Matrix4.js';
import { cameraViewMatrix } from './Camera.js';
import { Matrix3 } from '../../math/Matrix3.js';

class ModelNode extends Object3DNode {

	static get type() {

		return 'ModelNode';

	}

	constructor( scope ) {

		super( scope );

	}

	update( frame ) {

		this.object3d = frame.object;

		super.update( frame );

	}

}

export default ModelNode;

export const modelDirection = nodeImmutable( ModelNode, ModelNode.DIRECTION );
export const modelWorldMatrix = nodeImmutable( ModelNode, ModelNode.WORLD_MATRIX );
export const modelPosition = nodeImmutable( ModelNode, ModelNode.POSITION );
export const modelScale = nodeImmutable( ModelNode, ModelNode.SCALE );
export const modelViewPosition = nodeImmutable( ModelNode, ModelNode.VIEW_POSITION );
export const modelNormalMatrix = uniform( new Matrix3() ).onObjectUpdate( ( { object }, self ) => self.value.getNormalMatrix( object.matrixWorld ) );
export const modelWorldMatrixInverse = uniform( new Matrix4() ).onObjectUpdate( ( { object }, self ) => self.value.copy( object.matrixWorld ).invert() );
export const modelViewMatrix = cameraViewMatrix.mul( modelWorldMatrix ).toVar( 'modelViewMatrix' );

export const highPrecisionModelViewMatrix = ( Fn( ( builder ) => {

	builder.context.isHighPrecisionModelViewMatrix = true;

	return uniform( 'mat4' ).onObjectUpdate( ( { object, camera } ) => {

		return object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );

	} );

} ).once() )().toVar( 'highPrecisionModelViewMatrix' );

export const highPrecisionModelNormalViewMatrix = ( Fn( ( builder ) => {

	const isHighPrecisionModelViewMatrix = builder.context.isHighPrecisionModelViewMatrix;

	return uniform( 'mat3' ).onObjectUpdate( ( { object, camera } ) => {

		if ( isHighPrecisionModelViewMatrix !== true ) {

			object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );

		}

		return object.normalMatrix.getNormalMatrix( object.modelViewMatrix );

	} );

} ).once() )().toVar( 'highPrecisionModelNormalMatrix' );
