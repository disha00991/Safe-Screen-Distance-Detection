chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
    console.log("I was here!!!")
});

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Not adding `{ audio: true }` since we only want video now
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
        //video.src = window.URL.createObjectURL(stream);
        // video.srcObject = stream;
        // video.play();

        var modal = document.createElement('div');
        modal.setAttribute('class', "modal modal-close");
        modal.setAttribute("id", "myModal");
        modal.innerHTML = `
            <div class="modal-content">
              <span class="close">&times;</span>
              <p>Some text in the Modal..</p>
            </div>`;
        modal.style.display = "block";
        document.body.appendChild(modal);
        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("modal-close")[0];

        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    });
}