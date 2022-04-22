function openCvReady() {
  let start = Date.now();
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
    let cap = new cv.VideoCapture(cam_input);
    let faces = new cv.RectVector();
    let eyes = new cv.RectVector();
    let face_cascade = new cv.CascadeClassifier();
    let eye_cascade = new cv.CascadeClassifier();
    let eyeCascadeFile = 'haarcascade_eye.xml';
    let utils = new Utils('errorMessage');
    let faceCascadeFile = 'haarcascade_frontalface_default.xml'; // path to xml
    utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
        face_cascade.load(faceCascadeFile); // in the callback, load the cascade from file 
        utils.createFileFromUrl(eyeCascadeFile, eyeCascadeFile, () => {
        eye_cascade.load(eyeCascadeFile); // in the callback, load the cascade from file 
        });
    });

    const ratio = Math.round((screen.height * screen.width)/ (video.height * video.width)) // ratio to which the pixels should be scaled down
    const ipd_rand = Math.random() * ((260.78/ratio) - (226.77/ratio) + 1) + (226.77/ratio)
    const ipd_ref = ipd_rand.toFixed(2) //average ipd of human in pixels with reference to the size of the canvas - pixels
    const FPS = 24;
    const Known_distance = 38.1 // in the reference image - cms
    const Known_ipd = 8.03 //cms
    const found_focal_length = 1280 // pixels
    let dist_vals  = [] // in order to store the distances and take average of the first 5 to yield more accurate results
    
    function processVideo() {
        let begin = Date.now();
        cap.read(src);
        src.copyTo(dst);
        cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
        try{
            face_cascade.detectMultiScale(gray, faces, 1.1, 3, 0);
            if(faces.size()>0) {
                let first_face = faces.get(0);
                // distance_from_screen = (Known_width * found_focal_length)/first_face.width;
                // console.log("distance from screen: "+distance_from_screen+" cms");

                let eye_coord = []
            
                for (let i = 0; i < faces.size(); ++i) {
                    let face = faces.get(i);
                    let point1 = new cv.Point(face.x, face.y);
                    let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                    cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
                    const face_width_in_frame = face.width;

                  //   console.log(face_width_in_frame)
                    let roiGray = gray.roi(face);
                    let roiSrc = src.roi(face);

                  //   let distance_from_screen = (Known_width * found_focal_length)/face_width_in_frame
                  //   console.log("distance from screen: " + distance_from_screen + " cms");

                    eye_cascade.detectMultiScale(roiGray, eyes);
                    
                    for (let j = 0; j < eyes.size(); ++j) { //draw rectangle around each eye
                        let point1 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
                        let point2 = new cv.Point(eyes.get(j).x + eyes.get(j).width,
                        eyes.get(j).y + eyes.get(j).height);

                        // Finding out the center point of the ROI which in turn gives the pupil coordinates
                        let x_coord = (2 * eyes.get(j).x + eyes.get(j).width) / 2
                        let y_coord = (2 * eyes.get(j).y + eyes.get(j).height) / 2
                        eye_coord.push([x_coord,y_coord])
                      //   console.log(eye_coord)

                        cv.rectangle(roiSrc, point1, point2, [0, 255, 255, 255]);
                    }
                  //   console.log(eye_coord[0])
                  //   console.log(eye_coord[1])

                    // if both the eyes have been recorded
                    if(eye_coord.length > 1) {
                      let dist = ((eye_coord[1][0] - eye_coord[0][0])**2 + (eye_coord[1][1] - eye_coord[0][1])**2)**0.5; //Pythagorus formula to find IPD
                      console.log("dist between eyes is " + dist);
    
                      let distance_from_screen= (ipd_ref / dist) * Known_distance; //Calculating distance from screen using similar triangles method

                      console.log("distance from screen here is: "+distance_from_screen+" cms");
                      console.log(dist_vals)

                      // Taking the average of five values
                      if (dist_vals.length == 5){
                          let sum = 0
                          for(let i = 0 ; i < 5 ; i++){
                              sum += dist_vals[i]
                          }
                          console.log("avg distance from screen here is: "+ (sum/5).toFixed(2)+" cms");
                          dist_vals = []
                      }
                      dist_vals.push(distance_from_screen);
                    }

                  //   let ipd = 0;
                  //   if(eyes.size() == 2) {

                  //       ipd = ((eyes.get(0).x - eyes.get(1).x)**2 + (eyes.get(0).y - eyes.get(1).y)**2)**0.5; // find interpupillary distance
                  //       console.log("ipd: "+ipd+" pixels");
                        
                  //       distance_from_screen = (Known_ipd * found_focal_length)/ipd;
                  //       console.log("distance from screen: "+distance_from_screen+" cms");
                  //   }
                    roiGray.delete(); roiSrc.delete();
                }      
                cv.imshow("canvas_output", src); //show eyes in green box
                // cv.imshow("canvas_output", dst); //show face in red box // not appearing
            }
        } catch(err) {
            console.log(err);
        }
        // schedule next one.
        let delay = 2000;
        setTimeout(processVideo, delay);
    }
// schedule first one.
setTimeout(processVideo, 0);
  };
  let duration = Date.now() - start
  console.log("amount of time passed is " + duration/60000)
}