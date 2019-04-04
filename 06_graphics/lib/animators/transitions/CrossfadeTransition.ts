import {AnimationNodeBase} from "@awayjs/renderer";

import {AnimatorBase} from "../AnimatorBase";

import {CrossfadeTransitionNode} from "./CrossfadeTransitionNode";

import {IAnimationTransition} from "./IAnimationTransition";

/**
 *
 */
export class CrossfadeTransition implements IAnimationTransition
{
	public blendSpeed:number = 0.5;

	constructor(blendSpeed:number)
	{
		this.blendSpeed = blendSpeed;
	}

	public getAnimationNode(animator:AnimatorBase, startNode:AnimationNodeBase, endNode:AnimationNodeBase, startBlend:number):AnimationNodeBase
	{
		var crossFadeTransitionNode:CrossfadeTransitionNode = new CrossfadeTransitionNode();
		crossFadeTransitionNode.inputA = startNode;
		crossFadeTransitionNode.inputB = endNode;
		crossFadeTransitionNode.blendSpeed = this.blendSpeed;
		crossFadeTransitionNode.startBlend = startBlend;

		return <AnimationNodeBase> crossFadeTransitionNode;
	}
}