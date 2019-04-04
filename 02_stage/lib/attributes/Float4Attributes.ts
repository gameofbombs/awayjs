import {AttributesBuffer} from "./AttributesBuffer";
import {AttributesView} from "./AttributesView";

export class Float4Attributes extends AttributesView
{
	public static assetType:string = "[attributes Float4Attributes]";

	/**
	 *
	 * @returns {string}
	 */
	public get assetType():string
	{
		return Float4Attributes.assetType;
	}

	/**
	 *
	 */
	constructor(length?:number);
	constructor(attributesBuffer?:AttributesBuffer);
	constructor(attributesBufferLength?:any)
	{
		super(Float32Array, 4, attributesBufferLength)
	}

	public set(array:Array<number>, offset?:number);
	public set(typedArray:Float32Array, offset?:number);
	public set(values:any, offset:number = 0):void
	{
		super.set(values, offset);
	}

	public get(count:number, offset:number = 0):Float32Array
	{
		return <Float32Array> super.get(count, offset);
	}

	public _internalClone(attributesBuffer:AttributesBuffer):Float4Attributes
	{
		return (this._cloneCache = new Float4Attributes(attributesBuffer));
	}

	public clone(attributesBuffer:AttributesBuffer = null):Float4Attributes
	{
		return <Float4Attributes> super.clone(attributesBuffer);
	}
}