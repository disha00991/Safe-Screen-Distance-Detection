const utils = new Utils('errorMessage');
const imageUsed = document.getElementById('sample').getAttribute('src')
console.log(imageUsed)
console.log("here 1")
const applyButton = document.getElementById('apply')
// applyButton.addEventListener("click")
const setUpApplyButton = function () {
    console.log("here");
    utils.loadImageToCanvas(imageUsed, 'imageInit')
    let faceCascadeFile = 'haarcascade_frontalface_default.xml';
    utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
        console.log('cascade ready to load.');
        
            let src = cv.imread('imageInit');
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
            let faces = new cv.RectVector();
            let faceCascade = new cv.CascadeClassifier();
            // load pre-trained classifiers
            faceCascade.load(faceCascadeFile);
            // detect faces
            let msize = new cv.Size(0, 0);
            faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
            console.dir(faceCascadeFile)
            for (let i = 0; i < faces.size(); ++i) {
                console.log(faces)
                let face = faces.get(i);
                let roiGray = gray.roi(face);
                let roiSrc = src.roi(face);
                let point1 = new cv.Point(face.x, face.y);
                let point2 = new cv.Point(face.x + face.width,
                                        face.y + face.height);
                cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
                roiGray.delete(); roiSrc.delete();

                console.log(face.width);

                // 15 inches
                const Measured_distance = 38.1;
                // width of face in the real world in centimeter
                const Known_width = 14.3;
                const focal_length = (face.width * Measured_distance) / Known_width;
                console.log("focal length is: "+focal_length+" pixels");

                // focal length found = 1081.72 pixels
                break;
            }
            cv.imshow('imageResult', src);
            src.delete(); gray.delete(); faceCascade.delete();
        }); 
}
//     applyButton.setAttribute('disabled','true')
    applyButton.onclick = setUpApplyButton
//     utils.loadOpenCv(() => {
        
//     setTimeout(function () { 
//         applyButton.removeAttribute('disabled');
//     },500)
// });