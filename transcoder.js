const spawn = require('child_process').spawn;

let process;

function encoder(argv, frameCallback){

  // Command to check FFmpeg's version
  const checkFFmpegCommand = 'ffmpeg -version';

  exec(checkFFmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('FFmpeg not found in the PATH or local directory.');
      console.error('Please install FFmpeg and ensure it is in the system PATH.');
      process.exit(1); // Exit with an error code
    }
  });
  
  //Inputs
  const presets = argv.presets
  const input_file = argv.input_file
  const output_folder = argv.output_folder
  const enable_multithreading = argv.threading ? '0' : '1';
  const compression_settings = argv.compression
  
  
  const _compression_map = {
    "low_comp": "15",
    "med_comp": "22",
    "high_comp": "28",
  }
  
  const _quality_map = {
      "1080": {'w': 1920, 'h': 1080, 'buf': '10M', 'rate': '5M'},
      "720": {'w': 1280, 'h': 720, 'buf': '7M', 'rate': '4M'},
      "480": {'w': 858, 'h': 480, 'buf': '5M', 'rate': '2M'},
      "360": {'w': 480, 'h': 360, 'buf': '3M', 'rate': '1.5M'},
      "240": {'w': 352, 'h': 240, 'buf': '2M', 'rate': '800k'},
      "144": {'w': 256, 'h': 144, 'buf': '1M', 'rate': '400k'},
    };
  
  const ffmpegArgs = [
    '-v', 'warning', '-hide_banner', '-threads', enable_multithreading, '-stats', '-i', input_file
  ];
  
  presets.forEach((preset, index) => {
      const qualitySettings = _quality_map[preset];
      const vOutIndex = index + 1;
      const filterComplex = `[0:v]split=1[v${vOutIndex}];[v${vOutIndex}]scale=w=${qualitySettings.w}:h=${qualitySettings.h}[v${vOutIndex}out]`;
    
      ffmpegArgs.push(
        '-filter_complex', filterComplex,
        '-map', `[v${vOutIndex}out]`, '-c:v:' + index, 'libx264', '-x264-params', 'nal-hrd=cbr:force-cfr=1',
        '-b:v:' + index, qualitySettings.rate, '-bufsize:v:' + index, qualitySettings.buf, '-preset', 'veryfast',
        '-map', 'a:0', '-c:a:' + index, 'copy'
      );
      if (compression_settings != 'no_comp'){
        ffmpegArgs.push('-crf', _compression_map[compression_settings]);
      }
    });
    
  ffmpegArgs.push(
  '-f', 'hls', '-hls_time', '10', '-hls_playlist_type', 'vod', '-hls_segment_filename', `${output_folder}/stream_%v/data%02d.ts`,
  '-master_pl_name', 'master.m3u8',
  '-var_stream_map', `${presets.map((_, i) => `v:${i},a:${i}`).join(' ')}`, `${output_folder}/stream_%v/stream.m3u8`
  );
  
  preCommandArgs = [
  '-i', input_file, '-map', '0:v:0', '-c','copy', '-f', 'null', '-'
  ]
  
  const processTotalFrame = spawn('ffmpeg', preCommandArgs )
  
  let totalFrameCount = 0; // Initialize frame count
  processTotalFrame.stderr.on('data', data => {
      const output = data.toString();
      const frameMatch = output.match(/frame=\s*(\d+)/); // Regular expression to match frame count
  
      if (frameMatch) {
          totalFrameCount = parseInt(frameMatch[1], 10); // Extract and parse frame count
          if (totalFrameCount !== 0) {
            // console.log('TOTAL_FRAME:', totalFrameCount);
            frameCallback(`TOTAL_FRAME:${totalFrameCount}`);
          }
      }
  });
  

  
  process = spawn('ffmpeg', ffmpegArgs);
  
  process.stderr.on('data', data => {
  
  const output = data.toString();
  const frameMatch = output.match(/frame=\s*(\d+)/); // Regular expression to match frame count
  
  if (frameMatch) {
      const currentFrame = parseInt(frameMatch[1], 10);
      // const percentage = (currentFrame / totalFrameCount) * 100;
      // progressBar.update(percentage / 100);
      // console.log('FRAME:', currentFrame);
      frameCallback(`FRAME:${currentFrame}`);
      }
  });
  
  process.on('exit', code => {
  // Handle exit code here
  console.log('Done');
  });
}

function killTranscodingProcess() {
  if (process) {
    process.kill(); // Terminate the process
    process = null; // Clear the reference
  }
}

module.exports = {encoder, killTranscodingProcess};
