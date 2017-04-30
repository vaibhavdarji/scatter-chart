module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        concat: {
            js: {
                src: ['src/js/**/*.js'],
                dest: 'build/js/scripts.js'
            },
            css: {
                src: ['src/css/**/*.css'],
                dest: 'build/css/styles.css'
            }
      },

      watch: {
          options: {
              livereload: true
          },
          js: {
              files: ['js/**/*.js'],
              tasks: ['concat:js']
          },
          css: {
              files: ['css/**/*.css'],
              tasks: ['concat:css']
          }
      },
      clean: {
          build: ['./build']
      },

      copy: {
          build: {
              files: [
                  {src: 'index.html', dest: 'build/'},
                  {src: 'data/**.json', dest: 'build/'},
                  {src: 'lib/**.js', dest: 'build/'}
              ]
          }
      },

      express: {
          all: {
              options: {
                  port: 9000,
                  hostname: 'localhost',
                  bases: ['build'],
                  livereload: true,
                  open: true
              }
          }
      }
    });


    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-express');

    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', ['clean', 'copy', 'concat', 'watch']);

    grunt.registerTask('serve', ['express', 'build']);


};
