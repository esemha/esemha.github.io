var mode=null;	// encript vagy decript mód, nekünk ez mindig decrypt lessz, tehát minden encript kódot törölhetünk
var objFile=null;	// ez a fájl, ennek elérése hardcodeolva, u.abban a mappában mint az össze többi fájl

//drag and drop functions:
//https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
/*function drop_handler(ev) {	// drag&drop nem kell, a fájlelérés be lesz égetve
	console.log("Drop");
	ev.preventDefault();
	// If dropped items aren't files, reject them
	var dt = ev.dataTransfer;
	if (dt.items) {
		// Use DataTransferItemList interface to access the file(s)
		for (var i=0; i < dt.items.length; i++) {
			if (dt.items[i].kind == "file") {
				var f = dt.items[i].getAsFile();
				console.log("... file[" + i + "].name = " + f.name);
				objFile=f;
			}
		}
	} else {
		// Use DataTransfer interface to access the file(s)
		for (var i=0; i < dt.files.length; i++) {
			console.log("... file[" + i + "].name = " + dt.files[i].name);
		}  
			objFile=file[0];
	}		 
	displayfile()
	if(mode=='encrypt') { encvalidate(); } else if(mode=='decrypt') { decvalidate(); }
}*/

/*function dragover_handler(ev) {	// ez is drag&dropp cucc, nem kell
	console.log("dragOver");
	// Prevent default select and drag behavior
	ev.preventDefault();
}*/

/*function dragend_handler(ev) {	// ez is d&d, nem kell
	console.log("dragEnd");
	// Remove all of the drag data
	var dt = ev.dataTransfer;
	if (dt.items) {
		// Use DataTransferItemList interface to remove the drag data
		for (var i = 0; i < dt.items.length; i++) {
			dt.items.remove(i);
		}
	} else {
		// Use DataTransfer interface to remove the drag data
		ev.dataTransfer.clearData();
	}
}*/

/*function readfile(file){	// ez kell, ez olvassa be a fájlt
	//return new Promise((resolve, reject) => {
	//	var fr = new FileReader();  
	//	fr.onload = () => {
	//		resolve(fr.result )
	//	};
	//	fr.readAsArrayBuffer(file);
	//});
}*/

function loadEncryptedFile() {
	return new Promise((resolve, reject) => {
		try {
			const response = await fetch('text.txt.enc');  // Path to your encrypted file
			if (!response.ok) {
				throw new Error(`Failed to fetch file: ${response.status}`);
			}
			const encryptedBuffer = await response.arrayBuffer();  // Read the file as ArrayBuffer
			console.log('Encrypted Buffer:', encryptedBuffer);
			objFile=encryptedBuffer;
		} catch (error) {
			console.error('Error loading the encrypted file:', error);
		}
	});
}

async function decryptfile() {	// ez kell, ez a decryptelés
	btnDecrypt.disabled=true;
	await loadEncryptedFile();
	var cipherbytes=objFile;
	.catch(function(err){
		console.error(err);
	});	
	var cipherbytes=new Uint8Array(cipherbytes);

	var pbkdf2iterations=10000;
	var passphrasebytes=new TextEncoder("utf-8").encode(txtDecpassphrase.value);
	var pbkdf2salt=cipherbytes.slice(8,16);

	var passphrasekey=await window.crypto.subtle.importKey('raw', passphrasebytes, {name: 'PBKDF2'}, false, ['deriveBits'])
	.catch(function(err){
		console.error(err);

	});
	console.log('passphrasekey imported');

	var pbkdf2bytes=await window.crypto.subtle.deriveBits({"name": 'PBKDF2', "salt": pbkdf2salt, "iterations": pbkdf2iterations, "hash": 'SHA-256'}, passphrasekey, 384)		
	.catch(function(err){
		console.error(err);
	});
	console.log('pbkdf2bytes derived');
	pbkdf2bytes=new Uint8Array(pbkdf2bytes);

	keybytes=pbkdf2bytes.slice(0,32);
	ivbytes=pbkdf2bytes.slice(32);
	cipherbytes=cipherbytes.slice(16);

	var key=await window.crypto.subtle.importKey('raw', keybytes, {name: 'AES-CBC', length: 256}, false, ['decrypt']) 
	.catch(function(err){
		console.error(err);
	});
	console.log('key imported');		

	var plaintextbytes=await window.crypto.subtle.decrypt({name: "AES-CBC", iv: ivbytes}, key, cipherbytes)
	.catch(function(err){
		console.error(err);
	});

	if(!plaintextbytes) {
	 	spnDecstatus.classList.add("redspan");
		spnDecstatus.innerHTML='<p>Error decrypting file.  Password may be incorrect.</p>';
		return;
	}

	console.log('ciphertext decrypted');
	plaintextbytes=new Uint8Array(plaintextbytes);

	// letöltés nem kell, helyette az oldalon megjelenítjük
	var blob=new Blob([plaintextbytes], {type: 'application/download'});
	var blobUrl=URL.createObjectURL(blob);
	aDecsavefile.href=blobUrl;
	aDecsavefile.download=objFile.name + '.dec';

 	spnDecstatus.classList.add("greenspan");
	spnDecstatus.innerHTML='<p>File decrypted.</p>';
	aDecsavefile.hidden=false;
}
