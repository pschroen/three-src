import NodeMaterial, { registerNodeMaterial } from './NodeMaterial.js';

import { LineBasicMaterial } from '../LineBasicMaterial.js';

const _defaultValues = new LineBasicMaterial();

class LineBasicNodeMaterial extends NodeMaterial {

	constructor( parameters ) {

		super();

		this.isLineBasicNodeMaterial = true;

		this.lights = false;

		this.setDefaultValues( _defaultValues );

		this.setValues( parameters );

	}

}

export default LineBasicNodeMaterial;

LineBasicNodeMaterial.type = registerNodeMaterial( 'LineBasic', LineBasicNodeMaterial );
