import NodeMaterial, { addNodeMaterial } from './NodeMaterial.js';

import { LineBasicMaterial } from '../../materials/LineBasicMaterial.js';

const _defaultValues = new LineBasicMaterial();

class LineBasicNodeMaterial extends NodeMaterial {

	constructor( parameters ) {

		super();

		this.isLineBasicNodeMaterial = true;

		this.lights = false;
		this.normals = false;

		this.setDefaultValues( _defaultValues );

		this.setValues( parameters );

	}

}

export default LineBasicNodeMaterial;

addNodeMaterial( 'LineBasicNodeMaterial', LineBasicNodeMaterial );
