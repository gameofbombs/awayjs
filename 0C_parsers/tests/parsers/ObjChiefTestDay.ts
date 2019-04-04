import {BitmapImage2D}				from "awayjs-core/lib/image/BitmapImage2D";
import {Sampler2D}					from "awayjs-core/lib/image/Sampler2D";
import {LoaderEvent}					from "awayjs-core/lib/events/LoaderEvent";
import {Vector3D}						from "awayjs-core/lib/geom/Vector3D";
import {AssetLibrary}					from "awayjs-core/lib/library/AssetLibrary";
import {Loader}						from "awayjs-core/lib/library/Loader";
import {IAsset}						from "awayjs-core/lib/library/IAsset";
import {URLRequest}					from "awayjs-core/lib/net/URLRequest";
import {Debug}						from "awayjs-core/lib/utils/Debug";
import {RequestAnimationFrame}		from "awayjs-core/lib/utils/RequestAnimationFrame";

import {View}							from "awayjs-display/lib/View";
import {DisplayObjectContainer}		from "awayjs-display/lib/display/DisplayObjectContainer";
import {DirectionalLight}				from "awayjs-display/lib/display/DirectionalLight";
import {Sprite}						from "awayjs-display/lib/display/Sprite";
import {StaticLightPicker}			from "awayjs-display/lib/materials/lightpickers/StaticLightPicker";

import {DefaultRenderer}				from "awayjs-renderergl/lib/DefaultRenderer";

import {MethodMaterial}				from "awayjs-methodmaterials/lib/MethodMaterial";

import {OBJParser}					from "awayjs-parsers/lib/OBJParser";

/**
 * 
 */
class ObjChiefTestDay
{
	private view:View;
	private raf:RequestAnimationFrame;
	private sprites:Array<Sprite> = new Array<Sprite>();
	private mat:MethodMaterial;

	private terrainMaterial:MethodMaterial;

	private light:DirectionalLight;

	private spartan:DisplayObjectContainer = new DisplayObjectContainer();
	private terrain:Sprite;

	private spartanFlag:boolean = false;

	constructor()
	{
		Debug.LOG_PI_ERRORS = false;
		Debug.THROW_ERRORS = false;

		this.view = new View(new DefaultRenderer());
		this.view.camera.z = -50;
		this.view.camera.y = 20;
		this.view.camera.projection.near = 0.1;
		this.view.backgroundColor = 0xCEC8C6;

		this.raf = new RequestAnimationFrame(this.render, this);

		this.light = new DirectionalLight();
		this.light.color = 0xc1582d;
		this.light.direction = new Vector3D(1, 0, 0);
		this.light.ambient = 0.4;
		this.light.ambientColor = 0x85b2cd;
		this.light.diffuse = 2.8;
		this.light.specular = 1.8;
		this.view.scene.addChild(this.light);

		this.spartan.transform.scaleTo(.25, .25, .25);
		this.spartan.y = 0;
		this.view.scene.addChild(this.spartan);

		AssetLibrary.enableParser(OBJParser);

		var session:Loader;

		session = AssetLibrary.getLoader();
		session.addEventListener(LoaderEvent.LOAD_COMPLETE, (event:LoaderEvent) => this.onLoadComplete(event));
		session.load(new URLRequest('assets/Halo_3_SPARTAN4.obj'));

		session = AssetLibrary.getLoader();
		session.addEventListener(LoaderEvent.LOAD_COMPLETE, (event:LoaderEvent) => this.onLoadComplete(event));
		session.load(new URLRequest('assets/terrain.obj'));

		session = AssetLibrary.getLoader();
		session.addEventListener(LoaderEvent.LOAD_COMPLETE, (event:LoaderEvent) => this.onLoadComplete(event));
		session.load(new URLRequest('assets/masterchief_base.png'));

		session = AssetLibrary.getLoader();
		session.addEventListener(LoaderEvent.LOAD_COMPLETE, (event:LoaderEvent) => this.onLoadComplete(event));
		session.load(new URLRequest('assets/stone_tx.jpg'));

		window.onresize = (event:UIEvent) => this.onResize();

		this.raf.start();
	}

	private render()
	{
		if ( this.terrain)
			this.terrain.rotationY += 0.4;

		this.spartan.rotationY += 0.4;
		this.view.render();
	}

	public onLoadComplete(event:LoaderEvent)
	{
		var loader:Loader = event.target;
		var l:number = loader.baseDependency.assets.length;

		console.log('------------------------------------------------------------------------------');
		console.log('events.LoaderEvent.RESOURCE_COMPLETE', event, l, loader);
		console.log('------------------------------------------------------------------------------');

		var l:number = loader.baseDependency.assets.length;

		for (var c:number = 0; c < l; c++) {

			var d:IAsset = loader.baseDependency.assets[c];

			console.log( d.name , event.url);

			switch (d.assetType) {
				case Sprite.assetType:
					if (event.url =='assets/Halo_3_SPARTAN4.obj') {
						var sprite:Sprite = <Sprite> d;

						this.spartan.addChild(sprite);
						this.spartanFlag = true;
						this.sprites.push(sprite);
					} else if (event.url =='assets/terrain.obj') {
						this.terrain = <Sprite> d;
						this.terrain.y = 98;
						this.terrain.graphics.scaleUV(20, 20);
						this.view.scene.addChild(this.terrain);
					}

					break;
				case BitmapImage2D.assetType:
					if (event.url == 'assets/masterchief_base.png' ) {
						this.mat = new MethodMaterial(<BitmapImage2D> d);
						this.mat.style.sampler = new Sampler2D(true, true, false);
						this.mat.lightPicker = new StaticLightPicker([this.light]);
					} else if (event.url == 'assets/stone_tx.jpg') {
						this.terrainMaterial = new MethodMaterial(<BitmapImage2D> d);
						this.terrainMaterial.style.sampler = new Sampler2D(true, true, false);
						this.terrainMaterial.lightPicker = new StaticLightPicker([this.light]);
					}

					break;
			}
		}

		if (this.terrain && this.terrainMaterial)
			this.terrain.material = this.terrainMaterial;

		if (this.mat && this.spartanFlag)
			for (var c:number = 0; c < this.sprites.length; c++)
				this.sprites[c].material = this.mat;

		this.onResize();
	}

	public onResize(event:UIEvent = null)
	{
		this.view.y = 0;
		this.view.x = 0;

		this.view.width = window.innerWidth;
		this.view.height = window.innerHeight;
	}
}