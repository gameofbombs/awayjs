import {Vector3D, ProjectionBase} from "@awayjs/core";

import {Stage, ContextGLVertexBufferFormat} from "@awayjs/stage";

import {ShaderBase, _Render_RenderableBase, AnimationRegisterData} from "@awayjs/renderer";

import {AnimationElements} from "../data/AnimationElements";
import {ParticlePropertiesMode} from "../data/ParticlePropertiesMode";
import {ParticleOscillatorNode} from "../nodes/ParticleOscillatorNode";

import {ParticleAnimator} from "../ParticleAnimator";

import {ParticleStateBase} from "./ParticleStateBase";

/**
 * ...
 */
export class ParticleOscillatorState extends ParticleStateBase
{
	/** @private */
	public static OSCILLATOR_INDEX:number = 0;

	private _particleOscillatorNode:ParticleOscillatorNode;
	private _oscillator:Vector3D;
	private _oscillatorData:Vector3D;

	/**
	 * Defines the default oscillator axis (x, y, z) and cycleDuration (w) of the state, used when in global mode.
	 */
	public get oscillator():Vector3D
	{
		return this._oscillator;
	}

	public set oscillator(value:Vector3D)
	{
		this._oscillator = value;

		this.updateOscillatorData();
	}

	constructor(animator:ParticleAnimator, particleOscillatorNode:ParticleOscillatorNode)
	{
		super(animator, particleOscillatorNode);

		this._particleOscillatorNode = particleOscillatorNode;
		this._oscillator = this._particleOscillatorNode._iOscillator;

		this.updateOscillatorData();
	}

	/**
	 * @inheritDoc
	 */
	public setRenderState(shader:ShaderBase, renderable:_Render_RenderableBase, animationElements:AnimationElements, animationRegisterData:AnimationRegisterData, projection:ProjectionBase, stage:Stage):void
	{
		var index:number = animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleOscillatorState.OSCILLATOR_INDEX);

		if (this._particleOscillatorNode.mode == ParticlePropertiesMode.LOCAL_STATIC)
			animationElements.activateVertexBuffer(index, this._particleOscillatorNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_4);
		else
			shader.setVertexConst(index, this._oscillatorData.x, this._oscillatorData.y, this._oscillatorData.z, this._oscillatorData.w);
	}

	private updateOscillatorData():void
	{
		if (this._particleOscillatorNode.mode == ParticlePropertiesMode.GLOBAL) {
			if (this._oscillator.w <= 0)
				throw(new Error("the cycle duration must greater than zero"));

			if (this._oscillatorData == null)
				this._oscillatorData = new Vector3D();

			this._oscillatorData.x = this._oscillator.x;
			this._oscillatorData.y = this._oscillator.y;
			this._oscillatorData.z = this._oscillator.z;
			this._oscillatorData.w = Math.PI*2/this._oscillator.w;
		}
	}
}