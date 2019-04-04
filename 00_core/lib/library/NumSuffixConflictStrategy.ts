import {ConflictStrategyBase}		from "../library/ConflictStrategyBase";
import {IAssetAdapter}					from "../library/IAssetAdapter";

export class NumSuffixConflictStrategy extends ConflictStrategyBase
{
	private _separator:string;
	private _next_suffix:Object;

	constructor(separator:string = '.')
	{
		super();

		this._separator = separator;
		this._next_suffix = {};
	}

	public resolveConflict(changedAsset:IAssetAdapter, oldAsset:IAssetAdapter, assetsDictionary:Object, precedence:string):void
	{
		var orig:string;
		var new_name:string;
		var base:string;
		var suffix:number;

		orig = changedAsset.adaptee.name;

		if (orig.indexOf(this._separator) >= 0) {
			// Name has an ocurrence of the separator, so get base name and suffix,
			// unless suffix is non-numerical, in which case revert to zero and
			// use entire name as base
			base = orig.substring(0, orig.lastIndexOf(this._separator));
			suffix = parseInt(orig.substring(base.length - 1));

			if (isNaN(suffix)) {
				base = orig;
				suffix = 0;
			}

		} else {
			base = orig;
			suffix = 0;
		}

		if (suffix == 0 && this._next_suffix.hasOwnProperty(base)) {

			suffix = this._next_suffix[base];

		}

		// Find the first suffixed name that does
		// not collide with other names.
		do {

			suffix++;

			new_name = base.concat(this._separator, suffix.toString());

		} while (assetsDictionary.hasOwnProperty(new_name));

		this._next_suffix[ base ] = suffix;
		this._pUpdateNames(oldAsset.adaptee.assetNamespace, new_name, oldAsset, changedAsset, assetsDictionary, precedence);

	}

	public create():ConflictStrategyBase
	{
		return new NumSuffixConflictStrategy(this._separator);
	}
}