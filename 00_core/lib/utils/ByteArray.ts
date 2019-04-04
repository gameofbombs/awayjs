import {ByteArrayBase}			from "../utils/ByteArrayBase";

export class ByteArray extends ByteArrayBase
{
	public maxlength:number;
	public arraybytes; //ArrayBuffer
	public unalignedarraybytestemp; //ArrayBuffer

	constructor(maxlength:number = 4)
	{
		super();
		this._mode = "Typed array";
		this.maxlength = Math.max((maxlength + 255) & (~255), 4);
		this.arraybytes = new ArrayBuffer(this.maxlength);
		this.unalignedarraybytestemp = new ArrayBuffer(16);
	}

	public ensureWriteableSpace(n:number):void
	{
		this.ensureSpace(n + this.position);
	}

	public setArrayBuffer(aBuffer:ArrayBuffer):void
	{
		this.ensureSpace(aBuffer.byteLength);

		this.length = aBuffer.byteLength;

		var inInt8AView:Int8Array = new Int8Array(aBuffer);
		var localInt8View:Int8Array = new Int8Array(this.arraybytes, 0, this.length);

		localInt8View.set(inInt8AView);

		this.position = 0;
	}

	public writeArrayBuffer(aBuffer:ArrayBuffer):void
	{
		this.ensureWriteableSpace(aBuffer.byteLength);

		var inInt8AView:Int8Array = new Int8Array(aBuffer);
		var localInt8View:Int8Array = new Int8Array(this.arraybytes, this.length, aBuffer.byteLength);
		localInt8View.set(inInt8AView);
		this.length += aBuffer.byteLength;
		this.position = this.length;

	}
	public writeByteArray(ba:ByteArray):void
	{
		this.ensureWriteableSpace(ba.length);

		var inInt8AView:Int8Array = new Int8Array(ba.arraybytes, 0, ba.length);
		var localInt8View:Int8Array = new Int8Array(this.arraybytes, this.length, ba.length);
		localInt8View.set(inInt8AView);
		this.length += ba.length;
		this.position = this.length;

	}
	public getBytesAvailable():number
	{
		return ( this.length ) - ( this.position );
	}

	public ensureSpace(n:number):void
	{
		if (n > this.maxlength) {
			var newmaxlength:number = (n + 255) & (~255);
			var newarraybuffer = new ArrayBuffer(newmaxlength);
			var view = new Uint8Array(this.arraybytes, 0, this.length);
			var newview = new Uint8Array(newarraybuffer, 0, this.length);
			newview.set(view);      // memcpy
			this.arraybytes = newarraybuffer;
			this.maxlength = newmaxlength;
		}
	}


	public writeObject(object:any):void
	{
		console.log("writeObject not implemented yet in core/ByteArray");
	}
	public readObject():any
	{
		console.log("readObject not implemented yet in core/ByteArray");
		return {};
	}
	public writeByte(b:number):void
	{
		this.ensureWriteableSpace(1);

		var view = new Int8Array(this.arraybytes);
		view[ this.position++ ] = (~~b); // ~~ is cast to int in js...
		if (this.position > this.length) {
			this.length = this.position;
		}
	}

	public readByte():number
	{
		if (this.position >= this.length)
			throw "ByteArray out of bounds read. Positon=" + this.position + ", Length=" + this.length;

		var view = new Int8Array(this.arraybytes);

		return view[ this.position++ ];
	}

	public readBytes(bytes:ByteArray, offset:number = 0, length:number = 0):void
	{
		if (length == null)
			length = bytes.length;

		bytes.ensureWriteableSpace(offset + length);

		var byteView:Int8Array = new Int8Array(bytes.arraybytes);
		var localByteView:Int8Array = new Int8Array(this.arraybytes);

		byteView.set(localByteView.subarray(this.position, this.position + length), offset);

		this.position += length;

		if (length + offset > bytes.length)
			bytes.length += ( length + offset ) - bytes.length;
	}

	public writeUnsignedByte(b:number):void
	{
		this.ensureWriteableSpace(1);

		var view = new Uint8Array(this.arraybytes);
		view[this.position++] = (~~b) & 0xff; // ~~ is cast to int in js...

		if (this.position > this.length)
			this.length = this.position;
	}

	public readUnsignedByte():number
	{
		if (this.position >= this.length)
			throw "ByteArray out of bounds read. Positon=" + this.position + ", Length=" + this.length;

		var view = new Uint8Array(this.arraybytes);
		return view[this.position++];
	}

	public writeUnsignedShort(b:number):void
	{
		this.ensureWriteableSpace(2);

		if (( this.position & 1 ) == 0) {
			var view = new Uint16Array(this.arraybytes);
			view[ this.position >> 1 ] = (~~b) & 0xffff; // ~~ is cast to int in js...
		} else {
			var view = new Uint16Array(this.unalignedarraybytestemp, 0, 1);
			view[0] = (~~b) & 0xffff;
			var view2 = new Uint8Array(this.arraybytes, this.position, 2);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 2);
			view2.set(view3);
		}

		this.position += 2;

		if (this.position > this.length)
			this.length = this.position;
	}

	public readUTFBytes(len:number):string
	{
		var value:string = "";
		var max:number = this.position + len;
		var data:DataView = new DataView(this.arraybytes);
		// utf8-encode
		while (this.position < max) {

			var c:number = data.getUint8(this.position++);

			if (c < 0x80) {

				if (c == 0) break;
				value += String.fromCharCode(c);

			} else if (c < 0xE0) {

				value += String.fromCharCode(((c & 0x3F) << 6) | (data.getUint8(this.position++) & 0x7F));

			} else if (c < 0xF0) {

				var c2 = data.getUint8(this.position++);
				value += String.fromCharCode(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (data.getUint8(this.position++) & 0x7F));

			} else {

				var c2 = data.getUint8(this.position++);
				var c3 = data.getUint8(this.position++);

				value += String.fromCharCode(((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 << 6) & 0x7F) | (data.getUint8(this.position++) & 0x7F));

			}

		}

		return value;
	}

	public writeUTFBytes(s:string) {
		var escstr = encodeURIComponent(s);
		var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
			return String.fromCharCode(parseInt('0x' + p1));
		});

		this.ensureWriteableSpace(4+binstr.length);
		this.writeInt(binstr.length);
		for (var i=0; i<binstr.length; i++){
			this.writeUnsignedByte(binstr.charCodeAt(i)); //todo: there are probably faster ways to do this
		}
		if(binstr.length%4){
			var paddingbytes:number=binstr.length%4;
			for (var i=0; i<paddingbytes; i++){
				this.writeUnsignedByte(0);
			}

		}
		return binstr.length;
	}
	public readInt():number
	{
		var data:DataView = new DataView(this.arraybytes);
		var int:number = data.getInt32(this.position, true);

		this.position += 4;

		return int;
	}

	public readShort():number
	{
		var data:DataView = new DataView(this.arraybytes);
		var short:number = data.getInt16(this.position, true);

		this.position += 2;

		return short;
	}

	public readDouble():number
	{
		var data:DataView = new DataView(this.arraybytes);
		var double:number = data.getFloat64(this.position, true);

		this.position += 8;

		return double;
	}

	public readUnsignedShort():number
	{
		if (this.position > this.length + 2)
			throw "ByteArray out of bounds read. Position=" + this.position + ", Length=" + this.length;

		if (( this.position & 1 ) == 0) {
			var view = new Uint16Array(this.arraybytes);
			var pa:number = this.position >> 1;
			this.position += 2;
			return view[ pa ];
		} else {
			var view = new Uint16Array(this.unalignedarraybytestemp, 0, 1);
			var view2 = new Uint8Array(this.arraybytes, this.position, 2);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 2);
			view3.set(view2);
			this.position += 2;
			return view[0];
		}
	}

	public writeUnsignedInt(b:number):void
	{
		this.ensureWriteableSpace(4);

		if (( this.position & 3 ) == 0) {
			var view = new Uint32Array(this.arraybytes);
			view[ this.position >> 2 ] = (~~b) & 0xffffffff; // ~~ is cast to int in js...
		} else {
			var view = new Uint32Array(this.unalignedarraybytestemp, 0, 1);
			view[0] = (~~b) & 0xffffffff;
			var view2 = new Uint8Array(this.arraybytes, this.position, 4);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);
			view2.set(view3);
		}
		this.position += 4;

		if (this.position > this.length)
			this.length = this.position;
	}

	public writeInt(b:number):void
	{
		this.ensureWriteableSpace(4);

		if (( this.position & 3 ) == 0) {
			var view = new Int32Array(this.arraybytes);
			view[ this.position >> 2 ] = (~~b); // ~~ is cast to int in js...
		} else {
			var view = new Int32Array(this.unalignedarraybytestemp, 0, 1);
			view[0] = (~~b);
			var view2 = new Uint8Array(this.arraybytes, this.position, 4);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);
			view2.set(view3);
		}
		this.position += 4;

		if (this.position > this.length)
			this.length = this.position;
	}

	public readUnsignedInt():number
	{
		if (this.position > this.length + 4)
			throw "ByteArray out of bounds read. Position=" + this.position + ", Length=" + this.length;

		if (( this.position & 3 ) == 0) {
			var view = new Uint32Array(this.arraybytes);
			var pa:number = this.position >> 2;
			this.position += 4;
			return view[ pa ];
		} else {
			var view = new Uint32Array(this.unalignedarraybytestemp, 0, 1);
			var view2 = new Uint8Array(this.arraybytes, this.position, 4);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);
			view3.set(view2);
			this.position += 4;
			return view[0];
		}
	}

	public writeFloat(b:number):void
	{
		this.ensureWriteableSpace(4);

		if (( this.position & 3 ) == 0) {
			var view = new Float32Array(this.arraybytes);
			view[ this.position >> 2 ] = b;
		} else {
			var view = new Float32Array(this.unalignedarraybytestemp, 0, 1);
			view[0] = b;
			var view2 = new Uint8Array(this.arraybytes, this.position, 4);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);
			view2.set(view3);
		}
		this.position += 4;

		if (this.position > this.length)
			this.length = this.position;
	}

	public readFloat():number
	{
		if (this.position > this.length + 4)
			throw "ByteArray out of bounds read. Positon=" + this.position + ", Length=" + this.length;

		if ((this.position & 3) == 0) {
			var view = new Float32Array(this.arraybytes);
			var pa = this.position >> 2;
			this.position += 4;
			return view[pa];
		} else {
			var view = new Float32Array(this.unalignedarraybytestemp, 0, 1);
			var view2 = new Uint8Array(this.arraybytes, this.position, 4);
			var view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);
			view3.set(view2);
			this.position += 4;
			return view[ 0 ];
		}
	}
}