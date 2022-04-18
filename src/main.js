// let video = document.getElementById("videoInput"); // video is the id of video tag
// navigator.mediaDevices.getUserMedia({ video: true, audio: false })
//     .then(function(stream) {
//         video.srcObject = stream;
//         video.play();
//     })
//     .catch(function(err) {
//         console.log("An error occurred! " + err);
//     });

//     let src = new cv.Mat(height, width, cv.CV_8UC4);
//     let dst = new cv.Mat(height, width, cv.CV_8UC1);
//     let cap = new cv.VideoCapture(videoSource);
//     const FPS = 30;
//     function processVideo() {
//         let begin = Date.now();
//         cap.read(src);
//         cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
//         cv.imshow("canvasOutput", dst);
//         // schedule next one.
//         let delay = 1000/FPS - (Date.now() - begin);
//         setTimeout(processVideo, delay);
//     }
//     // schedule first one.
//     setTimeout(processVideo, 0);
function openCvReady() {
    cv['onRuntimeInitialized']=()=>{
        let video = document.getElementById("cam_input"); // video is the id of video tag
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function(err) {
            console.log("An error occurred! " + err);
        });
        let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        let gray = new cv.Mat();
        let cap = new cv.VideoCapture(video);
        let faces = new cv.RectVector();
        let classifier = new cv.CascadeClassifier();
        let utils = new Utils('errorMessage');
        let faceCascadeFile = 'haarcascade_frontalface_default.xml'; // path to xml
        utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
        classifier.load(faceCascadeFile); // in the callback, load the cascade from file 
    });
    const FPS = 24;
    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                gray.delete();
                faces.delete();
                classifier.delete();
                return;
            }

        let begin = Date.now();
        cap.read(src);
        src.copyTo(dst);
        cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
        classifier.detectMultiScale(gray, faces, 1.1, 3, 0);

        for (let i = 0; i < faces.size(); ++i) {
            let face = faces.get(i);
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
        }
        cv.imshow("canvas_output", dst);
        // schedule next one.
        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    }catch(err){
        utils.printError
    }
}
// schedule first one.
setTimeout(processVideo, 0);
  };
}

