window.onload = function () {
	var introduction = document.getElementById('introduction');
	var introductionwin = document.getElementById('introductionwin');
	var close = document.getElementById('close');

	introduction.onclick = function show() {
		introductionwin.style.display = "block";
	}

	close.onclick = function close() {
		introductionwin.style.display = "none";
	}
}
