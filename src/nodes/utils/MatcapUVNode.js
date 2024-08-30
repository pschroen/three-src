import { registerNode } from '../core/Node.js';
import TempNode from '../core/TempNode.js';
import { transformedNormalView } from '../accessors/Normal.js';
import { positionViewDirection } from '../accessors/Position.js';
import { nodeImmutable, vec2, vec3 } from '../tsl/TSLBase.js';

class MatcapUVNode extends TempNode {

	constructor() {

		super( 'vec2' );

	}

	setup() {

		const x = vec3( positionViewDirection.z, 0, positionViewDirection.x.negate() ).normalize();
		const y = positionViewDirection.cross( x );

		return vec2( x.dot( transformedNormalView ), y.dot( transformedNormalView ) ).mul( 0.495 ).add( 0.5 ); // 0.495 to remove artifacts caused by undersized matcap disks

	}

}

export default MatcapUVNode;

MatcapUVNode.type = registerNode( 'MatcapUV', MatcapUVNode );

export const matcapUV = nodeImmutable( MatcapUVNode );
