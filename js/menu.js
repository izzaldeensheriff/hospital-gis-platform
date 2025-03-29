"use strict"

function menu2(){
	alert("menu 2");
}
function menu3(){
	alert ("menu 3");
}
function menu5(){
	alert ("menu 5");
}
function menu6(){
	alert ("menu 6");
}
function menu8(){
	alert ("menu 8");
}
function menu9(){
	alert ("menu 9");
}

/** function showDialog
 * 
 * function to open any dialog box based on its name
 */
function showDialog(dialogName) {
	let layerDialog = document.getElementById(dialogName);
	layerDialog.showModal();

}



/** 
 * function showLayerToLoad
 * 
 * function to open the dialog box
 */
function showLayerToLoad(e) {
	let layerDialog = document.getElementById("layerToLoad");
	layerDialog.showModal();

}


/** 
 * function showLayerList
 * 
 * function to open the dialog box
 */
function showLayerList(e) {
	let layerDialog = document.getElementById("allLayers");
	layerDialog.showModal();

}


/** 
 * function closeDialog
 * 
 * close the open dialog boxes
 */

function closeDialog(dialog){
	// close  open dialog boxe
	console.log(dialog.id);
	dialog.close();
}


/** 
 * function saveDialog
 * 
 * save the open dialog boxes
 * for now just read the content of any input boxes in the dialog
 * and alert as a name/value string
 * 
 */

function saveDialog(dialog){
	console.log(dialog.id);

	// read content then close any open dialog boxes for now - can adapt this code later on to actually save data
	let descendents = dialog.getElementsByTagName('*');
	console.log(descendents.length)
	let kvpairs = [];
	for ( let i = 0; i < descendents.length; i++ ) {
	   let e = descendents[i];
	   // ignore any elements if they don't have both an ID and a value
	   if (e.id && e.value) {
	   		kvpairs.push(encodeURIComponent(e.id) + "=" + encodeURIComponent(e.value));
	   }
	}
	let queryString = kvpairs.join("&");
	alert(queryString);
	dialog.close();
}



