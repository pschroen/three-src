import { DataTexture, FloatType, RGBAFormat, Vector2, Vector3, LightsNode, NodeUpdateType } from 'three/webgpu';

import {
	attributeArray, nodeProxy, int, float, vec2, ivec2, ivec4, uniform, Break, Loop, positionView,
	Fn, If, Return, textureLoad, instanceIndex, screenCoordinate, directPointLight
} from 'three/tsl';

export const circleIntersectsAABB = Fn( ( [ circleCenter, radius, minBounds, maxBounds ] ) => {

	// Find the closest point on the AABB to the circle's center using method chaining
	const closestX = minBounds.x.max( circleCenter.x.min( maxBounds.x ) );
	const closestY = minBounds.y.max( circleCenter.y.min( maxBounds.y ) );

	// Compute the distance between the circle's center and the closest point
	const distX = circleCenter.x.sub( closestX );
	const distY = circleCenter.y.sub( closestY );

	// Calculate the squared distance
	const distSquared = distX.mul( distX ).add( distY.mul( distY ) );

	return distSquared.lessThanEqual( radius.mul( radius ) );

} ).setLayout( {
	name: 'circleIntersectsAABB',
	type: 'bool',
	inputs: [
		{ name: 'circleCenter', type: 'vec2' },
		{ name: 'radius', type: 'float' },
		{ name: 'minBounds', type: 'vec2' },
		{ name: 'maxBounds', type: 'vec2' }
	]
} );

const _vector3 = new Vector3();
const _size = new Vector2();

/**
 * A custom version of `LightsNode` implementing tiled lighting. This node is used in
 * {@link TiledLighting} to overwrite the renderer's default lighting with
 * a custom implementation.
 *
 * @augments LightsNode
 * @three_import import { tiledLights } from 'three/addons/tsl/lighting/TiledLightsNode.js';
 */
class TiledLightsNode extends LightsNode {

	static get type() {

		return 'TiledLightsNode';

	}

	/**
	 * Constructs a new tiled lights node.
	 *
	 * @param {number} [maxLights=1024] - The maximum number of lights.
	 * @param {number} [tileSize=32] - The tile size.
	 */
	constructor( maxLights = 1024, tileSize = 32 ) {

		super();

		this.materialLights = [];
		this.tiledLights = [];

		/**
		 * The maximum number of lights.
		 *
		 * @type {number}
		 * @default 1024
		 */
		this.maxLights = maxLights;

		/**
		 * The tile size.
		 *
		 * @type {number}
		 * @default 32
		 */
		this.tileSize = tileSize;

		this._bufferSize = null;
		this._lightIndexes = null;
		this._screenTileIndex = null;
		this._compute = null;
		this._lightsTexture = null;

		this._lightsCount = uniform( 0, 'int' );
		this._tileLightCount = 8;
		this._screenSize = uniform( new Vector2() );
		this._cameraProjectionMatrix = uniform( 'mat4' );
		this._cameraViewMatrix = uniform( 'mat4' );

		this.updateBeforeType = NodeUpdateType.RENDER;

	}

	customCacheKey() {

		return this._compute.getCacheKey() + super.customCacheKey();

	}

	updateLightsTexture() {

		const { _lightsTexture: lightsTexture, tiledLights } = this;

		const data = lightsTexture.image.data;
		const lineSize = lightsTexture.image.width * 4;

		this._lightsCount.value = tiledLights.length;

		for ( let i = 0; i < tiledLights.length; i ++ ) {

			const light = tiledLights[ i ];

			// world position

			_vector3.setFromMatrixPosition( light.matrixWorld );

			// store data

			const offset = i * 4;

			data[ offset + 0 ] = _vector3.x;
			data[ offset + 1 ] = _vector3.y;
			data[ offset + 2 ] = _vector3.z;
			data[ offset + 3 ] = light.distance;

			data[ lineSize + offset + 0 ] = light.color.r * light.intensity;
			data[ lineSize + offset + 1 ] = light.color.g * light.intensity;
			data[ lineSize + offset + 2 ] = light.color.b * light.intensity;
			data[ lineSize + offset + 3 ] = light.decay;

		}

		lightsTexture.needsUpdate = true;

	}

	updateBefore( frame ) {

		const { renderer, camera } = frame;

		this.updateProgram( renderer );

		this.updateLightsTexture( camera );

		this._cameraProjectionMatrix.value = camera.projectionMatrix;
		this._cameraViewMatrix.value = camera.matrixWorldInverse;

		renderer.getDrawingBufferSize( _size );
		this._screenSize.value.copy( _size );

		renderer.compute( this._compute );

	}

	setLights( lights ) {

		const { tiledLights, materialLights } = this;

		let materialindex = 0;
		let tiledIndex = 0;

		for ( const light of lights ) {

			if ( light.isPointLight === true ) {

				tiledLights[ tiledIndex ++ ] = light;

			} else {

				materialLights[ materialindex ++ ] = light;

			}

		}

		materialLights.length = materialindex;
		tiledLights.length = tiledIndex;

		return super.setLights( materialLights );

	}

	getBlock( block = 0 ) {

		return this._lightIndexes.element( this._screenTileIndex.mul( int( 2 ).add( int( block ) ) ) );

	}

	getTile( element ) {

		element = int( element );

		const stride = int( 4 );
		const tileOffset = element.div( stride );
		const tileIndex = this._screenTileIndex.mul( int( 2 ) ).add( tileOffset );

		return this._lightIndexes.element( tileIndex ).element( element.mod( stride ) );

	}

	getLightData( index ) {

		index = int( index );

		const dataA = textureLoad( this._lightsTexture, ivec2( index, 0 ) );
		const dataB = textureLoad( this._lightsTexture, ivec2( index, 1 ) );

		const position = dataA.xyz;
		const viewPosition = this._cameraViewMatrix.mul( position );
		const distance = dataA.w;
		const color = dataB.rgb;
		const decay = dataB.w;

		return {
			position,
			viewPosition,
			distance,
			color,
			decay
		};

	}

	setupLights( builder, lightNodes ) {

		this.updateProgram( builder.renderer );

		//

		const lightingModel = builder.context.reflectedLight;

		// force declaration order, before of the loop
		lightingModel.directDiffuse.toStack();
		lightingModel.directSpecular.toStack();

		super.setupLights( builder, lightNodes );

		Fn( () => {

			Loop( this._tileLightCount, ( { i } ) => {

				const lightIndex = this.getTile( i );

				If( lightIndex.equal( int( 0 ) ), () => {

					Break();

				} );

				const { color, decay, viewPosition, distance } = this.getLightData( lightIndex.sub( 1 ) );

				builder.lightsNode.setupDirectLight( builder, this, directPointLight( {
					color,
					lightVector: viewPosition.sub( positionView ),
					cutoffDistance: distance,
					decayExponent: decay
				} ) );

			} );

		}, 'void' )();

	}

	getBufferFitSize( value ) {

		const multiple = this.tileSize;

		return Math.ceil( value / multiple ) * multiple;

	}

	setSize( width, height ) {

		width = this.getBufferFitSize( width );
		height = this.getBufferFitSize( height );

		if ( ! this._bufferSize || this._bufferSize.width !== width || this._bufferSize.height !== height ) {

			this.create( width, height );

		}

		return this;

	}

	updateProgram( renderer ) {

		renderer.getDrawingBufferSize( _size );

		const width = this.getBufferFitSize( _size.width );
		const height = this.getBufferFitSize( _size.height );

		if ( this._bufferSize === null ) {

			this.create( width, height );

		} else if ( this._bufferSize.width !== width || this._bufferSize.height !== height ) {

			this.create( width, height );

		}

	}

	create( width, height ) {

		const { tileSize, maxLights } = this;

		const bufferSize = new Vector2( width, height );
		const lineSize = Math.floor( bufferSize.width / tileSize );
		const count = Math.floor( ( bufferSize.width * bufferSize.height ) / tileSize );

		// buffers

		const lightsData = new Float32Array( maxLights * 4 * 2 ); // 2048 lights, 4 elements(rgba), 2 components, 1 component per line (position, distance, color, decay)
		const lightsTexture = new DataTexture( lightsData, lightsData.length / 8, 2, RGBAFormat, FloatType );

		const lightIndexesArray = new Int32Array( count * 4 * 2 );
		const lightIndexes = attributeArray( lightIndexesArray, 'ivec4' ).setName( 'lightIndexes' );

		// compute

		const getBlock = ( index ) => {

			const tileIndex = instanceIndex.mul( int( 2 ) ).add( int( index ) );

			return lightIndexes.element( tileIndex );

		};

		const getTile = ( elementIndex ) => {

			elementIndex = int( elementIndex );

			const stride = int( 4 );
			const tileOffset = elementIndex.div( stride );
			const tileIndex = instanceIndex.mul( int( 2 ) ).add( tileOffset );

			return lightIndexes.element( tileIndex ).element( elementIndex.mod( stride ) );

		};

		const compute = Fn( () => {

			const { _cameraProjectionMatrix: cameraProjectionMatrix, _bufferSize: bufferSize, _screenSize: screenSize } = this;

			const tiledBufferSize = bufferSize.clone().divideScalar( tileSize ).floor();

			const tileScreen = vec2(
				instanceIndex.mod( tiledBufferSize.width ),
				instanceIndex.div( tiledBufferSize.width )
			).mul( tileSize ).div( screenSize );

			const blockSize = float( tileSize ).div( screenSize );
			const minBounds = tileScreen;
			const maxBounds = minBounds.add( blockSize );

			const index = int( 0 ).toVar();

			getBlock( 0 ).assign( ivec4( 0 ) );
			getBlock( 1 ).assign( ivec4( 0 ) );

			Loop( this.maxLights, ( { i } ) => {

				If( index.greaterThanEqual( this._tileLightCount ).or( int( i ).greaterThanEqual( int( this._lightsCount ) ) ), () => {

					Return();

				} );

				const { viewPosition, distance } = this.getLightData( i );

				const projectedPosition = cameraProjectionMatrix.mul( viewPosition );
				const ndc = projectedPosition.div( projectedPosition.w );
				const screenPosition = ndc.xy.mul( 0.5 ).add( 0.5 ).flipY();

				const distanceFromCamera = viewPosition.z;
				const pointRadius = distance.div( distanceFromCamera );

				If( circleIntersectsAABB( screenPosition, pointRadius, minBounds, maxBounds ), () => {

					getTile( index ).assign( i.add( int( 1 ) ) );
					index.addAssign( int( 1 ) );

				} );

			} );

		} )().compute( count );

		// screen coordinate lighting indexes

		const screenTile = screenCoordinate.div( tileSize ).floor().toVar();
		const screenTileIndex = screenTile.x.add( screenTile.y.mul( lineSize ) );

		// assigns

		this._bufferSize = bufferSize;
		this._lightIndexes = lightIndexes;
		this._screenTileIndex = screenTileIndex;
		this._compute = compute;
		this._lightsTexture = lightsTexture;

	}

	get hasLights() {

		return super.hasLights || this.tiledLights.length > 0;

	}

}

export default TiledLightsNode;

export const tiledLights = nodeProxy( TiledLightsNode );
