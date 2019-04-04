import {ProjectionBase} from "@awayjs/core";

import {Stage, ContextGLVertexBufferFormat} from "@awayjs/stage";

import {ShaderBase, _Render_RenderableBase, AnimationRegisterData} from "@awayjs/renderer";

import {AnimationElements} from "../data/AnimationElements";
import {ParticlePropertiesMode} from "../data/ParticlePropertiesMode";
import {ParticleSpriteSheetNode} from "../nodes/ParticleSpriteSheetNode";

import {ParticleAnimator} from "../ParticleAnimator";

import {ParticleStateBase} from "./ParticleStateBase";

/**
 * ...
 */
export class ParticleSpriteSheetState extends ParticleStateBase
{
	/** @private */
	public static UV_INDEX_0:number = 0;

	/** @private */
	public static UV_INDEX_1:number = 1;

	private _particleSpriteSheetNode:ParticleSpriteSheetNode;
	private _usesCycle:boolean;
	private _usesPhase:boolean;
	private _totalFrames:number;
	private _numColumns:number;
	private _numRows:number;
	private _cycleDuration:number;
	private _cyclePhase:number;
	private _spriteSheetData:Array<number>;

	/**
	 * Defines the cycle phase, when in global mode. Defaults to zero.
	 */
	public get cyclePhase():number
	{
		return this._cyclePhase;
	}

	public set cyclePhase(value:number)
	{
		this._cyclePhase = value;

		this.updateSpriteSheetData();
	}

	/**
	 * Defines the cycle duration in seconds, when in global mode. Defaults to 1.
	 */
	public get cycleDuration():number
	{
		return this._cycleDuration;
	}

	public set cycleDuration(value:number)
	{
		this._cycleDuration = value;

		this.updateSpriteSheetData();
	}

	constructor(animator:ParticleAnimator, particleSpriteSheetNode:ParticleSpriteSheetNode)
	{
		super(animator, particleSpriteSheetNode);

		this._particleSpriteSheetNode = particleSpriteSheetNode;

		this._usesCycle = this._particleSpriteSheetNode._iUsesCycle;
		this._usesPhase = this._particleSpriteSheetNode._iUsesCycle;
		this._totalFrames = this._particleSpriteSheetNode._iTotalFrames;
		this._numColumns = this._particleSpriteSheetNode._iNumColumns;
		this._numRows = this._particleSpriteSheetNode._iNumRows;
		this._cycleDuration = this._particleSpriteSheetNode._iCycleDuration;
		this._cyclePhase = this._particleSpriteSheetNode._iCyclePhase;

		this.updateSpriteSheetData();
	}

	public setRenderState(shader:ShaderBase, renderable:_Render_RenderableBase, animationElements:AnimationElements, animationRegisterData:AnimationRegisterData, projection:ProjectionBase, stage:Stage):void
	{
		if (!shader.usesUVTransform) {
			shader.setVertexConst(animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleSpriteSheetState.UV_INDEX_0), this._spriteSheetData[0], this._spriteSheetData[1], this._spriteSheetData[2], this._spriteSheetData[3]);
			if (this._usesCycle) {
				var index:number = animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleSpriteSheetState.UV_INDEX_1);
				if (this._particleSpriteSheetNode.mode == ParticlePropertiesMode.LOCAL_STATIC) {
					if (this._usesPhase)
						animationElements.activateVertexBuffer(index, this._particleSpriteSheetNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_3);
					else
						animationElements.activateVertexBuffer(index, this._particleSpriteSheetNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_2);
				} else
					shader.setVertexConst(index, this._spriteSheetData[4], this._spriteSheetData[5]);
			}
		}
	}

	private updateSpriteSheetData():void
	{
		this._spriteSheetData = new Array<number>(8);

		var uTotal:number = this._totalFrames/this._numColumns;

		this._spriteSheetData[0] = uTotal;
		this._spriteSheetData[1] = 1/this._numColumns;
		this._spriteSheetData[2] = 1/this._numRows;

		if (this._usesCycle) {
			if (this._cycleDuration <= 0)
				throw(new Error("the cycle duration must be greater than zero"));
			this._spriteSheetData[4] = uTotal/this._cycleDuration;
			this._spriteSheetData[5] = this._cycleDuration;
			if (this._usesPhase)
				this._spriteSheetData[6] = this._cyclePhase;
		}
	}
}