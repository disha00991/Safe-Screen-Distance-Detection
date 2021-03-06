function openCvReady() {
  cv['onRuntimeInitialized'] = () => {
    let video = document.getElementById("cam_input"); // video is the id of video tag
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function (err) {
        console.log("An error occurred! " + err);
      });
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    let gray = new cv.Mat();
    let fonts = cv.FONT_HERSHEY_COMPLEX;
    let cap = new cv.VideoCapture(cam_input);
    let faces = new cv.RectVector();
    let eyes = new cv.RectVector();
    let face_cascade = new cv.CascadeClassifier();
    let eye_cascade = new cv.CascadeClassifier();
    let eyeCascadeFile = 'haarcascade_eye.xml';
    let utils = new Utils('errorMessage');
    let timeOnScreen = 0;
    var modal = document.createElement('div');

    let faceCascadeFile = 'haarcascade_frontalface_default.xml'; // path to xml
    utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
      face_cascade.load(faceCascadeFile); // in the callback, load the cascade from file 
      utils.createFileFromUrl(eyeCascadeFile, eyeCascadeFile, () => {
        eye_cascade.load(eyeCascadeFile); // in the callback, load the cascade from file 
      });
    });

    const ratio = Math.round((screen.height * screen.width) / (video.height * video.width)) // ratio to which the pixels should be scaled down
    const ipd_rand = 255.77 / ratio; // Math.random() * ((260.78 / ratio) - (226.77 / ratio) + 1) + (226.77 / ratio)  
    const ipd_ref = ipd_rand.toFixed(4) //average ipd of human in pixels with reference to the size of the canvas - pixels
    console.log(ipd_ref + "ipd_ref");
    const FPS = 24;
    const Known_distance = 38.1 // in the reference image - cms
    const Known_IPD = 6 //cm
    const avg_human_IPD = 6.3 //ipd: 61.1±3.5 mm in women and 63.6±3.9 mm
    const Known_safe_distance = 30 //should be 51, but making it 35 to account for errors in finding distance 
    const found_focal_length = 1280 // pixels
    let dist_vals = [] // in order to store the distances and take average of the first 5 to yield more accurate results
    let isPopupOpen = false
    let emergencyWindow = null;

    function updateTimePassed() {
      var timeOnScreenDiv = document.getElementsByClassName('netra-time-passed')[0];
      if (timeOnScreen < 60000) {
        timeOnScreenDiv.innerHTML = (timeOnScreen / 1000).toFixed(0) + " sec";
      } else if (timeOnScreen < 60 * 60 * 1000) { 90*1000
        let secs = (timeOnScreen / 1000).toFixed(0);
        timeOnScreenDiv.innerHTML =  (secs / 60).toFixed(0)+ " min " + secs % 60 + " sec";
      } else {
        let mins = timeOnScreen / (60 * 1000);
        timeOnScreen.innerHTML = (mins / 60).toFixed(0) + " hr " + mins % 60 + " min"
      }
    }
    function openEmergencyWindow() {
      const winHtml = `<!DOCTYPE html>
    <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" type="text/css" href="style.css"> 
            <title>Message from Netra</title>
        </head>
        <body>
        <div class="netra-modal">
        <div class="netra-modal-content">
        <p class="netra-info">Please stay further from screen for happy eyes! :)</p>
        <img class="netra-img" src='./js/icu.gif' width='50px'/>
      </div>
      </div>
        </body>
    </html>`;

      const winUrl = URL.createObjectURL(
        new Blob([winHtml], { type: "text/html" })
      );

      emergencyWindow = window.open(
        winUrl,
        "win",
        `width=800,height=400,screenX=200,screenY=200`
      );
    }

    function changeContentOnEmergencyWindow() {
      const newHtml = `
      <div class="netra-modal-content">
        <span class="netra-modal-close">&times;</span>
        <p class="netra-info">Very Nice! Make sure to maintain this distance :)</p>
        <img class="netra-img" src='./js/safedistance.gif' width='60px'/>
      </div>`;
      emergencyWindow.document.getElementsByClassName('netra-modal').innerHTML = newHtml;
      setTimeout(() => {
        if (emergencyWindow && !emergencyWindow.closed) {
          emergencyWindow.close();
          emergencyWindow = null;
        }
      }, 3500);
    }

    function whenNotInSafeDistance() {
      if (document.hidden) { //if user is on another tab
        openEmergencyWindow();
      }
      modal.setAttribute('class', "netra-modal netra-modal-close");
      modal.innerHTML = `
          <div class="netra-modal-content">
            <span class="netra-modal-close">&times;</span>
            <p class="netra-info">Please stay further from screen for happy eyes! :)</p>
            <img class="netra-img" src='./js/icu.gif' width='50px'/>
          </div>`;
      modal.style.display = "block";
      document.body.appendChild(modal);
      // Get the <span> element that closes the modal
      var span = document.getElementsByClassName("netra-modal-close")[0];

      // When the user clicks on <span> (x), close the modal
      span.onclick = function () {
        modal.style.display = "none";
        isPopupOpen = false;
      }

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
          isPopupOpen = false;
        }
      }
      isPopupOpen = true
    }

    function whenSafeDistanceReached() {
      if (emergencyWindow && !emergencyWindow.closed) { //if user is on another tab
        changeContentOnEmergencyWindow();
      }
      modal.innerHTML = `
          <div class="netra-modal-content">
            <span class="netra-modal-close">&times;</span>
            <p class="netra-info">Very Nice! Make sure to maintain this distance :)</p>
            <img class="netra-img" src='./js/safedistance.gif' width='60px'/>
          </div>`
      setTimeout(() => {
        modal.style.display = "none";
        isPopupOpen = false;
      }, 3500);
    }


    function processVideo() {
      let begin = Date.now();
      cap.read(src);
      src.copyTo(dst);
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
      try {
        face_cascade.detectMultiScale(gray, faces, 1.1, 3, 0);
        if (faces.size() > 0) {
          let first_face = faces.get(0);
          // distance_from_screen = (Known_width * found_focal_length)/first_face.width;

          let eye_coord = []

          for (let i = 0; i < faces.size(); ++i) {
            let face = faces.get(i);
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
            const face_width_in_frame = face.width;

            let roiGray = gray.roi(face);
            let roiSrc = src.roi(face);

            //   let distance_from_screen = (Known_width * found_focal_length)/face_width_in_frame

            eye_cascade.detectMultiScale(roiGray, eyes);

            for (let j = 0; j < eyes.size(); ++j) { //draw rectangle around each eye
              let point1 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
              let point2 = new cv.Point(eyes.get(j).x + eyes.get(j).width,
                eyes.get(j).y + eyes.get(j).height);

              // Finding out the center point of the ROI which in turn gives the pupil coordinates
              let x_coord = (2 * eyes.get(j).x + eyes.get(j).width) / 2
              let y_coord = (2 * eyes.get(j).y + eyes.get(j).height) / 2
              eye_coord.push([x_coord, y_coord])

              cv.rectangle(roiSrc, point1, point2, [0, 255, 255, 255]);
            }

            roiGray.delete(); roiSrc.delete();
          }
          // if both the eyes have been recorded
          if (eye_coord.length == 2) { //==2 so that no distance is predicted when more than 2 eyes are detected (nostrils, other circles etc)
            timeOnScreen += 500;
            updateTimePassed();
            let estimated_ipd = ((eye_coord[1][0] - eye_coord[0][0]) ** 2 + (eye_coord[1][1] - eye_coord[0][1]) ** 2) ** 0.5; //Pythagorus formula to find IPD in pixels
            console.log("ipd " + estimated_ipd.toFixed(2) + " pixels");

            let distance_from_screen = (ipd_ref * Known_distance * avg_human_IPD) / (Known_IPD * estimated_ipd); //Calculating distance from screen using similar triangles method

            console.log("distance from screen: " + distance_from_screen.toFixed(2) + " cms");
            // console.log(dist_vals)
            let text = "Distance:" + distance_from_screen.toFixed(2) + " cm";

            dist_vals.push(distance_from_screen);
            // Taking the average of five values
            if (dist_vals.length == 3) {
              let mean_dist = 0;
              for (let i = 0; i < dist_vals.length; i++) {
                mean_dist += dist_vals[i] / dist_vals.length;
              }
              if (mean_dist)
                console.log("avg dist from screen: " + (mean_dist).toFixed(2) + " cms");
              if (mean_dist < Known_safe_distance && !isPopupOpen) {
                whenNotInSafeDistance()
              } else if (mean_dist >= Known_safe_distance && isPopupOpen) {
                whenSafeDistanceReached()
              }
              // cv.putText(src, text2, (30, 55), fonts, 0.6, [0, 255, 255, 255], 2);
              dist_vals = []
            }
            // cv.putText(src, text, (30, 45), fonts, 0.6, [0, 255, 255, 255], 2);

            //   let ipd = 0;
            //   if(eyes.size() == 2) {

            //       ipd = ((eyes.get(0).x - eyes.get(1).x)**2 + (eyes.get(0).y - eyes.get(1).y)**2)**0.5; // find interpupillary distance
            //       

            //       distance_from_screen = (Known_ipd * found_focal_length)/ipd;

            //   }
          }
          cv.imshow("canvas_output", src); //show eyes in green box
          // cv.imshow("canvas_output", dst); //show face in red box // not appearing
        }
      } catch (err) {
        console.log(err);
      }
      // schedule next one.
      let delay = 500;
      setTimeout(processVideo, delay);
    }
    // schedule first one.
    setTimeout(processVideo, 0);
  };
}


/*
challenges: understanding of opencv
children and adults have different ipd length
multiple user detection
websites now do not let you add another html component
*/