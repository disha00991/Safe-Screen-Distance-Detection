const utils = new Utils('errorMessage');
const imageUsed = document.getElementById('sample').getAttribute('src')
console.log(imageUsed)
const applyButton = document.getElementById('apply')
let ipd = 0; //inter pupillary distance
const setUpApplyButton = function () {
    utils.loadImageToCanvas(imageUsed, 'imageInit')
    let faceCascadeFile = 'haarcascade_frontalface_default.xml';
    let eyeCascadeFile = 'haarcascade_eye.xml';
    utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
        console.log('cascade ready to load.');
        let faceCascade = new cv.CascadeClassifier();
        let eyeCascade = new cv.CascadeClassifier();
        // load pre-trained classifiers
        faceCascade.load(faceCascadeFile);
        utils.createFileFromUrl(eyeCascadeFile, eyeCascadeFile, () => {
            console.log('eye cascade ready');            
            eyeCascade.load(eyeCascadeFile);
        
        
            let src = cv.imread('imageInit');
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
            let faces = new cv.RectVector();
            let eyes = new cv.RectVector();
            // detect faces
            let msize = new cv.Size(0, 0);
            try{
                faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
                console.log(faces.size());
            }catch(err){
                console.log(err);
            }
            
            for (let i = 0; i < faces.size(); ++i) {
                console.log(faces)
                let roiGray = gray.roi(faces.get(i));
                let roiSrc = src.roi(faces.get(i));
                
                try{
                    eyeCascade.detectMultiScale(roiGray, eyes);
                    console.log(eyes.size());
                }catch(err){
                    console.log(err);
                }

                for (let i = 2; i <=4; i=i+2) {
                    let point1 = new cv.Point(eyes.get(i).x, eyes.get(i).y);
                    let point2 = new cv.Point(eyes.get(i).x + eyes.get(i).width,
                    eyes.get(i).y + eyes.get(i).height);       
                    cv.rectangle(roiSrc, point1, point2, [0, 255, 255, 255]);                    
                }
                ipd = ((eyes.get(2).x - eyes.get(4).x)**2 + (eyes.get(2).y - eyes.get(4).y)**2)**0.5; // find interpupillary distance
                console.log("ipd: "+ipd);
                //ipd in pixels = 128.035 pixels
                roiGray.delete(); roiSrc.delete();
            }
            cv.imshow('imageResult', src);
            src.delete(); gray.delete(); faceCascade.delete();
        });
    }); 
}
applyButton.setAttribute('disabled','true')
applyButton.onclick = setUpApplyButton
utils.loadOpenCv(() => {
    
    setTimeout(function () { 
        applyButton.removeAttribute('disabled');
    },500)
});