import { ElementsBase } from '../../elements/ElementsBase';

import {VertexAnimator} from "../VertexAnimator";
import {VertexClipNode} from "../nodes/VertexClipNode";

import {AnimationClipState} from "./AnimationClipState";
import {IVertexAnimationState} from "./IVertexAnimationState";

import {AnimatorBase} from "../AnimatorBase";

/**
 *
 */
export class VertexClipState extends AnimationClipState implements IVertexAnimationState
{
	private _frames:Array<ElementsBase>;
	private _vertexClipNode:VertexClipNode;
	private _currentGraphics:ElementsBase;
	private _nextGraphics:ElementsBase;

	/**
	 * @inheritDoc
	 */
	public get currentElements():ElementsBase
	{
		if (this._pFramesDirty)
			this._pUpdateFrames();

		return this._currentGraphics;
	}

	/**
	 * @inheritDoc
	 */
	public get nextElements():ElementsBase
	{
		if (this._pFramesDirty)
			this._pUpdateFrames();

		return this._nextGraphics;
	}

	constructor(animator:AnimatorBase, vertexClipNode:VertexClipNode)
	{
		super(animator, vertexClipNode);

		this._vertexClipNode = vertexClipNode;
		this._frames = this._vertexClipNode.frames;
	}

	/**
	 * @inheritDoc
	 */
	public _pUpdateFrames():void
	{
		super._pUpdateFrames();

		this._currentGraphics = this._frames[this._pCurrentFrame];

		if (this._vertexClipNode.looping && this._pNextFrame >= this._vertexClipNode.lastFrame) {
			this._nextGraphics = this._frames[0];
			(<VertexAnimator> this._pAnimator).dispatchCycleEvent();
		} else
			this._nextGraphics = this._frames[this._pNextFrame];
	}

	/**
	 * @inheritDoc
	 */
	public _pUpdatePositionDelta():void
	{
		//TODO:implement positiondelta functionality for vertex animations
	}
}