import './App.css';
import React from 'react';

// global variables to change where necessary
// const DROPDOWN_API_ENDPOINT = 'https://u4duylmb1i.execute-api.us-east-1.amazonaws.com/prod/'; // TODO The dropdown (original py3.6)  GET/POST API
const DROPDOWN_API_ENDPOINT = 'https://p3qqh6yu55.execute-api.us-east-1.amazonaws.com/prod'; // TODO The dropdown (original py3.6)  GET/POST API
const ML_API_ENDPOINT = 'https://pq22krmubb.execute-api.us-east-1.amazonaws.com/prod/'; // TODO The ML inference POST API 
const PLOT_API_ENDPOINT = 'https://pt9okgfp10.execute-api.us-east-1.amazonaws.com/prod';  // TODO The plot API by Matplotlib POST API 


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

var text_file = [0.0, 0.0, 0.0, 0.0];

function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [textFileData, settextFileData] = React.useState(''); // represented as readable data (text string)
  const [histFileData, sethistFileData] = React.useState(''); // represented as readable data (image string)
  
  const [inputImage, setInputImage] = React.useState(''); // represented as bytes data (string)
  const [outputImage, setOutputImage] = React.useState(''); // represented as bytes data (string)

  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [submitButtonText, setSubmitButtonText] = React.useState('Submit');
  const [fileButtonText, setFileButtonText] = React.useState('Upload File');

  const [histButtonText, setHistButtonText] = React.useState('Load Histogram');


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
        const s3BucketFiles = JSON.parse(data.body);    // 'body': json.dumps({"bytesData": data, "fileType": response['ContentType']})
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

    // clear response results
    settextFileData('');
    sethistFileData('');
    setOutputImage('');
    // reset demo dropdown selection
    setSelectedDropdownFile('');


    const inputFile = event.target.files[0];

    // update file button text
    setFileButtonText(inputFile.name);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    setInputImage(base64Data);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);

    // enable submit button
    setButtonDisable(false);
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
        text_file = decodeFileBase64(outputBytesData_txt);
        settextFileData(decodeFileBase64(outputBytesData_txt));   // Setup txt output file
      }

      // // re-enable submit button
      // setButtonDisable(false);
      // setSubmitButtonText('Submit');
    })
  }

  const handleChange_2 = async (event) => {

    // clear response results
    settextFileData('');
    sethistFileData('');
    setOutputImage('');
    // reset demo dropdown selection
    setSelectedDropdownFile('');


    const inputFile = event.target.files[0];

    // update file button text
    setFileButtonText(inputFile.name);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    setInputImage(base64Data);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);

    // enable submit button
    setButtonDisable(false);
  }

    // handle calligraphy image  file submission
  // get the prediction result array
  const handleSubmit_2 = (event) => {
    event.preventDefault();

    // make POST request
    fetch(PLOT_API_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      // body: JSON.stringify({ "text": textFileData })                             // send text result to histogram lambda
      // body: JSON.stringify({ "text": text_file })  
      body: JSON.stringify({ "text": decodeFileBase64(outputBytesData_txt) })  
    }).then(response => response.json())
    .then(data => {
      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        sethistFileData(outputErrorMessage);
      }

      // POST request success
      else {
        // const outputBytesData = JSON.parse(data.body)['outputResultsData'];
        // sethistFileData(decodeImageBase64(outputBytesData));   // Setup image output file
        const histBytesData = JSON.parse(data.body)['bytesData'];
        sethistFileData(histBytesData);
        setOutputImage('data:image/png;base64,' + histBytesData);
      }

      // re-enable submit button
      setButtonDisable(false);
      setSubmitButtonText('Submit');
    })
  }



  // handle demo dropdown file selection
  const handleDropdown = (event) => {
    setSelectedDropdownFile(event.target.value);

    // temporarily disable submit button
    setButtonDisable(true);
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
      <div className="Input">       
        <h1>Junyyang's Project | Traditional Chinese Calligraphy Style recognition</h1>
        <h1>Input</h1>
        <label htmlFor="demo-dropdown">Demo: </label>
        <select name="Select Image" id="demo-dropdown" value={selectedDropdownFile} onChange={handleDropdown}>
            <option value="">-- Select Demo File --</option>
            {demoDropdownFiles.map((file) => <option key={file} value={file}>{file}</option>)}
        </select>

        {/* 
        <form onSubmit={handleSubmit}>
          <label htmlFor="file-upload">{fileButtonText}</label>
          <input type="file" id="file-upload" onChange={handleChange} />
          <button type="submit" disabled={buttonDisable}>{submitButtonText}</button>
        </form>
        */}
        
        {/* Get the text file and send to Hist Lambda */}
        {/* 
        <form onSubmit={handleSubmit_2}>
          <label htmlFor="file-upload">{histButtonText}</label>
          <input type="file" id="file-upload" onChange={handleChange_2} />
          <button type="submit" disabled={buttonDisable}>{submitButtonText}</button>
        </form>

        <img src={inputImage} alt="" />
        */}

      </div>

      {/* <div className="Output">
        <h1>Results</h1>
        <p>{textFileData}</p>
        <img src={outputImage} alt="" width="80%" height="auto" /> 
      </div> */}
      
      <a href="https://drive.google.com/file/d/1aowEQgeSo2WkMqScQzFM8IaYZUx4cul2/view?usp=sharing">REPORT LINK</a>
      
      {/* <h2>Cursive Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={crusive1} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive2} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive3} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive4} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive5} alt="Cursive Script" width="250" height="300"/></td>
          </tr></table>



          <h2>Standard Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Standard1} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard2} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard3} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard4} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard5} alt="Standard Script" width="250" height="300"/></td>
          </tr></table>

          <h2>Clerical Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Clerical1} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical2} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical3} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical4} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical5} alt="Clerical Script" width="250" height="300"/></td>
          </tr></table>

          <h2>Seal Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Seal1} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal2} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal3} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal4} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal5} alt="Seal Script" width="250" height="300"/></td>
          </tr></table> */}
    </div>
  );
}

export default App;
