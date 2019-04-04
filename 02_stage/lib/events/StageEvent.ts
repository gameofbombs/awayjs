import {EventBase} from "@awayjs/core";

import {Stage} from "../Stage";

export class StageEvent extends EventBase
{
	/**
	 *
	 */
	public static STAGE_ERROR:string = "stageError";

	/**
	 *
	 */
	public static CONTEXT_CREATED:string = "contextCreated";

	/**
	 *
	 */
	public static CONTEXT_DISPOSED:string = "contextDisposed";

	/**
	 *
	 */
	public static CONTEXT_RECREATED:string = "contextRecreated";

	/**
	 *
	 */
	public static INVALIDATE_SIZE:string = "invalidateSize";

	private _stage:Stage;

	/**
	 *
	 */
	public get stage():Stage
	{
		return this._stage;
	}

	constructor(type:string, stage:Stage)
	{
		super(type);

		this._stage = stage;
	}

	/**
	 *
	 */
	public clone():StageEvent
	{
		return new StageEvent(this.type, this._stage);
	}
}