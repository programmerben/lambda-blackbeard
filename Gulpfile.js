var gulp = require('gulp');
var zip = require('gulp-zip');
var del = require('del');
var install = require('gulp-install');
var runSequence = require('run-sequence');
var awsLambda = require("node-aws-lambda");

gulp.task('clean', function(cb) {
  del(['./dist', './dist.zip'], cb);
});

gulp.task('copy', function() {
  return gulp.src(['./couchpotato.js', './kodi.js','index.js', 'util.js', 'sickrage.js'])
    .pipe(gulp.dest('dist/'));
});

gulp.task('node-mods', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist/'))
    .pipe(install({production: true}));
});

// Clean up all aws-sdk directories from node_modules. We don't
// need to upload them since the Lambda instance will already
// have it available globally.
gulp.task('clean-aws-sdk', function(callback) {
  del(['dist/node_modules/**/aws-sdk'], callback);
});

gulp.task('zip', function() {
  return gulp.src(['dist/**/*', '!dist/package.json'])
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('upload', function(callback) {
  awsLambda.deploy('./dist.zip', require("./lambda-config.js"), callback);
});

gulp.task('deploy', function(callback) {
  return runSequence(
    ['clean'],
    ['copy'],
    ['node-mods'],
    ['clean-aws-sdk'],
    ['zip'],
    ['upload'],
    callback
  );
});
