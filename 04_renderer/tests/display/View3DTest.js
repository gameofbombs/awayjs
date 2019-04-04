"use strict";
var RequestAnimationFrame_1 = require("awayjs-core/lib/utils/RequestAnimationFrame");
var Debug_1 = require("awayjs-core/lib/utils/Debug");
var View_1 = require("awayjs-display/lib/View");
var PointLight_1 = require("awayjs-display/lib/display/PointLight");
var ElementsType_1 = require("awayjs-display/lib/graphics/ElementsType");
var PrimitiveTorusPrefab_1 = require("awayjs-display/lib/prefabs/PrimitiveTorusPrefab");
var BasicMaterial_1 = require("awayjs-display/lib/materials/BasicMaterial");
var DefaultRenderer_1 = require("awayjs-renderergl/lib/DefaultRenderer");
var View3DTest = (function () {
    function View3DTest() {
        var _this = this;
        Debug_1.Debug.THROW_ERRORS = false;
        Debug_1.Debug.LOG_PI_ERRORS = false;
        var l = 10;
        var radius = 1000;
        var matB = new BasicMaterial_1.BasicMaterial();
        this.meshes = new Array();
        this.light = new PointLight_1.PointLight();
        this.view = new View_1.View(new DefaultRenderer_1.DefaultRenderer());
        this.view.camera.z = 0;
        this.view.backgroundColor = 0x776655;
        this.torus = new PrimitiveTorusPrefab_1.PrimitiveTorusPrefab(matB, ElementsType_1.ElementsType.TRIANGLE, 150, 50, 32, 32, false);
        for (var c = 0; c < l; c++) {
            var t = Math.PI * 2 * c / l;
            var mesh = this.torus.getNewObject();
            mesh.x = Math.cos(t) * radius;
            mesh.y = 0;
            mesh.z = Math.sin(t) * radius;
            this.view.scene.addChild(mesh);
            this.meshes.push(mesh);
        }
        this.view.scene.addChild(this.light);
        this.raf = new RequestAnimationFrame_1.RequestAnimationFrame(this.tick, this);
        this.raf.start();
        this.resize(null);
        window.onresize = function (e) { return _this.resize(null); };
    }
    View3DTest.prototype.tick = function (e) {
        for (var c = 0; c < this.meshes.length; c++)
            this.meshes[c].rotationY += 2;
        this.view.camera.rotationY += .5;
        this.view.render();
    };
    View3DTest.prototype.resize = function (e) {
        this.view.y = 0;
        this.view.x = 0;
        this.view.width = window.innerWidth;
        this.view.height = window.innerHeight;
    };
    return View3DTest;
}());

//# sourceMappingURL=data:application/json;base64,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SSxDQUFDLEdBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFDakQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDO1FBRS9CLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRU0sMkJBQU0sR0FBYixVQUFjLENBQUM7UUFFZCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRWhCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUN2QyxDQUFDO0lBQ0YsaUJBQUM7QUFBRCxDQWxFQSxBQWtFQyxJQUFBIiwiZmlsZSI6ImRpc3BsYXkvVmlldzNEVGVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7UmVxdWVzdEFuaW1hdGlvbkZyYW1lfVx0XHRmcm9tIFwiYXdheWpzLWNvcmUvbGliL3V0aWxzL1JlcXVlc3RBbmltYXRpb25GcmFtZVwiO1xuaW1wb3J0IHtEZWJ1Z31cdFx0XHRcdFx0XHRmcm9tIFwiYXdheWpzLWNvcmUvbGliL3V0aWxzL0RlYnVnXCI7XG5cbmltcG9ydCB7Vmlld31cdFx0XHRcdFx0XHRcdGZyb20gXCJhd2F5anMtZGlzcGxheS9saWIvVmlld1wiO1xuaW1wb3J0IHtTcHJpdGV9XHRcdFx0XHRcdFx0ZnJvbSBcImF3YXlqcy1kaXNwbGF5L2xpYi9kaXNwbGF5L1Nwcml0ZVwiO1xuaW1wb3J0IHtQb2ludExpZ2h0fVx0XHRcdFx0XHRmcm9tIFwiYXdheWpzLWRpc3BsYXkvbGliL2Rpc3BsYXkvUG9pbnRMaWdodFwiO1xuaW1wb3J0IHtFbGVtZW50c1R5cGV9XHRcdFx0XHRcdGZyb20gXCJhd2F5anMtZGlzcGxheS9saWIvZ3JhcGhpY3MvRWxlbWVudHNUeXBlXCI7XG5pbXBvcnQge1ByaW1pdGl2ZVRvcnVzUHJlZmFifVx0XHRcdGZyb20gXCJhd2F5anMtZGlzcGxheS9saWIvcHJlZmFicy9QcmltaXRpdmVUb3J1c1ByZWZhYlwiO1xuaW1wb3J0IHtCYXNpY01hdGVyaWFsfVx0XHRcdFx0ZnJvbSBcImF3YXlqcy1kaXNwbGF5L2xpYi9tYXRlcmlhbHMvQmFzaWNNYXRlcmlhbFwiO1xuXG5pbXBvcnQge0RlZmF1bHRSZW5kZXJlcn1cdFx0XHRcdGZyb20gXCJhd2F5anMtcmVuZGVyZXJnbC9saWIvRGVmYXVsdFJlbmRlcmVyXCI7XG5cbmNsYXNzIFZpZXczRFRlc3Rcbntcblx0cHJpdmF0ZSB2aWV3OlZpZXc7XG5cdHByaXZhdGUgdG9ydXM6UHJpbWl0aXZlVG9ydXNQcmVmYWI7XG5cblx0cHJpdmF0ZSBsaWdodDpQb2ludExpZ2h0O1xuXHRwcml2YXRlIHJhZjpSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cdHByaXZhdGUgbWVzaGVzOkFycmF5PFNwcml0ZT47XG5cblx0Y29uc3RydWN0b3IoKVxuXHR7XG5cdFx0RGVidWcuVEhST1dfRVJST1JTID0gZmFsc2U7XG5cdFx0RGVidWcuTE9HX1BJX0VSUk9SUyA9IGZhbHNlO1xuXG5cdFx0dmFyIGw6bnVtYmVyID0gMTA7XG5cdFx0dmFyIHJhZGl1czpudW1iZXIgPSAxMDAwO1xuXHRcdHZhciBtYXRCOkJhc2ljTWF0ZXJpYWwgPSBuZXcgQmFzaWNNYXRlcmlhbCgpO1xuXG5cdFx0dGhpcy5tZXNoZXMgPSBuZXcgQXJyYXk8U3ByaXRlPigpO1xuXHRcdHRoaXMubGlnaHQgPSBuZXcgUG9pbnRMaWdodCgpO1xuXHRcdHRoaXMudmlldyA9IG5ldyBWaWV3KG5ldyBEZWZhdWx0UmVuZGVyZXIoKSk7XG5cdFx0dGhpcy52aWV3LmNhbWVyYS56ID0gMDtcblx0XHR0aGlzLnZpZXcuYmFja2dyb3VuZENvbG9yID0gMHg3NzY2NTU7XG5cdFx0dGhpcy50b3J1cyA9IG5ldyBQcmltaXRpdmVUb3J1c1ByZWZhYihtYXRCLCBFbGVtZW50c1R5cGUuVFJJQU5HTEUsIDE1MCwgNTAgLCAzMiAsIDMyICwgZmFsc2UpO1xuXG5cdFx0Zm9yICh2YXIgYzpudW1iZXIgPSAwOyBjIDwgbDsgYysrKSB7XG5cblx0XHRcdHZhciB0Om51bWJlcj1NYXRoLlBJICogMiAqIGMgLyBsO1xuXG5cdFx0XHR2YXIgbWVzaDpTcHJpdGUgPSA8U3ByaXRlPiB0aGlzLnRvcnVzLmdldE5ld09iamVjdCgpO1xuXHRcdFx0bWVzaC54ID0gTWF0aC5jb3ModCkqcmFkaXVzO1xuXHRcdFx0bWVzaC55ID0gMDtcblx0XHRcdG1lc2gueiA9IE1hdGguc2luKHQpKnJhZGl1cztcblxuXHRcdFx0dGhpcy52aWV3LnNjZW5lLmFkZENoaWxkKG1lc2gpO1xuXHRcdFx0dGhpcy5tZXNoZXMucHVzaChtZXNoKTtcblxuXHRcdH1cblxuXHRcdHRoaXMudmlldy5zY2VuZS5hZGRDaGlsZCh0aGlzLmxpZ2h0KTtcblxuXHRcdHRoaXMucmFmID0gbmV3IFJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2ssIHRoaXMpO1xuXHRcdHRoaXMucmFmLnN0YXJ0KCk7XG5cdFx0dGhpcy5yZXNpemUoIG51bGwgKTtcblxuXHRcdHdpbmRvdy5vbnJlc2l6ZSA9IChlKSA9PiB0aGlzLnJlc2l6ZShudWxsKTtcblxuXHR9XG5cblx0cHJpdmF0ZSB0aWNrKGUpXG5cdHtcblx0XHRmb3IgKHZhciBjOm51bWJlciA9IDA7IGMgPCB0aGlzLm1lc2hlcy5sZW5ndGg7IGMrKylcblx0XHRcdHRoaXMubWVzaGVzW2NdLnJvdGF0aW9uWSArPSAyO1xuXG5cdFx0dGhpcy52aWV3LmNhbWVyYS5yb3RhdGlvblkgKz0gLjU7XG5cdFx0dGhpcy52aWV3LnJlbmRlcigpO1xuXHR9XG5cblx0cHVibGljIHJlc2l6ZShlKVxuXHR7XG5cdFx0dGhpcy52aWV3LnkgPSAwO1xuXHRcdHRoaXMudmlldy54ID0gMDtcblxuXHRcdHRoaXMudmlldy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdHRoaXMudmlldy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii4vdGVzdHMifQ==
