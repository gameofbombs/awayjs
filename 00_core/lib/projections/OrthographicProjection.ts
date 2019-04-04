import {Transform} from "../base/Transform";
import {Matrix3D} from "../geom/Matrix3D";
import {Vector3D} from "../geom/Vector3D";

import {ProjectionBase} from "./ProjectionBase";
import { CoordinateSystem } from './CoordinateSystem';

export class OrthographicProjection extends ProjectionBase
{
	constructor(scale:number = 1,  coordinateSystem:CoordinateSystem = CoordinateSystem.LEFT_HANDED)
	{
		super(coordinateSystem);

		this.scale = scale;
	}

	/**
	 * 
	 * @param position 
	 * @param target 
	 */
	public project(position:Vector3D, target:Vector3D = null):Vector3D
	{
		var v:Vector3D = this.viewMatrix3D.transformVector(position, target);

		v.x = v.x;
		v.y = -v.y;
		v.z = (v.z*(this._far - this._near) + this._far + this._near)/2;
		v.w = 1;

		return v;
	}

	/**
	 * 
	 * @param nX 
	 * @param nY 
	 * @param sZ 
	 * @param target 
	 */
	public unproject(nX:number, nY:number, sZ:number, target:Vector3D = null):Vector3D
	{
		if (target == null)
			target = new Vector3D();

		target.x = nX*sZ;
		target.y = -nY*sZ;
		target.z = (sZ*2 - this._far - this._near)/(this._far - this._near);
		target.w = 1;

		this.inverseViewMatrix3D.transformVector(target, target);

		target.w = 1;

		return target;
	}

	//@override
	public clone():ProjectionBase
	{
		var clone:OrthographicProjection = new OrthographicProjection(this.scale, this._coordinateSystem);

		clone._near = this._near;
		clone._far = this._far;
		clone._coordinateSystem = this._coordinateSystem;

		return clone;
	}

	//@override
	public _updateFrustumMatrix3D():void
	{
		super._updateFrustumMatrix3D();

		var raw:Float32Array = this._frustumMatrix3D._rawData;
		
		var scaleV:number = this._scale;
		var scaleH:number = this._scale/this._ratio;

		this._frustumRect.left = 0.5*(this._originX - 1)/scaleH;
		this._frustumRect.top = 0.5*(this._originY - 1)/scaleV;

		this._frustumRect.right = this._frustumRect.left + 1/scaleH;
		this._frustumRect.bottom = this._frustumRect.top + 1/scaleV;

		raw[0] = 2*scaleH; //2/(right - left);
		raw[5] = 2*scaleV; //2/(bottom - top);
		raw[12] = this._originX; //(right + left)/(right - left)
		raw[13] = this._originY; //(bottom + top)/(bottom - top);
		raw[10] = 2/(this._far - this._near);
		raw[14] = -(this._far + this._near)/(this._far - this._near);
		raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[8] = raw[9] = raw[11] = 0;
		raw[15] = 1;

		this._frustumMatrix3D.invalidatePosition();
	}

	protected _updateProperties():void
	{
		super._updateProperties();

		var rawData:Float32Array = this._frustumMatrix3D._rawData;

		this._near = -(rawData[14] + 1)/rawData[10];
		this._far = -(rawData[14] - 1)/rawData[10];
		this._originX = rawData[8];
		this._originY = rawData[9];
		this._scale = rawData[5]/2;
		this._ratio = 0.5*this._scale/rawData[0];
	}
}