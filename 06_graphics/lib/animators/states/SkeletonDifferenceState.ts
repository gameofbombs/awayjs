import {Quaternion, Vector3D} from "@awayjs/core";

import {JointPose} from "../data/JointPose";
import {Skeleton} from "../data/Skeleton";
import {SkeletonPose} from "../data/SkeletonPose";
import {SkeletonDifferenceNode} from "../nodes/SkeletonDifferenceNode";

import {AnimationStateBase} from "./AnimationStateBase";
import {ISkeletonAnimationState} from "./ISkeletonAnimationState";

import {AnimatorBase} from "../AnimatorBase";

/**
 *
 */
export class SkeletonDifferenceState extends AnimationStateBase implements ISkeletonAnimationState
{
	private _blendWeight:number = 0;
	private static _tempQuat:Quaternion = new Quaternion();
	private _skeletonAnimationNode:SkeletonDifferenceNode;
	private _skeletonPose:SkeletonPose = new SkeletonPose();
	private _skeletonPoseDirty:boolean = true;
	private _baseInput:ISkeletonAnimationState;
	private _differenceInput:ISkeletonAnimationState;

	/**
	 * Defines a fractional value between 0 and 1 representing the blending ratio between the base input (0) and difference input (1),
	 * used to produce the skeleton pose output.
	 *
	 * @see #baseInput
	 * @see #differenceInput
	 */
	public get blendWeight():number
	{
		return this._blendWeight;
	}

	public set blendWeight(value:number)
	{
		this._blendWeight = value;

		this._pPositionDeltaDirty = true;
		this._skeletonPoseDirty = true;
	}

	constructor(animator:AnimatorBase, skeletonAnimationNode:SkeletonDifferenceNode)
	{
		super(animator, skeletonAnimationNode);

		this._skeletonAnimationNode = skeletonAnimationNode;

		this._baseInput = <ISkeletonAnimationState> animator.getAnimationState(this._skeletonAnimationNode.baseInput);
		this._differenceInput = <ISkeletonAnimationState> animator.getAnimationState(this._skeletonAnimationNode.differenceInput);
	}

	/**
	 * @inheritDoc
	 */
	public phase(value:number):void
	{
		this._skeletonPoseDirty = true;

		this._pPositionDeltaDirty = true;

		this._baseInput.phase(value);
		this._baseInput.phase(value);
	}

	/**
	 * @inheritDoc
	 */
	public _pUpdateTime(time:number):void
	{
		this._skeletonPoseDirty = true;

		this._baseInput.update(time);
		this._differenceInput.update(time);

		super._pUpdateTime(time);
	}

	/**
	 * Returns the current skeleton pose of the animation in the clip based on the internal playhead position.
	 */
	public getSkeletonPose(skeleton:Skeleton):SkeletonPose
	{
		if (this._skeletonPoseDirty)
			this.updateSkeletonPose(skeleton);

		return this._skeletonPose;
	}

	/**
	 * @inheritDoc
	 */
	public _pUpdatePositionDelta():void
	{
		this._pPositionDeltaDirty = false;

		var deltA:Vector3D = this._baseInput.positionDelta;
		var deltB:Vector3D = this._differenceInput.positionDelta;

		this.positionDelta.x = deltA.x + this._blendWeight*deltB.x;
		this.positionDelta.y = deltA.y + this._blendWeight*deltB.y;
		this.positionDelta.z = deltA.z + this._blendWeight*deltB.z;
	}

	/**
	 * Updates the output skeleton pose of the node based on the blendWeight value between base input and difference input nodes.
	 *
	 * @param skeleton The skeleton used by the animator requesting the ouput pose.
	 */
	private updateSkeletonPose(skeleton:Skeleton):void
	{
		this._skeletonPoseDirty = false;

		var endPose:JointPose;
		var endPoses:Array<JointPose> = this._skeletonPose.jointPoses;
		var basePoses:Array<JointPose> = this._baseInput.getSkeletonPose(skeleton).jointPoses;
		var diffPoses:Array<JointPose> = this._differenceInput.getSkeletonPose(skeleton).jointPoses;
		var base:JointPose, diff:JointPose;
		var basePos:Vector3D, diffPos:Vector3D;
		var tr:Vector3D;
		var numJoints:number = skeleton.numJoints;

		// :s
		if (endPoses.length != numJoints)
			endPoses.length = numJoints;

		for (var i:number = 0; i < numJoints; ++i) {
			endPose = endPoses[i];

			if (endPose == null)
				endPose = endPoses[i] = new JointPose();

			base = basePoses[i];
			diff = diffPoses[i];
			basePos = base.translation;
			diffPos = diff.translation;

			SkeletonDifferenceState._tempQuat.multiply(diff.orientation, base.orientation);
			endPose.orientation.lerp(base.orientation, SkeletonDifferenceState._tempQuat, this._blendWeight);

			tr = endPose.translation;
			tr.x = basePos.x + this._blendWeight*diffPos.x;
			tr.y = basePos.y + this._blendWeight*diffPos.y;
			tr.z = basePos.z + this._blendWeight*diffPos.z;
		}
	}
}