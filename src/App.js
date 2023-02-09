import './App.css';
import React from 'react';

// global variables to change where necessary
const DROPDOWN_API_ENDPOINT = 'https://p3qqh6yu55.execute-api.us-east-1.amazonaws.com/prod'; // TODO The dropdown (original)  GET/POST API
const ML_API_ENDPOINT = 'https://pq22krmubb.execute-api.us-east-1.amazonaws.com/prod/'; // TODO The ML inference POST REST API 
const PLOT_API_ENDPOINT = 'https://pt9okgfp10.execute-api.us-east-1.amazonaws.com/prod';  // The histogram ploting POST API


// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};

// atob is deprecated but this function converts base64string to text string
const decodeImageBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string

  return "data:image/png;base64," + base64String
};

// var text_file = [0.0, 0.0, 0.0, 0.0];


// Setup two buttons; one for submit image, another for load result histogram;
function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [textFileData, settextFileData] = React.useState(''); // represented as readable data (text string)
  const [histFileData, sethistFileData] = React.useState(''); // represented as readable data (image string)
  
  const [inputImage, setInputImage] = React.useState(''); // represented as bytes data (string)
  // const [outputImage, setOutputImage] = React.useState(''); // represented as bytes data (string)

  // submit button
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [submitButtonText, setSubmitButtonText] = React.useState('Submit');

  // Choose your own image .png
  const [fileButtonText, setFileButtonText] = React.useState('Upload File');

  // loadhist button
  const [loadButtonDisable, setLoadButtonDisable] = React.useState(true);
  const [loadButtonText, setLoadButtonText] = React.useState('Load Prediction Histogram');


  const [demoDropdownFiles, setDemoDropdownFiles] = React.useState([]);
  const [selectedDropdownFile, setSelectedDropdownFile] = React.useState('');

  // make GET request to get demo files on load -- takes a second to load
  React.useEffect(() => {
    fetch(DROPDOWN_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
      // GET request error
      if (data.statusCode === 400) {
        console.log('Sorry! There was an error, the demo files are currently unavailable.')
      }

      // GET request success
      else {
        const s3BucketFiles = JSON.parse(data.body);
        setDemoDropdownFiles(s3BucketFiles["s3Files"]);
      }
    });
  }, [])


  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }


  // handle file input
  const handleChange = async (event) => {
    const inputFile = event.target.files[0];

    // update after loading client's image file button text
    setFileButtonText(inputFile.name);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    setInputImage(base64Data);

    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);

    // enable submit button
    setButtonDisable(false);
    setLoadButtonDisable(false);

    // clear response results
    settextFileData('');
    sethistFileData('');

    // reset demo dropdown selection
    setSelectedDropdownFile('');
  }


  // handle calligraphy image  file submission
  // get the prediction result array
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setSubmitButtonText('Loading Result...');

    // make POST request
    fetch(ML_API_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "image": inputFileData })                             // send calligraphy image to ML lambda
    }).then(response => response.json())
    .then(data => {
      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        settextFileData(outputErrorMessage);
      }

      // POST request success
      else {
        const outputBytesData_txt = JSON.parse(data.body)['outputResultsData'];
        // text_file = decodeFileBase64(outputBytesData_txt);
        settextFileData(decodeFileBase64(outputBytesData_txt));   // Setup txt output file


        // Activate the Submit button after choose image from the dropdown list
        setLoadButtonText('Load Prediction Histogram');
        setLoadButtonDisable(false);
      }

      // // re-enable submit button
      // setButtonDisable(false);
      // setSubmitButtonText('Submit');
    })
  }

  // ===============================================
  // handle showing prediction histogram result
  const handleLoadhist = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setLoadButtonDisable(true);
    setLoadButtonText('Loading Prediction Histogram...');

    // make POST request
    fetch(PLOT_API_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "text": textFileData })                             // send text result to histogram lambda
    }).then(response => response.json())
    .then(data => {
      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['bytesData'];
        sethistFileData(outputErrorMessage);
      }


      
      // POST request success
      else {
        const outputBytesData = JSON.parse(data.body)['bytesData'];
        sethistFileData(decodeImageBase64(outputBytesData));   // Setup txt output file
      }

      // re-enable submit button
      setButtonDisable(false);
      setSubmitButtonText('Submit');

      setLoadButtonDisable(true);
      setLoadButtonText('Load Prediction Histogram After Submitting');
    })
  }
  // ===============================================
  


  // handle demo dropdown file selection
  const handleDropdown = (event) => {
    setSelectedDropdownFile(event.target.value);

    // temporarily disable submit button
    setButtonDisable(true);
    setLoadButtonDisable(true);
    setSubmitButtonText('Loading Demo File...');

    // only make POST request on file selection
    if (event.target.value) {
      fetch(DROPDOWN_API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ "fileName": event.target.value })
      }).then(response => response.json())
      .then(data => {

        // POST request error
        if (data.statusCode === 400) {
          console.log('Uh oh! There was an error retrieving the dropdown file from the S3 bucket.')
        }

        // POST request success
        else {
          const dropdownFileBytesData = JSON.parse(data.body)['bytesData'];
          setInputFileData(dropdownFileBytesData);
          setInputImage('data:image/png;base64,' + dropdownFileBytesData); // hacky way of setting image from bytes data - even works on .jpeg lol
          
          // Activate the Submit button after choose image from the dropdown list
          setSubmitButtonText('Submit');
          setButtonDisable(false);

        }
      });
    }

    else {
      setInputFileData('');
    }
  }


  return (
    <div className="App">

      <div className="Instruction">
        <h1>How to use</h1>
        <p>
          <b>Steps:</b> 
          <p>1. Upload your own image by "Upload File" OR select the demo image form the dropdown lists.</p>
          <p> &#40; Loading the image and convert to bytes data if uploaded by your own &#41; . </p>
          <p> </p>
          <p>2. Click "Submit" button and receive the prediction scores. </p>
          <p> &#40; Using the POST API to upload the image butes data to ML lambda and do the inferrence. Return back the prediction scores. </p>
          <p> </p>
          <p>3. Click "Load Prediction Histogram" button and receive the histogram of prediction scores.</p>
          <p> &#40; Using the POST API to upload the prediction scores to Histogram Ploting lambda. Return back the prediction histogram. </p>
          
        </p>

      </div>


      <div className="Input">
        <h1>Junyyang's Project | Traditional Chinese Calligraphy Style recognition</h1>
        <a href="https://drive.google.com/file/d/1aowEQgeSo2WkMqScQzFM8IaYZUx4cul2/view?usp=sharing">REPORT LINK</a>
        <h1>Input</h1>
        <label htmlFor="demo-dropdown">Demo: </label>
        <select name="Select Image" id="demo-dropdown" value={selectedDropdownFile} onChange={handleDropdown}>
            <option value="">-- Select Demo File --</option>
            {demoDropdownFiles.map((file) => <option key={file} value={file}>{file}</option>)}
        </select>

        {/*Upload button and Submit buttion*/}
        <form onSubmit={handleSubmit}>
          <label htmlFor="file-upload">{fileButtonText}</label>
          <input type="file" id="file-upload" onChange={handleChange} />
          <button type="submit" disabled={buttonDisable}>{submitButtonText}</button>
        </form>


        {/*Load Histogram buttion*/}
        <form onSubmit={handleLoadhist}>
          <button type="submit" disabled={loadButtonDisable}>{loadButtonText}</button>
        </form>

        <img src={inputImage} alt="" />
      </div>

      <div className="Output">
        <h1>Results</h1>
        <p>{textFileData}</p>
        <img src={histFileData} alt="" width="80%" height="auto" /> 
      </div>
      
      
    </div>
  );
}

export default App;
