
console.log('h1')
console.log(myAPI.node())
M.AutoInit();
const { electron,ipcRenderer } = window;

const resetBtn = document.getElementById('resetBtn');
const inputVideo = document.getElementById('inputVideo');
const inputFileLabel = document.getElementById('inputFileLabel');
const outputFolder = document.getElementById('outputFolder');
const outputLabel = document.getElementById('outputLabel');

const compressionSelect = document.getElementById("compressionSelect");
const compressionSelectInput = document.querySelectorAll('.select-dropdown');
const threadingEnabledSwitch = document.getElementById("threadingEnabledSwitch");
const presetBoxes = document.querySelectorAll('.filled-in');
const buttons = document.querySelectorAll('.input-field');
const startEncodingBtn = document.getElementById("startEncodingBtn");
const progressBar = document.getElementById("progressBar");
const progressPercentage = document.getElementById("progressPercentage");
const progressContainer = document.querySelectorAll(".progressContainer");

var startButtonEnabled = true;

const payload = {
    inputFile: undefined,
    outputFolder: undefined,
    selectedPresets: [1080,720,480,360,240,144],
    compressionSettings: "no_comp",
    enableMultiThreading: true,
}



function resetAll(e){
    inputFileLabel.textContent = "%empty%"
    payload.inputFile = undefined
    
    outputLabel.textContent = "%empty%";
    payload.outputFolder = undefined;
    
    payload.selectedPresets = [1080,720,480,360,240,144]
    presetBoxes.forEach((checkbox) => {
        checkbox.checked= true
    })
    
    payload.compressionSettings = "no_comp";
    compressionSelect.value = 'no_comp';
    // Trigger Materialize CSS to update the UI
    M.FormSelect.init(compressionSelect);

    threadingEnabledSwitch.checked = true;
    payload.enableMultiThreading = true;

    progressContainer.forEach((el)=>{el.style.display='none';})
    
    var toastHTML = '<span><i class="material-icons left">check_circle</i>Success: Reset.</span>';
    M.toast({html: toastHTML, classes:'toast-success'});
    console.log('PAYLOAD=>',payload);
}

function uiToggler(view){
    if (view){ //enabled
        resetBtn.disabled=false;
        resetBtn.classList.remove('disabled');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
        presetBoxes.forEach((checkbox) => {
            checkbox.disabled = false;
          });
        progressContainer.forEach((el)=>{el.style.display='none';})
    }
    else{ //disable
        resetBtn.disabled=true;
        resetBtn.classList.add('disabled');
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
          });
          presetBoxes.forEach((checkbox) => {
            checkbox.disabled = true;
          });
          progressContainer.forEach((el)=>{el.style.display='flex';})
          
    }
}
function disableClickHandler(event) {
    event.preventDefault();
  }
function loadInputVideo(e) {
    e.preventDefault();
    const file = e.target.files[0];
    const acceptedVideoExtensions = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mkv',
        'video/mov',
        'video/wmv',
    ];
    // Check if the file is video
    if (!acceptedVideoExtensions.includes(file['type'])) {
        var toastHTML = '<span><i class="material-icons left">error</i>Error: Only video file is allowed.</span>';
        M.toast({html: toastHTML, classes:'toast-error'});
    }
    else{
        inputFileLabel.textContent = file['name']
        payload.inputFile = file['path']
        console.log('PAYLOAD=>',payload);
    }
}


async function loadoutputFolder(e){
    e.preventDefault();
    window.myAPI.selectFolder().then(result=>{
        if (!result) {
            payload.outputFolder = undefined;
            outputLabel.textContent = "%empty%";
        }
        else{
            payload.outputFolder = `${result}/output`;
            outputLabel.textContent =  payload.outputFolder;
        }
        console.log('PAYLOAD=>',payload);
    })
}

function loadcompressionSelect(e){
    const selectedOption = compressionSelect.options[compressionSelect.selectedIndex];
    payload.compressionSettings = selectedOption.value;
    console.log('PAYLOAD=>',payload);
}

function loadthreadingEnabledSwitch(e){
    const isSwitchEnabled = threadingEnabledSwitch.checked;
    payload.enableMultiThreading = isSwitchEnabled;
    console.log('PAYLOAD=>',payload);
}


presetBoxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      // Toggle the checked state
      checkbox.checked = event.target.checked;
      const dataValue = parseInt(checkbox.getAttribute('data-value'));
        if (checkbox.checked) {
            // Checkbox is checked
            payload.selectedPresets.push(dataValue);
            payload.selectedPresets.sort((a, b) => b - a);
        } else {
            // Checkbox is not checked
            payload.selectedPresets= payload.selectedPresets.filter((item) => item !== dataValue);
            payload.selectedPresets.sort((a, b) => b - a);
        }
      console.log('PAYLOAD=>',payload);
    });
  });

function loadstartEncodingBtn(e){
   
    
    if (startButtonEnabled){ // Start encoding button
        if (!payload.inputFile){
            var toastHTML = '<span><i class="material-icons left">error</i>Error: Select source file.</span>';
            M.toast({html: toastHTML, classes:'toast-error'});
            return
        }
        if (!payload.outputFolder){
            var toastHTML = '<span><i class="material-icons left">error</i>Error: Select output folder.</span>';
            M.toast({html: toastHTML, classes:'toast-error'});
            return
        }
    
        if (payload.selectedPresets.length <= 0){
            var toastHTML = '<span><i class="material-icons left">error</i>Error: Atleast select one preset.</span>';
            M.toast({html: toastHTML, classes:'toast-error'});
            return
        }
        uiToggler(false);
        startEncodingBtn.classList.remove('blue');
        startEncodingBtn.classList.add('red');
        startEncodingBtn.innerHTML= `<i class="material-icons left">cancel</i>Stop Encoding`
        startButtonEnabled=false;
        threadingEnabledSwitch.disabled = true;
        compressionSelectInput.forEach((el)=>{el.disabled=true;})

        const argv = {
            presets: payload.selectedPresets,
            input_file : payload.inputFile,
            output_folder: payload.outputFolder,
            enable_multithreading: payload.enableMultiThreading,
            compression: payload.compressionSettings,
        }
        var totalFrameCount = 0;
        let currentFrame = 0;
        function handleEncoderOutput(outputData) {
            const totalFrameMatch = outputData.match(/TOTAL_FRAME:\s*(\d+)/);
            const frameMatch = outputData.match(/FRAME:\s*(\d+)/);
            if (totalFrameMatch) {
                totalFrameCount = parseInt(totalFrameMatch[1], 10);
                // console.log('Total Frame Count:', totalFrameCount);
            } else if (frameMatch) {
                currentFrame = parseInt(frameMatch[1], 10);
                const percentage = ((currentFrame / totalFrameCount) * 100);
                // console.log('Current Frame:', currentFrame);
                // console.log('Percentage:', percentage);
                progressBar.style.width = `${percentage}%`;
                progressPercentage.textContent=`${percentage.toFixed(2)}`;
                if (percentage.toFixed(2) == "100.00"){ //complete
                    var toastHTML = '<span><i class="material-icons left">check_circle</i>Success: Encoding Completed.</span>';
                    M.toast({html: toastHTML, classes:'toast-success'});
                    resetBtn.disabled=false;
                    resetBtn.classList.remove('disabled');
                    buttons.forEach(button => {
                        button.disabled = false;
                        button.classList.remove('disabled');
                    });
                    presetBoxes.forEach((checkbox) => {
                        checkbox.disabled = false;
                      });
                    startEncodingBtn.classList.add('blue');
                    startEncodingBtn.classList.remove('red');
                    startEncodingBtn.innerHTML= `<i class="material-icons left">layers</i>Start Encoding`
                    startButtonEnabled=true;
                    threadingEnabledSwitch.disabled = false;
                    compressionSelectInput.forEach((el)=>{el.disabled=false;})
                }
            }
        }
    
        // Call the startEncoder function with argv and the callback

        window.myAPI.startEncoder(argv, handleEncoderOutput);
    }
    else{  //Cancel Encoding button
        window.myAPI.killTranscodingProcess();
        startEncodingBtn.classList.add('blue');
        startEncodingBtn.classList.remove('red');
        startEncodingBtn.innerHTML= `<i class="material-icons left">layers</i>Start Encoding`
        startButtonEnabled=true;
        threadingEnabledSwitch.disabled = false;
        compressionSelectInput.forEach((el)=>{el.disabled=false;})
        uiToggler(true);
    }
    //Update progress bar, also show percentage and ETA.
}

inputVideo.addEventListener('change', loadInputVideo);
outputFolder.addEventListener('click', loadoutputFolder);
compressionSelect.addEventListener('change', loadcompressionSelect);
threadingEnabledSwitch.addEventListener('change', loadthreadingEnabledSwitch);
startEncodingBtn.addEventListener('click', loadstartEncodingBtn);
resetBtn.addEventListener('click', resetAll);
