import {IEventDispatcher} from "@awayjs/core";

import {ShaderRegisterCache, ShaderRegisterData} from "@awayjs/stage";

import {View} from "@awayjs/view";

import {_Render_RenderableBase} from "./_Render_RenderableBase";
import {ShaderBase} from "./ShaderBase";

/**
 *
 * @class away.pool.Passes
 */
export interface IPass extends IEventDispatcher
{
	shader:ShaderBase;

    _includeDependencies(shader:ShaderBase);

    _initConstantData();

	/**
	 * Sets the material state for the pass that is independent of the rendered object. This needs to be called before
	 * calling pass. Before activating a pass, the previously used pass needs to be deactivated.
	 * @param stage The Stage object which is currently used for rendering.
	 * @param camera The camera from which the scene is viewed.
	 * @private
	 */
	_activate(view:View);

	_setRenderState(renderState:_Render_RenderableBase, view:View)

	/**
	 * Clears the surface state for the pass. This needs to be called before activating another pass.
	 * @param stage The Stage used for rendering
	 *
	 * @private
	 */
	_deactivate();

	invalidate();

	dispose();

    _getVertexCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string;

    _getFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string;

    _getPostAnimationFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string;

    _getNormalVertexCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string;

    _getNormalFragmentCode(registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string;
}