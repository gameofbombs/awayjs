import {Vector3D, MathConsts, ProjectionBase} from "@awayjs/core";

import {Stage, ContextGLVertexBufferFormat} from "@awayjs/stage";

import {ShaderBase, _Render_RenderableBase, AnimationRegisterData, IRenderEntity} from "@awayjs/renderer";

import {ParticleAnimationData} from "../data/ParticleAnimationData";
import {AnimationElements} from "../data/AnimationElements";
import {ParticleFollowNode} from "../nodes/ParticleFollowNode";

import {ParticleAnimator} from "../ParticleAnimator";

import {ParticleStateBase} from "./ParticleStateBase";

/**
 * ...
 */
export class ParticleFollowState extends ParticleStateBase
{
	/** @private */
	public static FOLLOW_POSITION_INDEX:number = 0;

	/** @private */
	public static FOLLOW_ROTATION_INDEX:number = 1;

	private _particleFollowNode:ParticleFollowNode;
	private _followTarget:IRenderEntity;

	private _targetPos:Vector3D = new Vector3D();
	private _targetEuler:Vector3D = new Vector3D();
	private _prePos:Vector3D;
	private _preEuler:Vector3D;
	private _smooth:boolean;

	//temporary vector3D for calculation
	private _temp:Vector3D = new Vector3D();

	constructor(animator:ParticleAnimator, particleFollowNode:ParticleFollowNode)
	{
		super(animator, particleFollowNode, true);

		this._particleFollowNode = particleFollowNode;
		this._smooth = particleFollowNode._iSmooth;
	}

	public get followTarget():IRenderEntity
	{
		return this._followTarget;
	}

	public set followTarget(value:IRenderEntity)
	{
		this._followTarget = value;
	}

	public get smooth():boolean
	{
		return this._smooth;
	}

	public set smooth(value:boolean)
	{
		this._smooth = value;
	}

	/**
	 * @inheritDoc
	 */
	public setRenderState(shader:ShaderBase, renderable:_Render_RenderableBase, animationElements:AnimationElements, animationRegisterData:AnimationRegisterData, projection:ProjectionBase, stage:Stage):void
	{
		if (this._followTarget) {
			if (this._particleFollowNode._iUsesPosition) {
				this._targetPos.x = this._followTarget.transform.position.x/renderable.sourceEntity.transform.scale.x;
				this._targetPos.y = this._followTarget.transform.position.y/renderable.sourceEntity.transform.scale.y;
				this._targetPos.z = this._followTarget.transform.position.z/renderable.sourceEntity.transform.scale.z;
			}
			if (this._particleFollowNode._iUsesRotation) {
				this._targetEuler.x = this._followTarget.transform.rotation.x;
				this._targetEuler.y = this._followTarget.transform.rotation.y;
				this._targetEuler.z = this._followTarget.transform.rotation.z;
			}
		}
		//initialization
		if (!this._prePos)
			this._prePos = this._targetPos.clone();
		if (!this._preEuler)
			this._preEuler = this._targetEuler.clone();

		var currentTime:number = this._pTime/1000;
		var previousTime:number = animationElements.previousTime;
		var deltaTime:number = currentTime - previousTime;

		var needProcess:boolean = previousTime != currentTime;

		if (this._particleFollowNode._iUsesPosition && this._particleFollowNode._iUsesRotation) {
			if (needProcess)
				this.processPositionAndRotation(currentTime, deltaTime, animationElements);

			animationElements.activateVertexBuffer(animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleFollowState.FOLLOW_POSITION_INDEX), this._particleFollowNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_3);
			animationElements.activateVertexBuffer(animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleFollowState.FOLLOW_ROTATION_INDEX), this._particleFollowNode._iDataOffset + 3, stage, ContextGLVertexBufferFormat.FLOAT_3);
		} else if (this._particleFollowNode._iUsesPosition) {
			if (needProcess)
				this.processPosition(currentTime, deltaTime, animationElements);

			animationElements.activateVertexBuffer(animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleFollowState.FOLLOW_POSITION_INDEX), this._particleFollowNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_3);
		} else if (this._particleFollowNode._iUsesRotation) {
			if (needProcess)
				this.precessRotation(currentTime, deltaTime, animationElements);

			animationElements.activateVertexBuffer(animationRegisterData.getRegisterIndex(this._pAnimationNode, ParticleFollowState.FOLLOW_ROTATION_INDEX), this._particleFollowNode._iDataOffset, stage, ContextGLVertexBufferFormat.FLOAT_3);
		}

		this._prePos.copyFrom(this._targetPos);
		this._targetEuler.copyFrom(this._targetEuler);
		animationElements.previousTime = currentTime;
	}

	private processPosition(currentTime:number, deltaTime:number, animationElements:AnimationElements):void
	{
		var data:Array<ParticleAnimationData> = animationElements.animationParticles;
		var vertexData:Float32Array = animationElements.vertexData;

		var changed:boolean = false;
		var len:number = data.length;
		var interpolatedPos:Vector3D;
		var posVelocity:Vector3D;
		if (this._smooth) {
			posVelocity = this._prePos.subtract(this._targetPos);
			posVelocity.scaleBy(1/deltaTime);
		} else
			interpolatedPos = this._targetPos;
		for (var i:number = 0; i < len; i++) {
			var k:number = (currentTime - data[i].startTime)/data[i].totalTime;
			var t:number = (k - Math.floor(k))*data[i].totalTime;
			if (t - deltaTime <= 0) {
				var inc:number = data[i].startVertexIndex*animationElements.totalLenOfOneVertex + this._particleFollowNode._iDataOffset;

				if (this._smooth) {
					this._temp.copyFrom(posVelocity);
					this._temp.scaleBy(t);
					interpolatedPos = this._targetPos.add(this._temp);
				}

				if (vertexData[inc] != interpolatedPos.x || vertexData[inc + 1] != interpolatedPos.y || vertexData[inc + 2] != interpolatedPos.z) {
					changed = true;
					for (var j:number = 0; j < data[i].numVertices; j++) {
						vertexData[inc++] = interpolatedPos.x;
						vertexData[inc++] = interpolatedPos.y;
						vertexData[inc++] = interpolatedPos.z;
					}
				}
			}
		}
		if (changed)
			animationElements.invalidateBuffer();

	}

	private precessRotation(currentTime:number, deltaTime:number, animationElements:AnimationElements):void
	{
		var data:Array<ParticleAnimationData> = animationElements.animationParticles;
		var vertexData:Float32Array = animationElements.vertexData;

		var changed:boolean = false;
		var len:number = data.length;

		var interpolatedRotation:Vector3D;
		var rotationVelocity:Vector3D;

		if (this._smooth) {
			rotationVelocity = this._preEuler.subtract(this._targetEuler);
			rotationVelocity.scaleBy(1/deltaTime);
		} else
			interpolatedRotation = this._targetEuler;

		for (var i:number = 0; i < len; i++) {
			var k:number = (currentTime - data[i].startTime)/data[i].totalTime;
			var t:number = (k - Math.floor(k))*data[i].totalTime;
			if (t - deltaTime <= 0) {
				var inc:number = data[i].startVertexIndex*animationElements.totalLenOfOneVertex + this._particleFollowNode._iDataOffset;

				if (this._smooth) {
					this._temp.copyFrom(rotationVelocity);
					this._temp.scaleBy(t);
					interpolatedRotation = this._targetEuler.add(this._temp);
				}

				if (vertexData[inc] != interpolatedRotation.x || vertexData[inc + 1] != interpolatedRotation.y || vertexData[inc + 2] != interpolatedRotation.z) {
					changed = true;
					for (var j:number = 0; j < data[i].numVertices; j++) {
						vertexData[inc++] = interpolatedRotation.x;
						vertexData[inc++] = interpolatedRotation.y;
						vertexData[inc++] = interpolatedRotation.z;
					}
				}
			}
		}
		if (changed)
			animationElements.invalidateBuffer();

	}

	private processPositionAndRotation(currentTime:number, deltaTime:number, animationElements:AnimationElements):void
	{
		var data:Array<ParticleAnimationData> = animationElements.animationParticles;
		var vertexData:Float32Array = animationElements.vertexData;

		var changed:boolean = false;
		var len:number = data.length;

		var interpolatedPos:Vector3D;
		var interpolatedRotation:Vector3D;

		var posVelocity:Vector3D;
		var rotationVelocity:Vector3D;
		if (this._smooth) {
			posVelocity = this._prePos.subtract(this._targetPos);
			posVelocity.scaleBy(1/deltaTime);
			rotationVelocity = this._preEuler.subtract(this._targetEuler);
			rotationVelocity.scaleBy(1/deltaTime);
		} else {
			interpolatedPos = this._targetPos;
			interpolatedRotation = this._targetEuler;
		}

		for (var i:number = 0; i < len; i++) {
			var k:number = (currentTime - data[i].startTime)/data[i].totalTime;
			var t:number = (k - Math.floor(k))*data[i].totalTime;
			if (t - deltaTime <= 0) {
				var inc:number = data[i].startVertexIndex*animationElements.totalLenOfOneVertex + this._particleFollowNode._iDataOffset;
				if (this._smooth) {
					this._temp.copyFrom(posVelocity);
					this._temp.scaleBy(t);
					interpolatedPos = this._targetPos.add(this._temp);

					this._temp.copyFrom(rotationVelocity);
					this._temp.scaleBy(t);
					interpolatedRotation = this._targetEuler.add(this._temp);
				}

				if (vertexData[inc] != interpolatedPos.x || vertexData[inc + 1] != interpolatedPos.y || vertexData[inc + 2] != interpolatedPos.z || vertexData[inc + 3] != interpolatedRotation.x || vertexData[inc + 4] != interpolatedRotation.y || vertexData[inc + 5] != interpolatedRotation.z) {
					changed = true;
					for (var j:number = 0; j < data[i].numVertices; j++) {
						vertexData[inc++] = interpolatedPos.x;
						vertexData[inc++] = interpolatedPos.y;
						vertexData[inc++] = interpolatedPos.z;
						vertexData[inc++] = interpolatedRotation.x;
						vertexData[inc++] = interpolatedRotation.y;
						vertexData[inc++] = interpolatedRotation.z;
					}
				}
			}
		}
		if (changed)
			animationElements.invalidateBuffer();
	}

}