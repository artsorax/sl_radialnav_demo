gulp = require 'gulp'
connect = require 'gulp-connect'
coffee = require 'gulp-coffee'

gulp.task 'connect', ->
  connect.server
    port: 1337
    livereload: on
    root: './dist'

gulp.task 'coffee', ->
  gulp.src 'coffee/*.coffee'
    .pipe do coffee
    .pipe gulp.dest 'dist/js'
    .pipe do connect.reload

gulp.task 'watch', ->
  gulp.watch 'coffee/*.coffee', ['coffee']

gulp.task 'default', ['coffee', 'connect', 'watch']