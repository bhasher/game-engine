const { src, dest } = require('gulp');

exports.default = (cb) => {
  const fileExts = [
    'vert', 'frag', 'html', 'css', 'png', 'json'
  ];
  fileExts.forEach(x => {
    src(`src/**/*.${x}`)
      .pipe(dest('dist/'));
  });
  
  cb();
}