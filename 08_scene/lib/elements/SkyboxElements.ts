import {TriangleElements} from "@awayjs/graphics";

/**
 * @class away.base.TriangleElements
 */
export class SkyboxElements extends TriangleElements
{
    public static assetType:string = "[asset SkyboxElements]";


    public get assetType():string
    {
        return SkyboxElements.assetType;
    }
}

import {Stage, ContextGLDrawMode, ContextGLProgramType, IContextGL, ShaderRegisterCache, ShaderRegisterData, ShaderRegisterElement} from "@awayjs/stage";

import {View} from "@awayjs/view";

import {RenderGroup} from "@awayjs/renderer";

import {Matrix3D, Vector3D, ProjectionBase} from "@awayjs/core";

import {_Stage_TriangleElements} from "@awayjs/graphics";

import {ShaderBase, _Render_RenderableBase, _Render_ElementsBase} from "@awayjs/renderer";


/**
 * @class away.pool.LineMaterialPool
 */
export class _Render_SkyboxElements extends _Render_ElementsBase
{
    public _includeDependencies(shader:ShaderBase):void
    {
    }

    /**
     * @inheritDoc
     */
    public _getVertexCode(shader:ShaderBase, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
    {
        var code:string = "";

        //get the projection coordinates
        var position:ShaderRegisterElement = (shader.globalPosDependencies > 0)? sharedRegisters.globalPositionVertex : sharedRegisters.animatedPosition;

        //reserving vertex constants for projection matrix
        var viewMatrixReg:ShaderRegisterElement = registerCache.getFreeVertexConstant();
        registerCache.getFreeVertexConstant();
        registerCache.getFreeVertexConstant();
        registerCache.getFreeVertexConstant();
        shader.viewMatrixIndex = viewMatrixReg.index*4;

        var scenePosition:ShaderRegisterElement = registerCache.getFreeVertexConstant();
        shader.scenePositionIndex = scenePosition.index*4;

        var skyboxScale:ShaderRegisterElement = registerCache.getFreeVertexConstant();

        var temp:ShaderRegisterElement = registerCache.getFreeVertexVectorTemp();

        code += "mul " + temp + ", " + position + ", " + skyboxScale + "\n" +
            "add " + temp + ", " + temp + ", " + scenePosition + "\n";

        if (shader.projectionDependencies > 0) {
            sharedRegisters.projectionFragment = registerCache.getFreeVarying();
            code += "m44 " + temp + ", " + temp + ", " + viewMatrixReg + "\n" +
                "mov " + sharedRegisters.projectionFragment + ", " + temp + "\n" +
                "mov op, " + temp + "\n";
        } else {
            code += "m44 op, " + temp + ", " + viewMatrixReg + "\n";
        }

        return code;
    }

    public _getFragmentCode(shader:ShaderBase, registerCache:ShaderRegisterCache, sharedRegisters:ShaderRegisterData):string
    {
        return "";
    }
}

/**
 *
 * @class away.pool._Stage_SkyboxElements
 */
export class _Stage_SkyboxElements extends _Stage_TriangleElements
{
    private _skyboxProjection:Matrix3D = new Matrix3D();

    public draw(renderable:_Render_RenderableBase, shader:ShaderBase, view:View, count:number, offset:number):void
    {
        var index:number = shader.scenePositionIndex;
        var camPos:Vector3D = view.projection.transform.concatenatedMatrix3D.position;
        shader.vertexConstantData[index++] = 2*camPos.x;
        shader.vertexConstantData[index++] = 2*camPos.y;
        shader.vertexConstantData[index++] = 2*camPos.z;
        shader.vertexConstantData[index++] = 1;
        shader.vertexConstantData[index++] = shader.vertexConstantData[index++] = shader.vertexConstantData[index++] = view.projection.far/Math.sqrt(3);
        shader.vertexConstantData[index] = 1;

        var near:Vector3D = new Vector3D();

        this._skyboxProjection.copyFrom(view.viewMatrix3D);
        this._skyboxProjection.copyRowTo(2, near);

        var cx:number = near.x;
        var cy:number = near.y;
        var cz:number = near.z;
        var cw:number = -(near.x*camPos.x + near.y*camPos.y + near.z*camPos.z + Math.sqrt(cx*cx + cy*cy + cz*cz));

        var signX:number = cx >= 0? 1 : -1;
        var signY:number = cy >= 0? 1 : -1;

        var p:Vector3D = new Vector3D(signX, signY, 1, 1);

        var inverse:Matrix3D = this._skyboxProjection.clone();
        inverse.invert();

        var q:Vector3D = inverse.transformVector(p);

        this._skyboxProjection.copyRowTo(3, p);

        var a:number = (q.x*p.x + q.y*p.y + q.z*p.z + q.w*p.w)/(cx*q.x + cy*q.y + cz*q.z + cw*q.w);

        this._skyboxProjection.copyRowFrom(2, new Vector3D(cx*a, cy*a, cz*a, cw*a));

        //set constants
        if (shader.sceneMatrixIndex >= 0)
            shader.sceneMatrix.copyFrom(renderable.renderSceneTransform, true);

        shader.viewMatrix.copyFrom(this._skyboxProjection, true);

        var context:IContextGL = this._stage.context;
        context.setProgramConstantsFromArray(ContextGLProgramType.VERTEX, shader.vertexConstantData);
        context.setProgramConstantsFromArray(ContextGLProgramType.FRAGMENT, shader.fragmentConstantData);

        if (this._indices)
            this.getIndexBufferGL().draw(ContextGLDrawMode.TRIANGLES, 0, this.numIndices);
        else
            this._stage.context.drawVertices(ContextGLDrawMode.TRIANGLES, offset, count || this.numVertices);
    }
}

RenderGroup.registerElements(_Render_SkyboxElements, SkyboxElements);
Stage.registerAbstraction(_Stage_SkyboxElements, SkyboxElements);
