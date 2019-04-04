import {IAsset, URLLoaderDataFormat, URLRequest, ParserBase, ParserUtils, ResourceDependency} from "@awayjs/core";

import {ImageUtils, ImageSampler, BitmapImage2D, AttributesBuffer} from "@awayjs/stage";

import {IMaterial} from "@awayjs/renderer";

import {Shape, Graphics, TriangleElements} from "@awayjs/graphics";

import {ImageTexture2D} from "@awayjs/materials";

import {DisplayObjectContainer, Sprite} from "@awayjs/scene";

import {MethodMaterial, MethodMaterialMode, SpecularBasicMethod} from "@awayjs/materials";

/**
 * OBJParser provides a parser for the OBJ data type.
 */
export class OBJParser extends ParserBase
{
	private _textData:string;
	private _startedParsing:boolean;
	private _charIndex:number;
	private _oldIndex:number;
	private _stringLength:number;
	private _currentObject:ObjectGroup;
	private _currentGroup:Group;
	private _currentMaterialGroup:MaterialGroup;
	private _objects:Array<ObjectGroup>;
	private _materialIDs:string[];
	private _materialLoaded:Array<LoadedMaterial>;
	private _materialSpecularData:Array<SpecularData>;
	private _sprites:Array<Sprite>;
	private _lastMtlID:string;
	private _objectIndex:number;
	private _realIndices;
	private _vertexIndex:number;
	private _vertices:Array<Vertex>;
	private _vertexNormals:Array<Vertex>;
	private _uvs:Array<UV>;
	private _scale:number;
	private _mtlLib:boolean;
	private _mtlLibLoaded:boolean = true;
	private _activeMaterialID:string = "";

	/**
	 * Creates a new OBJParser object.
	 * @param uri The url or id of the data or file to be parsed.
	 * @param extra The holder for extra contextual data that the parser might need.
	 */
	constructor(scale:number = 1)
	{
		super(URLLoaderDataFormat.TEXT);
		this._scale = scale;
	}

	/**
	 * Scaling factor applied directly to vertices data
	 * @param value The scaling factor.
	 */
	public set scale(value:number)
	{
		this._scale = value;
	}

	/**
	 * Indicates whether or not a given file extension is supported by the parser.
	 * @param extension The file extension of a potential file to be parsed.
	 * @return Whether or not the given file type is supported.
	 */
	public static supportsType(extension:string):boolean
	{
		extension = extension.toLowerCase();
		return extension == "obj";
	}

	/**
	 * Tests whether a data block can be parsed by the parser.
	 * @param data The data block to potentially be parsed.
	 * @return Whether or not the given data is supported.
	 */
	public static supportsData(data:any):boolean
	{
		var content:string = ParserUtils.toString(data);
		var hasV:boolean = false;
		var hasF:boolean = false;

		if (content) {
			hasV = content.indexOf("\nv ") != -1;
			hasF = content.indexOf("\nf ") != -1;
		}

		return hasV && hasF;
	}

	/**
	 * @inheritDoc
	 */
	public _iResolveDependency(resourceDependency:ResourceDependency):void
	{
		if (resourceDependency.id == 'mtl') {
			var str:string = ParserUtils.toString(resourceDependency.data);
			this.parseMtl(str);

		} else {
			var asset:IAsset;

			if (resourceDependency.assets.length != 1) {
				return;
			}

			asset = resourceDependency.assets[0];

			if (asset.isAsset(BitmapImage2D)) {

				var lm:LoadedMaterial = new LoadedMaterial();
				lm.materialID = resourceDependency.id;
				lm.texture = new ImageTexture2D(<BitmapImage2D> asset);

				this._materialLoaded.push(lm);

				if (this._sprites.length > 0) {
					this.applyMaterial(lm);
				}
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	public _iResolveDependencyFailure(resourceDependency:ResourceDependency):void
	{
		if (resourceDependency.id == "mtl") {
			this._mtlLib = false;
			this._mtlLibLoaded = false;
		} else {
			var lm:LoadedMaterial = new LoadedMaterial();
			lm.materialID = resourceDependency.id;
			this._materialLoaded.push(lm);
		}

		if (this._sprites.length > 0)
			this.applyMaterial(lm);
	}

	/**
	 * @inheritDoc
	 */
	public _pProceedParsing():boolean
	{
		var line:string;
		var creturn:string = String.fromCharCode(10);
		var trunk;

		if (!this._startedParsing) {
			this._textData = this._pGetTextData();
			// Merge linebreaks that are immediately preceeded by
			// the "escape" backward slash into single lines.
			this._textData = this._textData.replace(/\\[\r\n]+\s*/gm, ' ');
		}

		if (this._textData.indexOf(creturn) == -1)
			creturn = String.fromCharCode(13);

		if (!this._startedParsing) {
			this._startedParsing = true;
			this._vertices = new Array<Vertex>();
			this._vertexNormals = new Array<Vertex>();
			this._materialIDs = new Array<string>();
			this._materialLoaded = new Array<LoadedMaterial>();
			this._sprites = new Array<Sprite>();
			this._uvs = new Array<UV>();
			this._stringLength = this._textData.length;
			this._charIndex = this._textData.indexOf(creturn, 0);
			this._oldIndex = 0;
			this._objects = new Array<ObjectGroup>();
			this._objectIndex = 0;
		}

		while (this._charIndex < this._stringLength && this._pHasTime()) {
			this._charIndex = this._textData.indexOf(creturn, this._oldIndex);

			if (this._charIndex == -1)
				this._charIndex = this._stringLength;

			line = this._textData.substring(this._oldIndex, this._charIndex);
			line = line.split('\r').join("");
			line = line.replace("  ", " ");
			trunk = line.split(" ");
			this._oldIndex = this._charIndex + 1;
			this.parseLine(trunk);

			// If whatever was parsed on this line resulted in the
			// parsing being paused to retrieve dependencies, break
			// here and do not continue parsing until un-paused.
			if (this.parsingPaused) {
				return ParserBase.MORE_TO_PARSE;
			}

		}

		if (this._charIndex >= this._stringLength) {

			if (this._mtlLib && !this._mtlLibLoaded) {
				return ParserBase.MORE_TO_PARSE;
			}

			this.translate();
			this.applyMaterials();

			return ParserBase.PARSING_DONE;
		}

		return ParserBase.MORE_TO_PARSE;
	}

	public _pStartParsing(frameLimit:number):void
	{
		//create a content object for Loaders
		this._pContent = new DisplayObjectContainer();

		super._pStartParsing(frameLimit);
	}

	/**
	 * Parses a single line in the OBJ file.
	 */
	private parseLine(trunk):void
	{
		switch (trunk[0]) {

			case "mtllib":

				this._mtlLib = true;
				this._mtlLibLoaded = false;
				this.loadMtl(trunk[1]);

				break;

			case "g":

				this.createGroup(trunk);

				break;

			case "o":

				this.createObject(trunk);

				break;

			case "usemtl":

				if (this._mtlLib) {

					if (!trunk[1])
						trunk[1] = "def000";

					this._materialIDs.push(trunk[1]);
					this._activeMaterialID = trunk[1];

					if (this._currentGroup)
						this._currentGroup.materialID = this._activeMaterialID;
				}

				break;

			case "v":

				this.parseVertex(trunk);

				break;

			case "vt":

				this.parseUV(trunk);

				break;

			case "vn":

				this.parseVertexNormal(trunk);

				break;

			case "f":

				this.parseFace(trunk);

		}
	}

	/**
	 * Converts the parsed data into an Away3D scenegraph structure
	 */
	private translate():void
	{
		for (var objIndex:number = 0; objIndex < this._objects.length; ++objIndex) {
			var groups:Array<Group> = this._objects[objIndex].groups;
			var numGroups:number = groups.length;
			var materialGroups:Array<MaterialGroup>;
			var numMaterialGroups:number;
			var graphics:Graphics;
			var sprite:Sprite;

			var m:number;
			var sm:number;
			var bmMaterial:MethodMaterial;

			for (var g:number = 0; g < numGroups; ++g) {
				bmMaterial = new MethodMaterial(ImageUtils.getDefaultImage2D());

				//check for multipass
				if (this.materialMode >= 2)
					bmMaterial.mode = MethodMaterialMode.MULTI_PASS;

				sprite = new Sprite(bmMaterial);
				graphics = sprite.graphics;
				materialGroups = groups[g].materialGroups;
				numMaterialGroups = materialGroups.length;

				for (m = 0; m < numMaterialGroups; ++m)
					this.translateMaterialGroup(materialGroups[m], graphics);

				if (graphics.count == 0)
					continue;

				// Finalize and force type-based name
				this._pFinalizeAsset(<IAsset> graphics);//, "");

				if (this._objects[objIndex].name) {
					// this is a full independent object ('o' tag in OBJ file)
					sprite.name = this._objects[objIndex].name;

				} else if (groups[g].name) {

					// this is a group so the sub groups contain the actual sprite object names ('g' tag in OBJ file)
					sprite.name = groups[g].name;

				} else {
					// No name stored. Use empty string which will force it
					// to be overridden by finalizeAsset() to type default.
					sprite.name = "";
				}

				this._sprites.push(sprite);

				if (groups[g].materialID != "")
					bmMaterial.name = groups[g].materialID + "~" + sprite.name; else
					bmMaterial.name = this._lastMtlID + "~" + sprite.name;

				if (sprite.graphics.count > 1) {
					for (sm = 1; sm < sprite.graphics.count; ++sm)
						sprite.graphics.getShapeAt(sm).material = bmMaterial;
				}

				//add to the content property
				(<DisplayObjectContainer> this._pContent).addChild(sprite);

				this._pFinalizeAsset(<IAsset> sprite);
			}
		}
	}

	/**
	 * Translates an obj's material group to a subgraphics.
	 * @param materialGroup The material group data to convert.
	 * @param graphics The Graphics to contain the converted Elements.
	 */
	private translateMaterialGroup(materialGroup:MaterialGroup, graphics:Graphics):void
	{
		var faces:Array<FaceData> = materialGroup.faces;
		var face:FaceData;
		var numFaces:number = faces.length;
		var numVerts:number;
		var elements:TriangleElements;

		var vertices:Array<number> = new Array<number>();
		var uvs:Array<number> = new Array<number>();
		var normals:Array<number> = new Array<number>();
		var indices:Array<number> /*uint*/ = new Array<number>();

		this._realIndices = [];
		this._vertexIndex = 0;

		var j:number;
		for (var i:number = 0; i < numFaces; ++i) {

			face = faces[i];
			numVerts = face.indexIds.length - 1;

			for (j = 1; j < numVerts; ++j) {

				this.translateVertexData(face, j, vertices, uvs, indices, normals);
				this.translateVertexData(face, 0, vertices, uvs, indices, normals);
				this.translateVertexData(face, j + 1, vertices, uvs, indices, normals);
			}
		}
		if (vertices.length > 0) {
			elements = new TriangleElements(new AttributesBuffer());
			elements.autoDeriveNormals = normals.length? false : true;
			elements.setIndices(indices);
			elements.setPositions(vertices);
			elements.setNormals(normals);
			elements.setUVs(uvs);

			graphics.addShape(new Shape(elements));
		}
	}

	private translateVertexData(face:FaceData, vertexIndex:number, vertices:Array<number>, uvs:Array<number>, indices:Array<number> /*uint*/, normals:Array<number>):void
	{
		var index:number;
		var vertex:Vertex;
		var vertexNormal:Vertex;
		var uv:UV;

		if (!this._realIndices[face.indexIds[vertexIndex]]) {

			index = this._vertexIndex;
			this._realIndices[face.indexIds[vertexIndex]] = ++this._vertexIndex;
			vertex = this._vertices[face.vertexIndices[vertexIndex] - 1];
			vertices.push(vertex.x*this._scale, vertex.y*this._scale, vertex.z*this._scale);

			if (face.normalIndices.length > 0) {
				vertexNormal = this._vertexNormals[face.normalIndices[vertexIndex] - 1];
				normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
			}

			if (face.uvIndices.length > 0) {

				try {
					uv = this._uvs[face.uvIndices[vertexIndex] - 1];
					uvs.push(uv.u, uv.v);

				} catch (e) {

					switch (vertexIndex) {
						case 0:
							uvs.push(0, 1);
							break;
						case 1:
							uvs.push(.5, 0);
							break;
						case 2:
							uvs.push(1, 1);
					}
				}

			}

		} else {
			index = this._realIndices[face.indexIds[vertexIndex]] - 1;
		}

		indices.push(index);
	}

	/**
	 * Creates a new object group.
	 * @param trunk The data block containing the object tag and its parameters
	 */
	private createObject(trunk):void
	{
		this._currentGroup = null;
		this._currentMaterialGroup = null;
		this._objects.push(this._currentObject = new ObjectGroup());

		if (trunk)
			this._currentObject.name = trunk[1];
	}

	/**
	 * Creates a new group.
	 * @param trunk The data block containing the group tag and its parameters
	 */
	private createGroup(trunk):void
	{
		if (!this._currentObject)
			this.createObject(null);
		this._currentGroup = new Group();

		this._currentGroup.materialID = this._activeMaterialID;

		if (trunk)
			this._currentGroup.name = trunk[1];
		this._currentObject.groups.push(this._currentGroup);

		this.createMaterialGroup(null);
	}

	/**
	 * Creates a new material group.
	 * @param trunk The data block containing the material tag and its parameters
	 */
	private createMaterialGroup(trunk):void
	{
		this._currentMaterialGroup = new MaterialGroup();
		if (trunk)
			this._currentMaterialGroup.url = trunk[1];
		this._currentGroup.materialGroups.push(this._currentMaterialGroup);
	}

	/**
	 * Reads the next vertex coordinates.
	 * @param trunk The data block containing the vertex tag and its parameters
	 */
	private parseVertex(trunk):void
	{
		//for the very rare cases of other delimiters/charcodes seen in some obj files

		var v1:number, v2:number , v3:number;
		if (trunk.length > 4) {
			var nTrunk = [];
			var val:number;

			for (var i:number = 1; i < trunk.length; ++i) {
				val = parseFloat(trunk[i]);
				if (!isNaN(val))
					nTrunk.push(val);
			}

			v1 = <number> nTrunk[0];
			v2 = <number> nTrunk[1];
			v3 = <number> -nTrunk[2];
			this._vertices.push(new Vertex(v1, v2, v3));

		} else {
			v1 = <number> parseFloat(trunk[1]);
			v2 = <number> parseFloat(trunk[2]);
			v3 = <number> -parseFloat(trunk[3]);

			this._vertices.push(new Vertex(v1, v2, v3));
		}

	}

	/**
	 * Reads the next uv coordinates.
	 * @param trunk The data block containing the uv tag and its parameters
	 */
	private parseUV(trunk):void
	{
		if (trunk.length > 3) {
			var nTrunk = [];
			var val:number;
			for (var i:number = 1; i < trunk.length; ++i) {
				val = parseFloat(trunk[i]);
				if (!isNaN(val))
					nTrunk.push(val);
			}
			this._uvs.push(new UV(nTrunk[0], 1 - nTrunk[1]));

		} else {
			this._uvs.push(new UV(parseFloat(trunk[1]), 1 - parseFloat(trunk[2])));
		}

	}

	/**
	 * Reads the next vertex normal coordinates.
	 * @param trunk The data block containing the vertex normal tag and its parameters
	 */
	private parseVertexNormal(trunk):void
	{
		if (trunk.length > 4) {
			var nTrunk = [];
			var val:number;
			for (var i:number = 1; i < trunk.length; ++i) {
				val = parseFloat(trunk[i]);
				if (!isNaN(val))
					nTrunk.push(val);
			}
			this._vertexNormals.push(new Vertex(nTrunk[0], nTrunk[1], -nTrunk[2]));

		} else {
			this._vertexNormals.push(new Vertex(parseFloat(trunk[1]), parseFloat(trunk[2]), -parseFloat(trunk[3])));
		}
	}

	/**
	 * Reads the next face's indices.
	 * @param trunk The data block containing the face tag and its parameters
	 */
	private parseFace(trunk):void
	{
		var len:number = trunk.length;
		var face:FaceData = new FaceData();

		if (!this._currentGroup) {
			this.createGroup(null);
		}

		var indices;
		for (var i:number = 1; i < len; ++i) {

			if (trunk[i] == "") {
				continue;
			}

			indices = trunk[i].split("/");
			face.vertexIndices.push(this.parseIndex(parseInt(indices[0]), this._vertices.length));

			if (indices[1] && String(indices[1]).length > 0)
				face.uvIndices.push(this.parseIndex(parseInt(indices[1]), this._uvs.length));

			if (indices[2] && String(indices[2]).length > 0)
				face.normalIndices.push(this.parseIndex(parseInt(indices[2]), this._vertexNormals.length));

			face.indexIds.push(trunk[i]);
		}

		this._currentMaterialGroup.faces.push(face);
	}

	/**
	 * This is a hack around negative face coords
	 */
	private parseIndex(index:number, length:number):number
	{
		if (index < 0)
			return index + length + 1; else
			return index;
	}

	private parseMtl(data:string):void
	{
		var materialDefinitions = data.split('newmtl');
		var lines;
		var trunk;
		var j:number;

		var basicSpecularMethod:SpecularBasicMethod;
		var useSpecular:boolean;
		var useColor:boolean;
		var diffuseColor:number;
		var color:number;
		var specularColor:number;
		var specular:number;
		var alpha:number;
		var mapkd:string;

		for (var i:number = 0; i < materialDefinitions.length; ++i) {


			lines = (materialDefinitions[i].split('\r')).join("").split('\n');
			//lines = (materialDefinitions[i].split('\r') as Array).join("").split('\n');

			if (lines.length == 1)
				lines = materialDefinitions[i].split(String.fromCharCode(13));

			diffuseColor = color = specularColor = 0xFFFFFF;
			specular = 0;
			useSpecular = false;
			useColor = false;
			alpha = 1;
			mapkd = "";

			for (j = 0; j < lines.length; ++j) {

				lines[j] = lines[j].replace(/\s+$/, "");

				if (lines[j].substring(0, 1) != "#" && (j == 0 || lines[j] != "")) {
					trunk = lines[j].split(" ");

					if (String(trunk[0]).charCodeAt(0) == 9 || String(trunk[0]).charCodeAt(0) == 32)
						trunk[0] = trunk[0].substring(1, trunk[0].length);

					if (j == 0) {
						this._lastMtlID = trunk.join("");
						this._lastMtlID = (this._lastMtlID == "")? "def000" : this._lastMtlID;

					} else {

						switch (trunk[0]) {

							case "Ka":
								if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3])))
									color = trunk[1]*255 << 16 | trunk[2]*255 << 8 | trunk[3]*255;
								break;

							case "Ks":
								if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3]))) {
									specularColor = trunk[1]*255 << 16 | trunk[2]*255 << 8 | trunk[3]*255;
									useSpecular = true;
								}
								break;

							case "Ns":
								if (trunk[1] && !isNaN(Number(trunk[1])))
									specular = Number(trunk[1])*0.001;
								if (specular == 0)
									useSpecular = false;
								break;

							case "Kd":
								if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3]))) {
									diffuseColor = trunk[1]*255 << 16 | trunk[2]*255 << 8 | trunk[3]*255;
									useColor = true;
								}
								break;

							case "tr":
							case "d":
								if (trunk[1] && !isNaN(Number(trunk[1])))
									alpha = Number(trunk[1]);
								break;

							case "map_Kd":
								mapkd = this.parseMapKdString(trunk);
								mapkd = mapkd.replace(/\\/g, "/");
						}
					}
				}
			}

			if (mapkd != "") {

				if (useSpecular) {

					basicSpecularMethod = new SpecularBasicMethod();
					basicSpecularMethod.color = specularColor;
					basicSpecularMethod.strength = specular;

					var specularData:SpecularData = new SpecularData();
					specularData.alpha = alpha;
					specularData.basicSpecularMethod = basicSpecularMethod;
					specularData.materialID = this._lastMtlID;

					if (!this._materialSpecularData)
						this._materialSpecularData = new Array<SpecularData>();

					this._materialSpecularData.push(specularData);

				}

				this._pAddDependency(this._lastMtlID, new URLRequest(mapkd));

			} else if (useColor && !isNaN(color)) {

				var lm:LoadedMaterial = new LoadedMaterial();
				lm.materialID = this._lastMtlID;

				if (alpha == 0)
					console.log("Warning: an alpha value of 0 was found in mtl color tag (Tr or d) ref:" + this._lastMtlID + ", sprite(es) using it will be invisible!");

				var cm:MethodMaterial = new MethodMaterial(color);

				if (this.materialMode < 2) {
					cm.alpha = alpha;
				} else {
					cm.mode = MethodMaterialMode.MULTI_PASS;
				}

				cm.diffuseMethod.color = diffuseColor;

				if (useSpecular) {
					cm.specularMethod.color = specularColor;
					cm.specularMethod.strength = specular;
				}

				lm.cm = cm;

				this._materialLoaded.push(lm);

				if (this._sprites.length > 0)
					this.applyMaterial(lm);

			}
		}

		this._mtlLibLoaded = true;
	}

	private parseMapKdString(trunk):string
	{
		var url:string = "";
		var i:number;
		var breakflag:boolean;

		for (i = 1; i < trunk.length;) {
			switch (trunk[i]) {
				case "-blendu":
				case "-blendv":
				case "-cc":
				case "-clamp":
				case "-texres":
					i += 2; //Skip ahead 1 attribute
					break;
				case "-mm":
					i += 3; //Skip ahead 2 attributes
					break;
				case "-o":
				case "-s":
				case "-t":
					i += 4; //Skip ahead 3 attributes
					continue;
				default:
					breakflag = true;
					break;
			}

			if (breakflag)
				break;
		}

		//Reconstruct URL/filename
		for (i; i < trunk.length; i++) {
			url += trunk[i];
			url += " ";
		}

		//Remove the extraneous space and/or newline from the right side
		url = url.replace(/\s+$/, "");

		return url;
	}

	private loadMtl(mtlurl:string):void
	{
		// Add raw-data dependency to queue and load dependencies now,
		// which will pause the parsing in the meantime.
		this._pAddDependency('mtl', new URLRequest(mtlurl), null, null, true);
		this._pPauseAndRetrieveDependencies();//
	}

	private applyMaterial(lm:LoadedMaterial):void
	{
		var decomposeID;
		var sprite:Sprite;
		var tm:MethodMaterial;
		var j:number;
		var specularData:SpecularData;

		for (var i:number = 0; i < this._sprites.length; ++i) {
			sprite = this._sprites[i];
			decomposeID = sprite.material.name.split("~");

			if (decomposeID[0] == lm.materialID) {

				if (lm.cm) {
					if (sprite.material)
						sprite.material = null;
					sprite.material = lm.cm;

				} else if (lm.texture) {
					tm = <MethodMaterial > sprite.material;

					tm.ambientMethod.texture = lm.texture;
					tm.style.color = lm.color;
					tm.alpha = lm.alpha;
					tm.style.sampler = new ImageSampler(true);

					if (this.materialMode < 2) // if materialMode is 0 or 1, we create a SinglePass
						tm.alpha = lm.alpha;
					else
						tm.mode = MethodMaterialMode.MULTI_PASS;

					if (lm.specularMethod) {

						// By setting the specularMethod property to null before assigning
						// the actual method instance, we avoid having the properties of
						// the new method being overridden with the settings from the old
						// one, which is default behavior of the setter.
						tm.specularMethod = null;
						tm.specularMethod = lm.specularMethod;

					} else if (this._materialSpecularData) {

						for (j = 0; j < this._materialSpecularData.length; ++j) {
							specularData = this._materialSpecularData[j];

							if (specularData.materialID == lm.materialID) {
								tm.specularMethod = null; // Prevent property overwrite (see above)
								tm.specularMethod = specularData.basicSpecularMethod;
								tm.specularMethod.color = specularData.color;
								tm.specularMethod.strength = specularData.alpha;
								break;
							}
						}
					}
				}

				sprite.material.name = decomposeID[1]? decomposeID[1] : decomposeID[0];
				this._sprites.splice(i, 1);
				--i;
			}
		}

		if (lm.cm || tm)
			this._pFinalizeAsset(lm.cm || tm);
	}

	private applyMaterials():void
	{
		if (this._materialLoaded.length == 0)
			return;

		for (var i:number = 0; i < this._materialLoaded.length; ++i)
			this.applyMaterial(this._materialLoaded[i]);
	}
}

export class ObjectGroup
{
	public name:string;
	public groups:Group[] = new Array<Group>();
}

export class Group
{
	public name:string;
	public materialID:string;
	public materialGroups:MaterialGroup[] = new Array<MaterialGroup>();
}

export class MaterialGroup
{
	public url:string;
	public faces:FaceData[] = new Array<FaceData>();
}

export class SpecularData
{
	public materialID:string;
	public basicSpecularMethod:SpecularBasicMethod;
	public color:number = 0xFFFFFF;
	public alpha:number = 1;
}

export class LoadedMaterial
{
	public materialID:string;
	public texture:ImageTexture2D;
	public cm:IMaterial;
	public specularMethod:SpecularBasicMethod;
	public color:number = 0xFFFFFF;
	public alpha:number = 1;
}

export class FaceData
{
	public vertexIndices:Array<number> /*uint*/ = new Array<number>();
	public uvIndices:Array<number> /*uint*/ = new Array<number>();
	public normalIndices:Array<number> /*uint*/ = new Array<number>();
	public indexIds:string[] = new Array<string>(); // used for real index lookups
}

/**
* Texture coordinates value object.
*/
export class UV
{
	private _u:number;
	private _v:number;

	/**
	 * Creates a new <code>UV</code> object.
	 *
	 * @param    u        [optional]    The horizontal coordinate of the texture value. Defaults to 0.
	 * @param    v        [optional]    The vertical coordinate of the texture value. Defaults to 0.
	 */
	constructor(u:number = 0, v:number = 0)
	{
		this._u = u;
		this._v = v;
	}

	/**
	 * Defines the vertical coordinate of the texture value.
	 */
	public get v():number
	{
		return this._v;
	}

	public set v(value:number)
	{
		this._v = value;
	}

	/**
	 * Defines the horizontal coordinate of the texture value.
	 */
	public get u():number
	{
		return this._u;
	}

	public set u(value:number)
	{
		this._u = value;
	}

	/**
	 * returns a new UV value Object
	 */
	public clone():UV
	{
		return new UV(this._u, this._v);
	}

	/**
	 * returns the value object as a string for trace/debug purpose
	 */
	public toString():string
	{
		return this._u + "," + this._v;
	}
}

export class Vertex
{
	private _x:number;
	private _y:number;
	private _z:number;
	private _index:number;

	/**
	 * Creates a new <code>Vertex</code> value object.
	 *
	 * @param    x            [optional]    The x value. Defaults to 0.
	 * @param    y            [optional]    The y value. Defaults to 0.
	 * @param    z            [optional]    The z value. Defaults to 0.
	 * @param    index        [optional]    The index value. Defaults is NaN.
	 */
	constructor(x:number = 0, y:number = 0, z:number = 0, index:number = 0)
	{
		this._x = x;
		this._y = y;
		this._z = z;
		this._index = index;
	}

	/**
	 * To define/store the index of value object
	 * @param    ind        The index
	 */
	public set index(ind:number)
	{
		this._index = ind;
	}

	public get index():number
	{
		return this._index;
	}

	/**
	 * To define/store the x value of the value object
	 * @param    value        The x value
	 */
	public get x():number
	{
		return this._x;
	}

	public set x(value:number)
	{
		this._x = value;
	}

	/**
	 * To define/store the y value of the value object
	 * @param    value        The y value
	 */
	public get y():number
	{
		return this._y;
	}

	public set y(value:number)
	{
		this._y = value;
	}

	/**
	 * To define/store the z value of the value object
	 * @param    value        The z value
	 */
	public get z():number
	{
		return this._z;
	}

	public set z(value:number)
	{
		this._z = value;
	}

	/**
	 * returns a new Vertex value Object
	 */
	public clone():Vertex
	{
		return new Vertex(this._x, this._y, this._z);
	}
}