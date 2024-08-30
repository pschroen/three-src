import NodeMaterial, { registerNodeMaterial } from './NodeMaterial.js';

import { PointsMaterial } from '../PointsMaterial.js';

const _defaultValues = new PointsMaterial();

class PointsNodeMaterial extends NodeMaterial {

	constructor( parameters ) {

		super();

		this.isPointsNodeMaterial = true;

		this.lights = false;
		this.transparent = true;

		this.sizeNode = null;

		this.setDefaultValues( _defaultValues );

		this.setValues( parameters );

	}

	copy( source ) {

		this.sizeNode = source.sizeNode;

		return super.copy( source );

	}

}

export default PointsNodeMaterial;

PointsNodeMaterial.type = registerNodeMaterial( 'Points', PointsNodeMaterial );
