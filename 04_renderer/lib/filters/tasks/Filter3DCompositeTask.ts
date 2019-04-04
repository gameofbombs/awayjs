import {ProjectionBase} from "@awayjs/core";

import {ContextGLProgramType, IContextGL, Stage, ShaderRegisterElement, Image2D, _Stage_ImageBase} from "@awayjs/stage";

import {Filter3DTaskBase} from "./Filter3DTaskBase";

export class Filter3DCompositeTask extends Filter3DTaskBase
{
	private _data:Float32Array;
	private _overlayTexture:Image2D;
	private _overlayWidth:number;
	private _overlayHeight:number;
	private _blendMode:string;
	
	private _overlayTextureIndex:number;
	private _exposureIndex:number;
	private _scalingIndex:number;
	
	constructor(blendMode:string, exposure:number = 1)
	{
		super();
		this._data = new Float32Array([exposure, 0.5, 2.0, -1, 0.0, 0.0, 0.0, 0.0 ]);
		this._blendMode = blendMode;
	}
	
	public get overlayTexture():Image2D
	{
		return this._overlayTexture;
	}
	
	public set overlayTexture(value:Image2D)
	{
		this._overlayTexture = value;
		this._overlayWidth = this._overlayTexture.width;
		this._overlayHeight = this._overlayTexture.height;
	}
	
	public get exposure():number
	{
		return this._data[0];
	}
	
	public set exposure(value:number)
	{
		this._data[0] = value;
	}
	
	public getFragmentCode():string
	{
		var temp1:ShaderRegisterElement = this._registerCache.getFreeFragmentVectorTemp();
		this._registerCache.addFragmentTempUsages(temp1, 1);
		var temp2:ShaderRegisterElement = this._registerCache.getFreeFragmentVectorTemp();
		this._registerCache.addFragmentTempUsages(temp2, 1);
		var temp3:ShaderRegisterElement = this._registerCache.getFreeFragmentVectorTemp();
		this._registerCache.addFragmentTempUsages(temp3, 1);
		var temp4:ShaderRegisterElement = this._registerCache.getFreeFragmentVectorTemp();
		this._registerCache.addFragmentTempUsages(temp4, 1);
		
		
		var inputTexture:ShaderRegisterElement = this._registerCache.getFreeTextureReg();
		this._inputTextureIndex = inputTexture.index;
		
		var overlayTexture:ShaderRegisterElement = this._registerCache.getFreeTextureReg();
		this._overlayTextureIndex = overlayTexture.index;
		
		var exposure:ShaderRegisterElement = this._registerCache.getFreeFragmentConstant();
		this._exposureIndex = exposure.index*4;

		var scaling:ShaderRegisterElement = this._registerCache.getFreeFragmentConstant();
		this._scalingIndex = scaling.index*4;
		
		var code:string;
		
		code = "tex " + temp1 + ", " + this._uvVarying + ", " + inputTexture + " <2d,linear,clamp>\n" +
			"mul " + temp2 + ", " + this._uvVarying + ", " + scaling + ".zw\n" +
			"add " + temp2 + ", " + temp2 + ", " + scaling + ".xy\n" +
			"tex " + temp2 + ", " + temp2 + ", " + overlayTexture + " <2d,linear,clamp>\n" +
			"mul " + temp2 + ", " + temp2 + ", " + exposure + ".xxx\n" +
			"add " + temp2 + ", " + temp2 + ", " + exposure + ".xxx\n";
		switch (this._blendMode) {
			case "multiply":
				code += "mul oc, " + temp1 + ", " + temp2 + "\n";
				break;
			case "add":
				code += "add oc, " + temp1 + ", " + temp2 + "\n";
				break;
			case "subtract":
				code += "sub oc, " + temp1 + ", " + temp2 + "\n";
				break;
			case "overlay":
				code += "sge " + temp3 + ", " + temp1 + ", " + exposure + ".yyy\n"; // t2 = (blend >= 0.5)? 1 : 0
				code += "sub " + temp1 + ", " + temp3 + ", " + temp1 + "\n"; // base = (1 : 0 - base)
				code += "sub " + temp2 + ", " + temp2 + ", " + temp3 + "\n"; // blend = (blend - 1 : 0)
				code += "mul " + temp2 + ", " + temp2 + ", " + temp1 + "\n"; // blend = blend * base
				code += "sub " + temp4 + ", " + temp3 + ", " + exposure + ".yyy\n"; // t3 = (blend >= 0.5)? 0.5 : -0.5
				code += "div " + temp2 + ", " + temp2 + ", " + temp4 + "\n"; // blend = blend / ( 0.5 : -0.5)
				code += "add oc, " + temp2 + ", " + temp3 + "\n";
				break;
			case "normal":
				// for debugging purposes
				code += "mov oc, " + temp1 + "\n";
				break;
			default:
				throw new Error("Unknown blend mode");
		}
		return code;
	}
	
	public activate(stage:Stage, projection:ProjectionBase, depthTexture:Image2D):void
	{
		this._data[4] = -0.5*(this._textureWidth - this._overlayWidth)/this._overlayWidth;
		this._data[5] = -0.5*(this._textureHeight - this._overlayHeight)/this._overlayHeight;

		this._data[6] = this._textureWidth/this._overlayWidth;
		this._data[7] = this._textureHeight/this._overlayHeight;

		var context:IContextGL = stage.context;
		context.setProgramConstantsFromArray(ContextGLProgramType.FRAGMENT, this._data);
		
		(<_Stage_ImageBase> stage.getAbstraction(this._overlayTexture)).activate(this._overlayTextureIndex);
	}
	
	public deactivate(stage:Stage):void
	{
		stage.context.setTextureAt(1, null);
	}
}